import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaClock, FaMapMarkerAlt, FaEuroSign, FaCalendarAlt } from 'react-icons/fa';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axios';

const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/bookings/my-bookings');
      setBookings(response.data.bookings);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Échec du chargement des réservations. Veuillez réessayer plus tard.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async bookingId => {
    try {
      await axiosInstance.post(`/bookings/${bookingId}/cancel`);
      toast.success('Réservation annulée avec succès');
      fetchBookings();
    } catch (err) {
      console.error('Error canceling booking:', err);
      toast.error(err.response?.data?.message || "Erreur lors de l'annulation de la réservation");
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const appointmentDate = new Date(booking.appointmentDate);
    const today = new Date();

    if (activeTab === 'upcoming') {
      return appointmentDate >= today;
    } else if (activeTab === 'past') {
      return appointmentDate < today;
    }
    return true;
  });

  // Sort bookings by date (most recent first for past, soonest first for upcoming)
  filteredBookings.sort((a, b) => {
    const dateA = new Date(a.appointmentDate);
    const dateB = new Date(b.appointmentDate);

    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mes réservations</h1>
          <p className="mt-4 text-lg text-gray-600">
            Gérez vos réservations de sessions et de services
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-4 px-6 ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            À venir
          </button>
          <button
            className={`py-4 px-6 ${
              activeTab === 'past'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Passées
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredBookings.length > 0 ? (
          <div className="space-y-6">
            {filteredBookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.service?.name || 'Session'}
                      </h3>
                      <p className="text-gray-600">
                        {booking.professional?.businessName || 'Professionnel'}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status === 'confirmed'
                          ? 'Confirmée'
                          : booking.status === 'pending'
                            ? 'En attente'
                            : booking.status === 'cancelled'
                              ? 'Annulée'
                              : booking.status === 'completed'
                                ? 'Terminée'
                                : booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {booking.appointmentTime.start} - {booking.appointmentTime.end}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {booking.location.type === 'online'
                          ? 'Session en ligne'
                          : booking.location.address?.street &&
                            `${booking.location.address.street}, ${booking.location.address.city}`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FaEuroSign className="text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {booking.totalAmount.amount} {booking.totalAmount.currency}
                      </span>
                    </div>
                  </div>

                  {booking.clientNotes && (
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="text-sm text-gray-600">{booking.clientNotes}</p>
                    </div>
                  )}

                  {/* Actions based on booking status */}
                  <div className="mt-4 flex justify-end space-x-3">
                    {booking.status === 'pending' || booking.status === 'confirmed' ? (
                      <>
                        {booking.location.type === 'online' && booking.location.onlineLink && (
                          <a
                            href={booking.location.onlineLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                          >
                            Rejoindre la session
                          </a>
                        )}
                        <button onClick={() => cancelBooking(booking._id)} className="btn-danger">
                          Annuler
                        </button>
                      </>
                    ) : booking.status === 'completed' ? (
                      <button className="btn-primary">Laisser un avis</button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {activeTab === 'upcoming'
                ? "Vous n'avez aucune réservation à venir"
                : "Vous n'avez aucune réservation passée"}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming'
                ? 'Explorez notre liste de professionnels pour réserver votre prochaine session'
                : 'Vos réservations passées apparaîtront ici'}
            </p>
            {activeTab === 'upcoming' && (
              <a href="/for-you" className="btn-primary inline-block">
                Découvrir des professionnels
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
