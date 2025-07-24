import {
  ClockIcon,
  CheckIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [confirmationStatusFilter, setConfirmationStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sessionBookings, setSessionBookings] = useState({});
  const [loadingBookings, setLoadingBookings] = useState({});
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [selectedSessionForBookings, setSelectedSessionForBookings] = useState(null);
  const [activeBookingsModal, setActiveBookingsModal] = useState({
    isOpen: false,
    session: null,
    bookings: [],
  });

  useEffect(() => {
    fetchSessions();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, confirmationStatusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(`${BASE_URL}/api/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 12,
          search: searchTerm,
          status: statusFilter,
          category: categoryFilter,
          confirmationStatus: confirmationStatusFilter,
        },
      });

      setSessions(response.data.sessions || []);
      setTotalPages(response.data.pagination.totalPages || 1);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erreur lors du chargement des sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      await axios.put(
        `${BASE_URL}/api/admin/sessions/${sessionId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Session ${status === 'cancelled' ? 'annulée' : 'mise à jour'} avec succès`);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const checkSessionBookings = async sessionId => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(`${BASE_URL}/api/admin/sessions/${sessionId}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.bookings || [];
    } catch (error) {
      console.error('Error checking session bookings:', error);
      return [];
    }
  };

  const loadSessionBookings = async sessionId => {
    if (sessionBookings[sessionId] !== undefined) {
      return; // Already loaded
    }

    setLoadingBookings(prev => ({ ...prev, [sessionId]: true }));
    try {
      const bookings = await checkSessionBookings(sessionId);
      setSessionBookings(prev => ({ ...prev, [sessionId]: bookings }));
    } catch (error) {
      console.error('Error loading session bookings:', error);
    } finally {
      setLoadingBookings(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleDeleteSession = async sessionId => {
    // Check if session has bookings first
    const bookings = await checkSessionBookings(sessionId);

    // Count active bookings (excluding cancelled)
    const activeBookings = bookings.filter(booking => booking.status !== 'cancelled');

    if (activeBookings.length > 0) {
      // Find the session details
      const session = sessions.find(s => s._id === sessionId);

      // Open modal with active bookings details
      setActiveBookingsModal({
        isOpen: true,
        session: session,
        bookings: activeBookings,
      });
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.delete(`${BASE_URL}/api/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Session supprimée avec succès');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);

      // Handle specific error for sessions with bookings
      if (error.response?.status === 400 && error.response?.data?.activeBookings) {
        const { activeBookings, sessionTitle } = error.response.data;
        const bookingList = activeBookings
          .map(booking => `• ${booking.clientName} (${booking.status})`)
          .join('\n');

        const message = `Impossible de supprimer la session "${sessionTitle}". Elle a ${activeBookings.length} réservation(s) active(s):\n\n${bookingList}\n\nVeuillez d'abord annuler toutes les réservations.`;

        toast.error(message, {
          duration: 8000, // Show for 8 seconds
          position: 'top-center',
        });
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Impossible de supprimer cette session');
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleApproveSession = async sessionId => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.put(
        `${BASE_URL}/api/admin/sessions/${sessionId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Session approuvée avec succès');
      fetchSessions();
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleRejectSession = async sessionId => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette session ?')) return;
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.put(
        `${BASE_URL}/api/admin/sessions/${sessionId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Session rejetée avec succès');
      fetchSessions();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const openDetailsModal = session => {
    setSelectedSession(session);
    setIsDetailsModalOpen(true);
  };

  const openBookingsModal = async session => {
    setSelectedSessionForBookings(session);
    await loadSessionBookings(session._id);
    setIsBookingsModalOpen(true);
  };

  const openActiveBookingsModal = (session, bookings) => {
    setActiveBookingsModal({
      isOpen: true,
      session: session,
      bookings: bookings,
    });
  };

  const closeActiveBookingsModal = () => {
    setActiveBookingsModal({
      isOpen: false,
      session: null,
      bookings: [],
    });
  };

  const handleCancelBooking = async bookingId => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      await axios.put(
        `${BASE_URL}/api/admin/bookings/${bookingId}/cancel`,
        { reason: "Annulée par l'administrateur" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Réservation annulée avec succès');

      // Refresh the bookings list
      const updatedBookings = await checkSessionBookings(activeBookingsModal.session._id);
      const activeBookings = updatedBookings.filter(booking => booking.status !== 'cancelled');

      setActiveBookingsModal(prev => ({
        ...prev,
        bookings: activeBookings,
      }));

      // If no more active bookings, close the modal
      if (activeBookings.length === 0) {
        closeActiveBookingsModal();
        toast.success(
          'Toutes les réservations ont été annulées. Vous pouvez maintenant supprimer la session.'
        );
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error("Erreur lors de l'annulation de la réservation");
    }
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = minutes => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const getStatusLabel = status => {
    const statuses = {
      scheduled: 'Programmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return statuses[status] || status;
  };

  const getStatusClass = status => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfirmationStatusLabel = status => {
    const statuses = {
      pending: 'En attente',
      approved: 'Approuvée',
      rejected: 'Rejetée',
    };
    return statuses[status] || status;
  };

  const getConfirmationStatusClass = status => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = category => {
    const categories = {
      individual: 'Individuel',
      group: 'Groupe',
      online: 'En ligne',
      workshop: 'Atelier',
      retreat: 'Retraite',
    };
    return categories[category] || category;
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Sessions</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.scheduled || 0}</div>
          <div className="text-sm text-gray-600">Programmées</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress || 0}</div>
          <div className="text-sm text-gray-600">En cours</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
          <div className="text-sm text-gray-600">Terminées</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled || 0}</div>
          <div className="text-sm text-gray-600">Annulées</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-primary-500 focus:border-primary-500"
                placeholder="Rechercher une session..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              className="border border-gray-300 rounded-md w-full py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="scheduled">Programmées</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              className="border border-gray-300 rounded-md w-full py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              <option value="individual">Individuel</option>
              <option value="group">Groupe</option>
              <option value="online">En ligne</option>
              <option value="workshop">Atelier</option>
              <option value="retreat">Retraite</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approbation</label>
            <select
              className="border border-gray-300 rounded-md w-full py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              value={confirmationStatusFilter}
              onChange={e => setConfirmationStatusFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvée</option>
              <option value="rejected">Rejetée</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCategoryFilter('');
                setConfirmationStatusFilter('');
                setCurrentPage(1);
              }}
              className="btn-secondary w-full flex items-center justify-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des sessions en cartes */}
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          {sessions.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sessions.map(session => (
                  <div
                    key={session._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Header avec statut */}
                    <div className="p-4 bg-gray-50 border-b">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {session.title}
                        </h3>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                            session.status
                          )}`}
                        >
                          {getStatusLabel(session.status)}
                        </span>
                        <span
                          className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfirmationStatusClass(
                            session.confirmationStatus
                          )}`}
                        >
                          {getConfirmationStatusLabel(session.confirmationStatus)}
                        </span>
                      </div>
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-4">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>{formatDate(session.startTime)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          <span>
                            {session.participants?.length || 0}/{session.maxParticipants}{' '}
                            participants
                          </span>
                        </div>

                        {/* Booking information */}
                        <div className="flex items-center text-sm text-gray-600">
                          <button
                            onClick={() => openBookingsModal(session)}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                            title="Voir les réservations"
                          >
                            <span className="mr-1">📋</span>
                            {loadingBookings[session._id] ? (
                              <span>Chargement...</span>
                            ) : sessionBookings[session._id] ? (
                              <span>
                                {sessionBookings[session._id].length} réservation(s)
                                {sessionBookings[session._id].length > 0 && (
                                  <span className="text-red-600 ml-1">⚠️</span>
                                )}
                              </span>
                            ) : (
                              <span>Vérifier réservations</span>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                          <span>{session.price} MAD</span>
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>Professionnel:</strong>{' '}
                          {session.professionalId?.businessName ||
                            `${session.professionalId?.firstName} ${session.professionalId?.lastName}`}
                        </div>

                        <div className="text-sm text-gray-500">
                          <strong>Catégorie:</strong> {getCategoryLabel(session.category)}
                        </div>

                        {session.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            <span className="truncate">{session.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Description tronquée */}
                      {session.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                          {session.description.length > 100
                            ? `${session.description.substring(0, 100)}...`
                            : session.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => openDetailsModal(session)}
                          className="flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Détails
                        </button>

                        <div className="flex space-x-2">
                          {session.confirmationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveSession(session._id)}
                                className="flex items-center text-green-600 hover:text-green-900 text-sm font-medium"
                                title="Approuver"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRejectSession(session._id)}
                                className="flex items-center text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                                title="Rejeter"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {session.status === 'scheduled' &&
                            session.confirmationStatus === 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(session._id, 'cancelled')}
                                className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                                title="Annuler"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          {(session.status === 'cancelled' || session.status === 'completed') && (
                            <button
                              onClick={() => handleDeleteSession(session._id)}
                              className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Précédent
                    </button>
                    <span className="text-gray-700 px-4">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune session trouvée</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter || categoryFilter || confirmationStatusFilter
                  ? 'Aucune session ne correspond à vos critères de recherche'
                  : "Il n'y a pas encore de sessions dans le système"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de détails */}
      {isDetailsModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedSession.title}</h2>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informations de la session</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Date de début:</strong> {formatDate(selectedSession.startTime)}
                    </p>
                    <p>
                      <strong>Durée:</strong> {formatDuration(selectedSession.duration)}
                    </p>
                    <p>
                      <strong>Catégorie:</strong> {getCategoryLabel(selectedSession.category)}
                    </p>
                    <p>
                      <strong>Prix:</strong> {selectedSession.price} MAD
                    </p>
                    <p>
                      <strong>Participants:</strong> {selectedSession.participants?.length || 0}/
                      {selectedSession.maxParticipants}
                    </p>
                    {selectedSession.location && (
                      <p>
                        <strong>Lieu:</strong> {selectedSession.location}
                      </p>
                    )}
                    {selectedSession.meetingLink && (
                      <p>
                        <strong>Lien de réunion:</strong>{' '}
                        <a
                          href={selectedSession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Accéder à la réunion
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Professionnel</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Nom:</strong>{' '}
                      {selectedSession.professionalId?.businessName ||
                        `${selectedSession.professionalId?.firstName} ${selectedSession.professionalId?.lastName}`}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedSession.professionalId?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedSession.description}</p>
              </div>

              {selectedSession.participants && selectedSession.participants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Participants</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedSession.participants.map((participant, index) => (
                        <div key={index} className="text-sm">
                          {participant.firstName} {participant.lastName} - {participant.email}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                {selectedSession.status === 'scheduled' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedSession._id, 'cancelled');
                      setIsDetailsModalOpen(false);
                    }}
                    className="btn-danger flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Annuler
                  </button>
                )}
                {(selectedSession.status === 'cancelled' ||
                  selectedSession.status === 'completed') && (
                  <button
                    onClick={() => {
                      handleDeleteSession(selectedSession._id);
                      setIsDetailsModalOpen(false);
                    }}
                    className="btn-danger flex items-center"
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des réservations */}
      {isBookingsModalOpen && selectedSessionForBookings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Réservations pour: {selectedSessionForBookings.title}
                </h2>
                <button
                  onClick={() => setIsBookingsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {loadingBookings[selectedSessionForBookings._id] ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des réservations...</p>
                </div>
              ) : sessionBookings[selectedSessionForBookings._id]?.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const activeBookings = sessionBookings[selectedSessionForBookings._id].filter(
                      booking => booking.status !== 'cancelled'
                    );
                    return (
                      <div
                        className={`border rounded-lg p-4 mb-4 ${
                          activeBookings.length > 0
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <p
                          className={
                            activeBookings.length > 0 ? 'text-yellow-800' : 'text-green-800'
                          }
                        >
                          {activeBookings.length > 0
                            ? `⚠️ Cette session a ${activeBookings.length} réservation(s) active(s). Elle ne peut pas être supprimée tant que toutes les réservations ne sont pas annulées.`
                            : `✅ Cette session peut être supprimée. Toutes les réservations sont annulées.`}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-3">
                    {sessionBookings[selectedSessionForBookings._id].map((booking, index) => (
                      <div key={booking._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {booking.client?.firstName} {booking.client?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{booking.client?.email}</p>
                            <p className="text-sm text-gray-500">
                              Réservé le: {formatDate(booking.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {booking.status === 'confirmed'
                                ? 'Confirmée'
                                : booking.status === 'pending'
                                  ? 'En attente'
                                  : 'Annulée'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Aucune réservation trouvée pour cette session.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Cette session peut être supprimée en toute sécurité.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsBookingsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des réservations actives */}
      {activeBookingsModal.isOpen && activeBookingsModal.session && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Réservations actives pour: {activeBookingsModal.session.title}
                </h2>
                <button
                  onClick={closeActiveBookingsModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {loadingBookings[activeBookingsModal.session._id] ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des réservations...</p>
                </div>
              ) : activeBookingsModal.bookings?.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-yellow-200 border rounded-lg p-4 mb-4">
                    <p className="text-yellow-800">
                      Cette session a {activeBookingsModal.bookings.length} réservation(s)
                      active(s). Elle ne peut pas être supprimée tant que toutes les réservations ne
                      sont pas annulées.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {activeBookingsModal.bookings.map((booking, index) => (
                      <div key={booking._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {booking.client?.firstName} {booking.client?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{booking.client?.email}</p>
                            <p className="text-sm text-gray-500">
                              Réservé le: {formatDate(booking.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {booking.status === 'confirmed'
                                ? 'Confirmée'
                                : booking.status === 'pending'
                                  ? 'En attente'
                                  : 'Annulée'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            Annuler la réservation
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Aucune réservation active trouvée pour cette session.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Cette session peut être supprimée en toute sécurité.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeActiveBookingsModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessionsPage;
