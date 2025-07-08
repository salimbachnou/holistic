import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaClock,
  FaMapMarkerAlt,
  FaEuroSign,
  FaCalendarAlt,
  FaVideo,
  FaUser,
  FaPlus,
  FaLink,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { sessionAPI } from '../utils/api';

const ClientSessionsPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [error, setError] = useState(null);
  const [errorAvailable, setErrorAvailable] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await sessionAPI.getMySessions();
      setSessions(response.data.sessions);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Échec du chargement des sessions. Veuillez réessayer plus tard.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSessions = async () => {
    setLoadingAvailable(true);
    try {
      // Récupérer toutes les sessions disponibles (futures et non annulées)
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/sessions`, {
        params: {
          status: 'scheduled',
          startDate: new Date().toISOString(),
          sortBy: 'startTime',
          sortOrder: 'asc',
          limit: 50,
        },
      });

      // Vérifier si la réponse contient des sessions
      if (!response.data.success || !response.data.sessions) {
        setErrorAvailable('Aucune session disponible trouvée.');
        setAvailableSessions([]);
        return;
      }

      // Filtrer les sessions où l'utilisateur n'est pas déjà participant
      // Vérifier d'abord si sessions existe et n'est pas vide
      let filteredSessions;
      if (sessions && sessions.length > 0) {
        const mySessionIds = sessions.map(session => session._id);
        filteredSessions = response.data.sessions.filter(
          session => !mySessionIds.includes(session._id) && session.availableSpots > 0
        );
      } else {
        // Si l'utilisateur n'a pas encore de sessions, afficher toutes les sessions disponibles
        filteredSessions = response.data.sessions.filter(session => session.availableSpots > 0);
      }

      setAvailableSessions(filteredSessions);
      console.log(`Sessions disponibles trouvées: ${filteredSessions.length}`);
      setErrorAvailable(null);
    } catch (err) {
      console.error('Error fetching available sessions:', err);
      setErrorAvailable('Échec du chargement des sessions disponibles.');
      setAvailableSessions([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Filter sessions based on active tab
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    const today = new Date();

    if (activeTab === 'upcoming') {
      return sessionDate >= today && session.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return sessionDate < today || session.status === 'cancelled';
    }
    return true;
  });

  // Sort sessions by date
  filteredSessions.sort((a, b) => {
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);

    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  const handleSessionSelect = session => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  const handleBookSession = async session => {
    if (bookingInProgress) return;

    setBookingInProgress(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Utiliser l'API de booking pour créer une réservation
      await axios.post(
        `${API_URL}/api/bookings`,
        {
          professionalId: session.professionalId._id || session.professionalId,
          sessionId: session._id,
          bookingType: 'direct',
          notes: 'Réservation directe depuis les sessions disponibles',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Session réservée avec succès !');

      // Rafraîchir les sessions
      fetchSessions();
      if (activeTab === 'available') {
        fetchAvailableSessions();
      }

      // Fermer le modal si ouvert
      if (isModalOpen) {
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error booking session:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation de la session');
    } finally {
      setBookingInProgress(false);
    }
  };

  const getStatusClass = status => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'scheduled':
        return 'Programmée';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const renderSessionCard = (session, isAvailable = false) => {
    return (
      <div
        key={session._id}
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
        onClick={() => handleSessionSelect(session)}
      >
        <div className="p-6">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{session.title}</h3>
              <p className="text-gray-600">
                {session.professionalId?.businessName || 'Professionnel'}
              </p>
            </div>
            <div>
              {isAvailable ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Disponible
                </span>
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(session.status)}`}
                >
                  {getStatusText(session.status)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <FaCalendarAlt className="text-gray-500 mr-2" />
              <span className="text-gray-700">
                {format(parseISO(session.startTime), 'EEEE d MMMM yyyy', {
                  locale: fr,
                })}
              </span>
            </div>
            <div className="flex items-center">
              <FaClock className="text-gray-500 mr-2" />
              <span className="text-gray-700">
                {format(parseISO(session.startTime), 'HH:mm', { locale: fr })} -
                {format(
                  new Date(parseISO(session.startTime).getTime() + session.duration * 60000),
                  'HH:mm',
                  { locale: fr }
                )}
              </span>
            </div>
            <div className="flex items-center">
              {session.category === 'online' ? (
                <>
                  <FaVideo className="text-gray-500 mr-2" />
                  <span className="text-gray-700">Session en ligne</span>
                </>
              ) : (
                <>
                  <FaMapMarkerAlt className="text-gray-500 mr-2" />
                  <span className="text-gray-700">{session.location}</span>
                </>
              )}
            </div>
            <div className="flex items-center">
              <FaUser className="text-gray-500 mr-2" />
              <span className="text-gray-700">
                {session.participants?.length || 0}/{session.maxParticipants} participants
              </span>
            </div>
            <div className="flex items-center">
              <FaEuroSign className="text-gray-500 mr-2" />
              <span className="text-gray-700">{session.price} MAD</span>
            </div>
          </div>

          {isAvailable && (
            <div className="mt-4">
              <button
                className="w-full py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center"
                onClick={e => {
                  e.stopPropagation();
                  handleBookSession(session);
                }}
                disabled={bookingInProgress}
              >
                {bookingInProgress ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FaPlus className="mr-2" /> Réserver
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && activeTab !== 'available') {
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
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mes sessions</h1>
          <p className="mt-4 text-lg text-gray-600">Gérez vos sessions avec les professionnels</p>
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
          <button
            className={`py-4 px-6 ${
              activeTab === 'available'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('available')}
          >
            Sessions disponibles
          </button>

          {activeTab === 'available' && (
            <button
              className="ml-auto py-2 px-4 text-primary-600 hover:text-primary-800 flex items-center"
              onClick={fetchAvailableSessions}
              disabled={loadingAvailable}
            >
              {loadingAvailable ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Rafraîchir
                </>
              )}
            </button>
          )}
        </div>

        {activeTab !== 'available' && error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {activeTab === 'available' && errorAvailable && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errorAvailable}
          </div>
        )}

        {activeTab !== 'available' && filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map(session => renderSessionCard(session))}
          </div>
        ) : activeTab === 'available' ? (
          loadingAvailable ? (
            <div className="flex justify-center my-12">
              <LoadingSpinner />
            </div>
          ) : availableSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSessions.map(session => renderSessionCard(session, true))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Aucune session disponible actuellement
              </h3>
              <p className="text-gray-600 mb-6">
                Revenez plus tard ou explorez notre liste de professionnels pour trouver des
                sessions
              </p>
              <a href="/professionals" className="btn-primary inline-block">
                Découvrir des professionnels
              </a>
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {activeTab === 'upcoming'
                ? "Vous n'avez aucune session à venir"
                : "Vous n'avez aucune session passée"}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming'
                ? 'Explorez notre liste de professionnels pour réserver votre prochaine session'
                : 'Vos sessions passées apparaîtront ici'}
            </p>
            <button
              onClick={() => setActiveTab('available')}
              className="btn-primary inline-block mr-4"
            >
              Voir les sessions disponibles
            </button>
            <a href="/professionals" className="btn-secondary inline-block">
              Découvrir des professionnels
            </a>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {isModalOpen && selectedSession && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedSession.title}>
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  activeTab === 'available'
                    ? 'bg-green-100 text-green-800'
                    : getStatusClass(selectedSession.status)
                }`}
              >
                {activeTab === 'available' ? 'Disponible' : getStatusText(selectedSession.status)}
              </span>

              {activeTab === 'available' && (
                <button
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                  onClick={() => handleBookSession(selectedSession)}
                  disabled={bookingInProgress}
                >
                  {bookingInProgress ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <FaPlus className="mr-2" /> Réserver
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Détails</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedSession.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Date et heure</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaCalendarAlt className="text-gray-500 mr-2" />
                    <span className="text-gray-700">
                      {format(parseISO(selectedSession.startTime), 'EEEE d MMMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-gray-500 mr-2" />
                    <span className="text-gray-700">
                      {format(parseISO(selectedSession.startTime), 'HH:mm', { locale: fr })} -
                      {format(
                        new Date(
                          parseISO(selectedSession.startTime).getTime() +
                            selectedSession.duration * 60000
                        ),
                        'HH:mm',
                        { locale: fr }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Lieu</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedSession.category === 'online' ? (
                    <div className="flex items-center">
                      <FaVideo className="text-gray-500 mr-2" />
                      <span className="text-gray-700">Session en ligne</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-gray-500 mr-2" />
                      <span className="text-gray-700">{selectedSession.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedSession.notes && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedSession.notes}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              {activeTab !== 'available' &&
                selectedSession.status === 'scheduled' &&
                new Date(selectedSession.startTime) > new Date() && (
                  <>
                    {selectedSession.category === 'online' && selectedSession.meetingLink && (
                      <a
                        href={selectedSession.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center"
                      >
                        <FaLink className="mr-2" /> Rejoindre la session
                      </a>
                    )}
                  </>
                )}
              <button onClick={handleCloseModal} className="btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientSessionsPage;
