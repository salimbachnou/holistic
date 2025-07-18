import {
  CalendarDaysIcon,
  CheckIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';

      const response = await axios.get(`${BASE_URL}/api/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 12,
          search: searchTerm,
          status: statusFilter,
        },
      });

      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination.totalPages || 1);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async eventId => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';

      await axios.put(
        `${BASE_URL}/api/admin/events/${eventId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Événement approuvé avec succès');
      fetchEvents();
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error("Erreur lors de l'approbation de l'événement");
    }
  };

  const handleRejectEvent = async eventId => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';

      await axios.put(
        `${BASE_URL}/api/admin/events/${eventId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Événement rejeté avec succès');
      fetchEvents();
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error("Erreur lors du rejet de l'événement");
    }
  };

  const openDetailsModal = event => {
    setSelectedEvent(event);
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

  const getStatusLabel = status => {
    const statuses = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
    };
    return statuses[status] || status;
  };

  const getStatusClass = status => {
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Événements</h1>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-primary-500 focus:border-primary-500"
                placeholder="Rechercher un événement..."
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
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Refusés</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
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

      {/* Liste des événements en cartes */}
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          {events.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map(event => (
                  <div
                    key={event._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image de l'événement */}
                    <div className="h-48 bg-gray-200 relative">
                      {event.coverImages && event.coverImages.length > 0 ? (
                        <img
                          src={event.coverImages[0]}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <CalendarDaysIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      {/* Badge de statut */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                            event.status
                          )}`}
                        >
                          {getStatusLabel(event.status)}
                        </span>
                      </div>
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {event.title}
                        </h3>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>{formatDate(event.date)}</span>
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>Professionnel:</strong> {event.professional?.firstName}{' '}
                          {event.professional?.lastName}
                        </div>

                        <div className="text-sm text-gray-500">{event.professional?.email}</div>

                        <div className="text-sm text-gray-600">
                          <strong>Prix:</strong> {event.price?.amount || event.price}{' '}
                          {event.price?.currency || 'MAD'}
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>Participants max:</strong> {event.maxParticipants}
                        </div>
                      </div>

                      {/* Description tronquée */}
                      {event.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                          {event.description.length > 100
                            ? `${event.description.substring(0, 100)}...`
                            : event.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => openDetailsModal(event)}
                          className="flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Voir détails
                        </button>

                        {event.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveEvent(event._id)}
                              className="flex items-center text-green-600 hover:text-green-900 text-sm font-medium"
                              title="Approuver"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectEvent(event._id)}
                              className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                              title="Rejeter"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
              <CalendarDaysIcon className="h-16 w-16 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun événement trouvé</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter
                  ? 'Aucun événement ne correspond à vos critères de recherche'
                  : "Il n'y a pas encore d'événements dans le système"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de détails */}
      {isDetailsModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informations de l'événement</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Date de début:</strong> {formatDate(selectedEvent.date)}
                    </p>
                    <p>
                      <strong>Date de fin:</strong> {formatDate(selectedEvent.endDate)}
                    </p>
                    <p>
                      <strong>Adresse:</strong> {selectedEvent.address}
                    </p>
                    <p>
                      <strong>Prix:</strong> {selectedEvent.price?.amount || selectedEvent.price}{' '}
                      {selectedEvent.price?.currency || 'MAD'}
                    </p>
                    <p>
                      <strong>Participants max:</strong> {selectedEvent.maxParticipants}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Professionnel</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Nom:</strong> {selectedEvent.professional?.firstName}{' '}
                      {selectedEvent.professional?.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedEvent.professional?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>

              {selectedEvent.coverImages && selectedEvent.coverImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedEvent.coverImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Couverture ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                {selectedEvent.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveEvent(selectedEvent._id);
                        setIsDetailsModalOpen(false);
                      }}
                      className="btn-primary flex items-center"
                    >
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Approuver
                    </button>
                    <button
                      onClick={() => {
                        handleRejectEvent(selectedEvent._id);
                        setIsDetailsModalOpen(false);
                      }}
                      className="btn-danger flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 mr-2" />
                      Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;
