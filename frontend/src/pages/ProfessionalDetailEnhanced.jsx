import axios from 'axios';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaStar,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaClock,
  FaEuroSign,
} from 'react-icons/fa';
import { useParams, Link } from 'react-router-dom';

import BookingModal from '../components/Common/BookingModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import PaymentModal from '../components/Common/PaymentModal';
import { useAuth } from '../contexts/AuthContext';

const ProfessionalDetailEnhanced = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedSession, setSelectedSession] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        const response = await axios.get(`/api/professionals/${id}`);
        setProfessional(response.data.professional);
      } catch (err) {
        console.error('Error fetching professional:', err);
        // Instead of showing an error, use a fallback mock professional
        const mockProfessional = {
          _id: id,
          businessName: 'Professionnel',
          businessType: 'service',
          description: 'Les détails de ce professionnel ne sont pas disponibles pour le moment.',
          rating: { average: 0, totalReviews: 0 },
          bookingMode: 'manual',
          paymentEnabled: false,
        };
        setProfessional(mockProfessional);
        toast.error(
          'Impossible de charger les détails du professionnel. Affichage des données de démonstration.'
        );
      }
    };

    const fetchSessions = async () => {
      try {
        const response = await axios.get(`/api/sessions/professional/${id}`);
        setSessions(response.data.sessions || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        // Instead of setting an error, just set empty sessions
        setSessions([]);
        // Show a toast notification
        toast.error(
          'Impossible de charger les sessions. Les horaires ne sont pas disponibles pour le moment.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
    fetchSessions();
  }, [id]);

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleBookSession = session => {
    if (!user) {
      toast.error('Veuillez vous connecter pour réserver une session');
      return;
    }

    setSelectedSession(session);
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async notes => {
    try {
      const newBookingData = {
        professionalId: professional._id,
        sessionId: selectedSession._id,
        clientNotes: notes,
      };

      setBookingData(newBookingData);
      setBookingModalOpen(false);

      if (professional.paymentEnabled) {
        setPaymentModalOpen(true);
      } else {
        // If payment is not enabled, submit booking without payment
        await submitBooking(newBookingData);
      }
    } catch (err) {
      console.error('Error preparing booking:', err);
      toast.error('Erreur lors de la préparation de la réservation');
    }
  };

  const handlePaymentSubmit = async paymentMethod => {
    try {
      // Add payment information to booking data
      const bookingWithPayment = {
        ...bookingData,
        paymentMethod,
        paymentStatus: 'paid',
      };

      await submitBooking(bookingWithPayment);
      setPaymentModalOpen(false);
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Erreur lors du traitement du paiement');
    }
  };

  const submitBooking = async data => {
    try {
      const response = await axios.post('/api/bookings', data);

      // Send confirmation email
      await axios.post('/api/notifications/booking-confirmation', {
        bookingId: response.data.booking._id,
      });

      toast.success('Réservation effectuée avec succès! Un email de confirmation a été envoyé.');
      setSelectedSession(null);
    } catch (err) {
      console.error('Error booking session:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation');
    }
  };

  const getDaysSessions = date => {
    return sessions.filter(session => {
      const sessionDate = parseISO(session.startTime);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Professional Not Found</h1>
            <p className="mt-4 text-lg text-gray-600">
              Le professionnel que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Link
              to="/professionals"
              className="mt-6 inline-block bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
            >
              Retour à la liste des professionnels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare the days for the week view
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Image Gallery */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="relative h-96">
            {professional.coverImages && professional.coverImages.length > 0 ? (
              <>
                <img
                  src={
                    professional.coverImages[activeImageIndex]?.startsWith('http') ||
                    professional.coverImages[activeImageIndex]?.startsWith('/uploads')
                      ? professional.coverImages[activeImageIndex]?.startsWith('/uploads')
                        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${professional.coverImages[activeImageIndex]}`
                        : professional.coverImages[activeImageIndex]
                      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/profiles/${professional.coverImages[activeImageIndex]}`
                  }
                  alt={professional.businessName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    console.log('Image error:', e.target.src);
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000';
                  }}
                />
                {professional.coverImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {professional.coverImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000"
                alt={professional.businessName || 'Professional'}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{professional.businessName}</h1>
              <p className="text-lg text-gray-600 mt-2 capitalize">{professional.businessType}</p>

              {/* Rating */}
              <div className="flex items-center mt-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`${
                      i < Math.floor(professional.rating?.average || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {professional.rating?.average?.toFixed(1) || 0} (
                  {professional.rating?.totalReviews || 0} avis)
                </span>
                <Link
                  to={`/professionals/${id}/reviews`}
                  className="ml-3 text-primary-600 text-sm hover:underline"
                >
                  Voir plus
                </Link>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">À propos</h2>
                <p className="text-gray-600">{professional.description}</p>
              </div>

              {/* Address with map link */}
              {professional.businessAddress && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Adresse</h2>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-gray-500 mt-1 mr-2" />
                    <div>
                      <p className="text-gray-600">
                        {professional.address ||
                          (professional.businessAddress.street
                            ? `${professional.businessAddress.street}${professional.businessAddress.city ? ', ' + professional.businessAddress.city : ''}${professional.businessAddress.postalCode ? ', ' + professional.businessAddress.postalCode : ''}${professional.businessAddress.country ? ', ' + professional.businessAddress.country : ', Morocco'}`
                            : `${professional.businessAddress.city || ''}${professional.businessAddress.country ? ', ' + professional.businessAddress.country : ', Morocco'}`)}
                      </p>
                      {professional.businessAddress.coordinates &&
                        professional.businessAddress.coordinates.lat &&
                        professional.businessAddress.coordinates.lng && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${professional.businessAddress.coordinates.lat},${professional.businessAddress.coordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 text-sm hover:underline mt-1 inline-block"
                          >
                            Voir sur la carte
                          </a>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {professional.contactInfo && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
                  <div className="space-y-2">
                    {professional.contactInfo.phone && (
                      <div className="flex items-center">
                        <FaPhone className="text-gray-500 mr-2" />
                        <a href={`tel:${professional.contactInfo.phone}`} className="text-gray-600">
                          {professional.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {professional.contactInfo.website && (
                      <div className="flex items-center">
                        <FaGlobe className="text-gray-500 mr-2" />
                        <a
                          href={professional.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {professional.contactInfo.website}
                        </a>
                      </div>
                    )}

                    {/* Social Media */}
                    {professional.contactInfo.socialMedia && (
                      <div className="flex items-center space-x-3 mt-2">
                        {professional.contactInfo.socialMedia.facebook && (
                          <a
                            href={professional.contactInfo.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaFacebook size={20} />
                          </a>
                        )}
                        {professional.contactInfo.socialMedia.instagram && (
                          <a
                            href={professional.contactInfo.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800"
                          >
                            <FaInstagram size={20} />
                          </a>
                        )}
                        {professional.contactInfo.socialMedia.linkedin && (
                          <a
                            href={professional.contactInfo.socialMedia.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900"
                          >
                            <FaLinkedin size={20} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Calendar */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Planning</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePreviousWeek}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    &lt; Précédente
                  </button>
                  <button
                    onClick={handleNextWeek}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Suivante &gt;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-2 text-center">
                      <p className="font-medium text-sm">{format(day, 'EEEE', { locale: fr })}</p>
                      <p className="text-lg">{format(day, 'd MMM', { locale: fr })}</p>
                    </div>
                    <div className="p-2 min-h-[100px]">
                      {getDaysSessions(day).length > 0 ? (
                        getDaysSessions(day).map(session => (
                          <div
                            key={session._id}
                            className="mb-2 p-2 bg-primary-50 border border-primary-100 rounded-md cursor-pointer hover:bg-primary-100"
                            onClick={() => handleBookSession(session)}
                          >
                            <p className="font-medium text-sm">{session.title}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <FaClock className="mr-1" />
                              {format(parseISO(session.startTime), 'HH:mm')}
                            </div>
                            <div className="flex justify-between items-center mt-1 text-xs">
                              <div className="flex items-center">
                                <FaClock className="mr-1 text-gray-500" />
                                <span>{session.duration} min</span>
                              </div>
                              <div className="flex items-center">
                                <FaEuroSign className="mr-1 text-gray-500" />
                                <span>{session.price} MAD</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Pas de sessions</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Informations de réservation
              </h2>

              {/* Booking Mode */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">Mode de réservation</h3>
                <div className="flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${professional.bookingMode === 'auto' ? 'bg-green-500' : 'bg-blue-500'}`}
                  ></span>
                  <p className="text-gray-600">
                    {professional.bookingMode === 'auto'
                      ? 'Réservation directe'
                      : 'Demande de réservation'}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {professional.bookingMode === 'auto'
                    ? 'Vous pouvez réserver directement les sessions disponibles.'
                    : 'Vos demandes de réservation seront soumises à confirmation par le professionnel.'}
                </p>
              </div>

              {/* Payment */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">Paiement</h3>
                <div className="flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${professional.paymentEnabled ? 'bg-green-500' : 'bg-yellow-500'}`}
                  ></span>
                  <p className="text-gray-600">
                    {professional.paymentEnabled
                      ? 'Paiement en ligne disponible'
                      : 'Paiement sur place uniquement'}
                  </p>
                </div>
              </div>

              {/* Certifications */}
              {professional.certifications && professional.certifications.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Certifications</h3>
                  <ul className="space-y-1">
                    {professional.certifications.map((cert, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {cert.name} - {cert.issuingOrganization}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && selectedSession && (
        <BookingModal
          session={selectedSession}
          professional={professional}
          onClose={() => setBookingModalOpen(false)}
          onSubmit={handleBookingSubmit}
        />
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedSession && (
        <PaymentModal
          session={selectedSession}
          onClose={() => setPaymentModalOpen(false)}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
};

export default ProfessionalDetailEnhanced;
