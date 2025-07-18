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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

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

  const handleDeleteSession = async sessionId => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      await axios.delete(`${BASE_URL}/api/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Session supprimée avec succès');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openDetailsModal = session => {
    setSelectedSession(session);
    setIsDetailsModalOpen(true);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCategoryFilter('');
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
                          {session.status === 'scheduled' && (
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
                {searchTerm || statusFilter || categoryFilter
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
    </div>
  );
};

export default AdminSessionsPage;
