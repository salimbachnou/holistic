import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyEuroIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  UserCircleIcon,
  UserIcon,
  XCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  ArrowPathIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaVideo, FaMapMarkerAlt, FaUser, FaUsers, FaClock, FaEuroSign } from 'react-icons/fa';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalSessionBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    revenue: 0,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchBookings();
    const interval = autoRefresh ? setInterval(fetchBookings, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchTerm, statusFilter, dateFilter, sessionTypeFilter, sortBy, sortOrder]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Include all bookings by default (includeAll=true)
      const response = await axios.get(
        `${API_URL}/api/bookings/professional/sessions?includeAll=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const bookingsData = response.data.bookings || [];
        console.log('=== FRONTEND BOOKINGS DEBUG ===');
        console.log('Total bookings received:', bookingsData.length);
        console.log('Bookings data:', bookingsData);

        setBookings(bookingsData);
        calculateStats(bookingsData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching session bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = useCallback(bookingsData => {
    const stats = {
      total: bookingsData.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      revenue: 0,
    };

    bookingsData.forEach(booking => {
      stats[booking.status] = (stats[booking.status] || 0) + 1;
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        stats.revenue += booking.service.price || 0;
      }
    });

    setStats(stats);
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...bookings];

    // Recherche par nom du client ou titre de session
    if (searchTerm) {
      filtered = filtered.filter(
        booking =>
          booking.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.service.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.service.startTime);
        switch (dateFilter) {
          case 'today':
            return format(bookingDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          case 'week': {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return bookingDate >= startOfDay(weekStart) && bookingDate <= endOfDay(weekEnd);
          }
          case 'month':
            return (
              bookingDate.getMonth() === now.getMonth() &&
              bookingDate.getFullYear() === now.getFullYear()
            );
          case 'upcoming':
            return isAfter(bookingDate, now);
          case 'past':
            return isBefore(bookingDate, now);
          default:
            return true;
        }
      });
    }

    // Filtre par type de session
    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.service.category === sessionTypeFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.service.startTime);
          bValue = new Date(b.service.startTime);
          break;
        case 'client':
          aValue = `${a.client.firstName} ${a.client.lastName}`;
          bValue = `${b.client.firstName} ${b.client.lastName}`;
          break;
        case 'session':
          aValue = a.service.title;
          bValue = b.service.title;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'price':
          aValue = a.service.price || 0;
          bValue = b.service.price || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter, dateFilter, sessionTypeFilter, sortBy, sortOrder]);

  const handleStatusUpdate = async (bookingId, newStatus, reason = '') => {
    try {
      setUpdatingStatus(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_URL}/api/sessions/bookings/${bookingId}`,
        { status: newStatus, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const statusText = newStatus === 'confirmed' ? 'confirmée' : 'refusée';
      toast.success(`Réservation ${statusText} avec succès`);

      // Rafraîchir les données
      await fetchBookings();

      if (selectedBooking && selectedBooking._id === bookingId) {
        setIsModalOpen(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openBookingModal = booking => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'cancelled':
        return 'Annulée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const formatDate = dateString => {
    return format(new Date(dateString), 'PPP à HH:mm', { locale: fr });
  };

  const formatTime = dateString => {
    return format(new Date(dateString), 'HH:mm', { locale: fr });
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-xl border-b border-indigo-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Réservations de Sessions
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Gérez toutes les réservations de vos sessions
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-colors ${
                    autoRefresh
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={
                    autoRefresh
                      ? 'Désactiver le rafraîchissement automatique'
                      : 'Activer le rafraîchissement automatique'
                  }
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${autoRefresh ? 'animate-spin' : ''}`}
                  />
                </button>

                <button
                  onClick={fetchBookings}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 disabled:opacity-50 text-sm"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                      const token = localStorage.getItem('token');
                      const response = await axios.get(
                        `${API_URL}/api/bookings/professional/debug`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      console.log('=== DEBUG RESPONSE ===', response.data);
                      toast.success(
                        `Debug: ${response.data.debug.totalBookings} réservations trouvées`
                      );
                    } catch (error) {
                      console.error('Debug error:', error);
                      toast.error('Erreur de débogage');
                    }
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 text-sm"
                >
                  <InformationCircleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Debug</span>
                </button>
              </div>

              {lastRefresh && (
                <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Dernière mise à jour: {format(lastRefresh, 'HH:mm:ss')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-gray-100 rounded-full p-2 sm:p-3">
                <CalendarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-yellow-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-yellow-600">En attente</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-2 sm:p-3">
                <ClockIcon className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-green-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-600">Confirmées</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.confirmed}</p>
              </div>
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-red-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-red-600">Annulées</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.cancelled}</p>
              </div>
              <div className="bg-red-100 rounded-full p-2 sm:p-3">
                <XCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-blue-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600">Terminées</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.completed}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-2 sm:p-3">
                <StarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-emerald-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-emerald-600">Revenus</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {stats.revenue} MAD
                </p>
              </div>
              <div className="bg-emerald-100 rounded-full p-2 sm:p-3">
                <CurrencyEuroIcon className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="block lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filtres et recherche
            <Bars3Icon className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Filtres et recherche */}
        <div
          className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Recherche */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par client ou session..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filtre par statut */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
              <option value="completed">Terminées</option>
            </select>

            {/* Filtre par date */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passées</option>
            </select>

            {/* Filtre par type de session */}
            <select
              value={sessionTypeFilter}
              onChange={e => setSessionTypeFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="all">Tous les types</option>
              <option value="individual">Individuelle</option>
              <option value="group">Groupe</option>
              <option value="online">En ligne</option>
              <option value="workshop">Atelier</option>
              <option value="retreat">Retraite</option>
            </select>
          </div>

          {/* Tri */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Trier par:</span>
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="client">Client</option>
              <option value="session">Session</option>
              <option value="status">Statut</option>
              <option value="price">Prix</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
            </button>

            <span className="text-sm text-gray-500">
              {filteredBookings.length} résultat(s) trouvé(s)
            </span>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setSessionTypeFilter('all');
                setSortBy('date');
                setSortOrder('desc');
                setShowMobileFilters(false);
              }}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Liste des réservations */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          {paginatedBookings.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                {searchTerm ||
                statusFilter !== 'all' ||
                dateFilter !== 'all' ||
                sessionTypeFilter !== 'all'
                  ? 'Aucune réservation ne correspond à vos critères de recherche.'
                  : "Vous n'avez pas encore reçu de réservations pour vos sessions."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {/* En-têtes du tableau */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-3">Client</div>
                    <div className="col-span-3">Session</div>
                    <div className="col-span-2">Date & Heure</div>
                    <div className="col-span-1">Prix</div>
                    <div className="col-span-1">Statut</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                {/* Lignes du tableau */}
                <div className="divide-y divide-gray-200">
                  {paginatedBookings.map(booking => (
                    <div key={booking._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Client */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-indigo-100 rounded-full p-2">
                              <UserIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.client.firstName} {booking.client.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{booking.client.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Session */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-2">
                            {booking.service.category === 'online' ? (
                              <FaVideo className="text-blue-500" />
                            ) : (
                              <FaMapMarkerAlt className="text-green-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{booking.service.title}</p>
                              <p className="text-sm text-gray-500 capitalize">
                                {booking.service.category} • {booking.service.duration} min
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Date & Heure */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(booking.service.startTime), 'dd/MM/yyyy')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTime(booking.service.startTime)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Prix */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1">
                            <FaEuroSign className="h-3 w-3 text-green-500" />
                            <span className="font-medium text-gray-900">
                              {booking.service.price || 0}
                            </span>
                          </div>
                        </div>

                        {/* Statut */}
                        <div className="col-span-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openBookingModal(booking)}
                              className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>

                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                  disabled={updatingStatus}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Confirmer"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                  disabled={updatingStatus}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Refuser"
                                >
                                  <XCircleIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-gray-200">
                  {paginatedBookings.map(booking => (
                    <div key={booking._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="space-y-3">
                        {/* Client Info */}
                        <div className="flex items-center space-x-3">
                          <div className="bg-indigo-100 rounded-full p-2">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {booking.client.firstName} {booking.client.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{booking.client.email}</p>
                          </div>
                        </div>

                        {/* Session Info */}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {booking.service.category === 'online' ? (
                              <FaVideo className="text-blue-500 h-4 w-4" />
                            ) : (
                              <FaMapMarkerAlt className="text-green-500 h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{booking.service.title}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {booking.service.category} • {booking.service.duration} min
                            </p>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {format(new Date(booking.service.startTime), 'dd/MM/yyyy')} à{' '}
                            {formatTime(booking.service.startTime)}
                          </span>
                        </div>

                        {/* Price & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <FaEuroSign className="h-3 w-3 text-green-500" />
                            <span className="font-medium text-gray-900">
                              {booking.service.price || 0} MAD
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={() => openBookingModal(booking)}
                            className="flex-1 flex items-center justify-center px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-sm"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Détails
                          </button>

                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                disabled={updatingStatus}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 text-sm"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Confirmer
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                disabled={updatingStatus}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 text-sm"
                              >
                                <XCircleIcon className="h-4 w-4 mr-2" />
                                Refuser
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <div className="text-sm text-gray-700 text-center sm:text-left">
                      Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                      {Math.min(currentPage * itemsPerPage, filteredBookings.length)} sur{' '}
                      {filteredBookings.length} réservations
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de détails de réservation */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header du modal */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 px-4 sm:px-8 py-4 sm:py-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">
                    Détails de la réservation
                  </h2>
                  <p className="text-indigo-100 mt-1 text-sm">
                    Réservation #{selectedBooking.bookingNumber || selectedBooking._id.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={closeBookingModal}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
                >
                  <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              {/* Statut */}
              <div className="mb-6">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(selectedBooking.status)}`}
                >
                  {getStatusLabel(selectedBooking.status)}
                </span>
              </div>

              {/* Informations du client */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Informations du client
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom complet</p>
                      <p className="font-medium text-gray-900">
                        {selectedBooking.client.firstName} {selectedBooking.client.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900 break-all">
                        {selectedBooking.client.email}
                      </p>
                    </div>
                    {selectedBooking.client.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium text-gray-900">{selectedBooking.client.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations de la session */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Détails de la session
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Titre</p>
                      <p className="font-medium text-gray-900">{selectedBooking.service.title}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Date et heure</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(selectedBooking.service.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Durée</p>
                        <p className="font-medium text-gray-900">
                          {selectedBooking.service.duration} minutes
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {selectedBooking.service.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Prix</p>
                        <p className="font-medium text-gray-900">
                          {selectedBooking.service.price || 0} MAD
                        </p>
                      </div>
                    </div>

                    {selectedBooking.service.location && (
                      <div>
                        <p className="text-sm text-gray-600">Lieu</p>
                        <p className="font-medium text-gray-900">
                          {selectedBooking.service.location}
                        </p>
                      </div>
                    )}

                    {selectedBooking.service.meetingLink && (
                      <div>
                        <p className="text-sm text-gray-600">Lien de réunion</p>
                        <a
                          href={selectedBooking.service.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium break-all"
                        >
                          Rejoindre la réunion
                          <FaVideo className="ml-2 h-4 w-4 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations de réservation */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Informations de réservation
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date de réservation</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(selectedBooking.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Méthode de paiement</p>
                      <p className="font-medium text-gray-900">
                        {selectedBooking.paymentMethod || 'Non spécifié'}
                      </p>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Notes du client</p>
                      <p className="font-medium text-gray-900">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.status === 'pending' && (
                <div className="border-t border-gray-200 pt-6 sm:pt-8">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking._id, 'confirmed')}
                      disabled={updatingStatus}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      {updatingStatus ? 'Traitement...' : 'Confirmer la réservation'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking._id, 'cancelled')}
                      disabled={updatingStatus}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      {updatingStatus ? 'Traitement...' : 'Refuser la réservation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalSessionBookingsPage;
