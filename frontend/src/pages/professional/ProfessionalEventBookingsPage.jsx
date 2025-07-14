import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  UsersIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  BellIcon,
  HeartIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalEventBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newParticipants, setNewParticipants] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch events for the professional
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/events/professional',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.events) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch participants for a specific event
  const fetchEventParticipants = useCallback(async eventId => {
    try {
      setLoadingParticipants(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/events/${eventId}/participants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        const participantsList = response.data.participants || [];
        setParticipants(participantsList);

        // Check for new participants (registered in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const newParticipantsSet = new Set();

        participantsList.forEach(participant => {
          const registrationDate = new Date(participant.createdAt);
          if (registrationDate > fiveMinutesAgo) {
            newParticipantsSet.add(participant._id);
          }
        });

        setNewParticipants(newParticipantsSet);

        if (newParticipantsSet.size > 0) {
          toast.success(`${newParticipantsSet.size} nouvelle(s) inscription(s) !`, {
            duration: 4000,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Erreur lors du chargement des participants');
    } finally {
      setLoadingParticipants(false);
    }
  }, []);

  // Update participant status
  const updateParticipantStatus = async (eventId, participantId, newStatus, reason = '') => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');

      await axios.put(
        `http://localhost:5000/api/events/${eventId}/participants/${participantId}`,
        { status: newStatus, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const statusText = newStatus === 'confirmed' ? 'confirmée' : 'refusée';
      toast.success(`Inscription ${statusText} avec succès`);

      // Refresh participants
      await fetchEventParticipants(eventId);

      // Refresh events to update counts
      await fetchEvents();
    } catch (error) {
      console.error('Error updating participant status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open event details modal
  const openEventModal = event => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    fetchEventParticipants(event._id);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setParticipants([]);
    setNewParticipants(new Set());
  };

  // Format date
  const formatDate = dateString => {
    return format(new Date(dateString), 'EEEE d MMMM yyyy', { locale: fr });
  };

  // Format time
  const formatTime = dateString => {
    return format(new Date(dateString), 'HH:mm', { locale: fr });
  };

  // Get status color
  const getStatusColor = status => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = status => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  // Check if event is passed
  const isEventPassed = event => {
    return new Date(event.endDate || event.date) < new Date();
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    const matchesType =
      eventTypeFilter === 'all' ||
      (eventTypeFilter === 'past' && isEventPassed(event)) ||
      (eventTypeFilter === 'upcoming' && !isEventPassed(event));

    return matchesSearch && matchesStatus && matchesType;
  });

  // Auto-refresh effect
  useEffect(() => {
    fetchEvents();

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchEvents();
        if (selectedEvent) {
          fetchEventParticipants(selectedEvent._id);
        }
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchEvents, fetchEventParticipants, selectedEvent, autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Réservations d'Événements
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Gérez les inscriptions et participants de vos événements
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowPathIcon
                  className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`}
                />
                Auto-refresh
              </button>
              <button
                onClick={fetchEvents}
                className="flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
              >
                <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="block sm:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filtres
            <Bars3Icon className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Filters */}
        <div
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Nom de l'événement..."
                  className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={eventTypeFilter}
                onChange={e => setEventTypeFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              >
                <option value="all">Tous les événements</option>
                <option value="upcoming">À venir</option>
                <option value="past">Passés</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setEventTypeFilter('all');
                  setShowMobileFilters(false);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <CalendarDaysIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              {searchTerm || statusFilter !== 'all' || eventTypeFilter !== 'all'
                ? 'Aucun événement ne correspond à vos critères de recherche.'
                : "Vous n'avez pas encore créé d'événement."}
            </p>
            <button
              onClick={() => navigate('/dashboard/professional/events')}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
            >
              <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Créer un événement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.map(event => {
              const confirmedParticipants =
                event.participants?.filter(p => p.status === 'confirmed').length || 0;
              const pendingParticipants =
                event.participants?.filter(p => p.status === 'pending').length || 0;
              const totalParticipants = event.participants?.length || 0;

              return (
                <div
                  key={event._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => openEventModal(event)}
                >
                  {/* Event Image */}
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-violet-500 to-pink-500">
                    {event.coverImages && event.coverImages.length > 0 ? (
                      <img
                        src={event.coverImages[0]}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarDaysIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white/70" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}
                      >
                        {getStatusLabel(event.status)}
                      </span>
                    </div>

                    {/* Event Type Badge */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          isEventPassed(event)
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isEventPassed(event) ? 'Terminé' : 'À venir'}
                      </span>
                    </div>

                    {/* New Participants Indicator */}
                    {pendingParticipants > 0 && (
                      <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <BellIcon className="w-3 h-3 mr-1" />
                          {pendingParticipants} en attente
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                    {/* Event Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarDaysIcon className="h-4 w-4 mr-2 text-violet-500 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(event.date)} à {formatTime(event.date)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2 text-violet-500 flex-shrink-0" />
                        <span className="truncate">
                          {event.eventType === 'online' ? 'Événement en ligne' : event.address}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-violet-500 flex-shrink-0" />
                        <span>{event.price === 0 ? 'Gratuit' : `${event.price} MAD`}</span>
                      </div>
                    </div>

                    {/* Participants Summary */}
                    <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Participants</span>
                        <span className="text-lg font-bold text-violet-600">
                          {confirmedParticipants}/{event.maxParticipants}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((confirmedParticipants / event.maxParticipants) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{confirmedParticipants} confirmés</span>
                        {pendingParticipants > 0 && (
                          <span className="text-yellow-600 font-medium">
                            {pendingParticipants} en attente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {event.reviews && event.reviews.length > 0 && (
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-gray-600">
                              {event.stats?.averageRating || 0} ({event.reviews.length})
                            </span>
                          </div>
                        )}
                      </div>

                      <button className="flex items-center text-violet-600 hover:text-violet-700 font-medium text-sm">
                        Gérer
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Event Details Modal */}
        {isModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-600 to-pink-600 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                      {selectedEvent.title}
                    </h2>
                    <p className="text-violet-100 text-sm">
                      {formatDate(selectedEvent.date)} à {formatTime(selectedEvent.date)}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Event Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center">
                      <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
                      <div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900">
                          {participants.filter(p => p.status !== 'cancelled').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-2 sm:mr-3" />
                      <div>
                        <p className="text-xs sm:text-sm text-green-600 font-medium">Confirmés</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">
                          {participants.filter(p => p.status === 'confirmed').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-2 sm:mr-3" />
                      <div>
                        <p className="text-xs sm:text-sm text-yellow-600 font-medium">En attente</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                          {participants.filter(p => p.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-2 sm:mr-3" />
                      <div>
                        <p className="text-xs sm:text-sm text-purple-600 font-medium">Revenus</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-900">
                          {participants.filter(p => p.status === 'confirmed').length *
                            selectedEvent.price}{' '}
                          MAD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants List */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Participants ({participants.length})
                    </h3>
                    <button
                      onClick={() => fetchEventParticipants(selectedEvent._id)}
                      className="flex items-center px-3 py-2 text-sm bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Actualiser
                    </button>
                  </div>

                  {loadingParticipants ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="text-center py-8">
                      <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun participant pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {participants.map(participant => (
                        <div
                          key={participant._id}
                          className={`bg-white rounded-xl p-4 border-2 transition-all ${
                            newParticipants.has(participant._id)
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {participant.user?.firstName?.charAt(0) || 'U'}
                                {participant.user?.lastName?.charAt(0) || ''}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {participant.user?.firstName} {participant.user?.lastName}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {participant.user?.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Inscrit le{' '}
                                  {format(new Date(participant.createdAt), 'dd/MM/yyyy à HH:mm')}
                                </p>
                                {newParticipants.has(participant._id) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                    Nouveau
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium text-center ${getStatusColor(participant.status)}`}
                              >
                                {getStatusLabel(participant.status)}
                              </span>

                              {participant.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      updateParticipantStatus(
                                        selectedEvent._id,
                                        participant._id,
                                        'confirmed'
                                      )
                                    }
                                    disabled={updatingStatus}
                                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Confirmer
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateParticipantStatus(
                                        selectedEvent._id,
                                        participant._id,
                                        'cancelled'
                                      )
                                    }
                                    disabled={updatingStatus}
                                    className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                                  >
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    Refuser
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {participant.note && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Note:</span> {participant.note}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalEventBookingsPage;
