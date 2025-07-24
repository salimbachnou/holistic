// External modules
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  TagIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
  Bars3Icon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';

// Internal modules
import ProfessionalButton from '../../components/professional/ProfessionalButton';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalClientsPage = () => {
  const { user: _user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalRevenue: 0,
    averageRevenue: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Fetch clients from the API with the current filters
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(`${API_URL}/api/professionals/clients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: filterStatus,
          type: filterType,
        },
      });

      if (response.data.success) {
        setClients(response.data.clients);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      } else {
        console.error('Error fetching clients:', response.data.message);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setIsLoading(false);
    }
  }, [token, searchTerm, filterStatus, filterType, pagination.page, pagination.limit]);

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      // Reset to page 1 when search term changes
      setPagination(prev => ({
        ...prev,
        page: 1,
      }));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch clients when dependencies change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Handle filter status change
  const handleFilterChange = e => {
    setFilterStatus(e.target.value);
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
    setShowMobileFilters(false);
  };

  // Handle filter type change
  const handleFilterTypeChange = e => {
    setFilterType(e.target.value);
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
    setShowMobileFilters(false);
  };

  // Fetch client details when a client is selected
  const fetchClientDetails = async clientId => {
    try {
      setIsLoading(true);

      const response = await axios.get(`${API_URL}/api/professionals/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSelectedClient(response.data.client);
        setShowClientDetails(true);
      } else {
        console.error('Error fetching client details:', response.data.message);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setIsLoading(false);
    }
  };

  const handleClientSelect = client => {
    fetchClientDetails(client.id);
  };

  const handlePageChange = newPage => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  // Fonction pour envoyer un message au client
  const handleSendMessage = async clientId => {
    try {
      // Rediriger vers la page de messages avec le client sélectionné
      window.location.href = `/dashboard/professional/messages?client=${clientId}`;
    } catch (error) {
      console.error('Erreur lors de la redirection vers la messagerie:', error);
    }
  };

  // Fonction pour planifier une session avec le client
  const handleScheduleSession = async clientId => {
    try {
      // Rediriger vers la page de sessions avec le client présélectionné
      window.location.href = `/dashboard/professional/sessions?client=${clientId}`;
    } catch (error) {
      console.error('Erreur lors de la redirection vers la planification:', error);
    }
  };

  const ClientDetailModal = () => {
    if (!selectedClient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-gray-200 px-4 sm:px-6 py-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profil Client</h2>
            <button
              onClick={() => setShowClientDetails(false)}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                <img
                  src={selectedClient.image || 'https://via.placeholder.com/150?text=Client'}
                  alt={selectedClient.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-primary-100 mx-auto sm:mx-0"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=Client';
                  }}
                />
              </div>

              <div className="flex-grow text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {selectedClient.name}
                </h3>

                <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  {selectedClient.tags &&
                    selectedClient.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600 justify-center sm:justify-start">
                    <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="text-primary-600 hover:underline text-sm sm:text-base break-all"
                    >
                      {selectedClient.email}
                    </a>
                  </div>
                  <div className="flex items-center text-gray-600 justify-center sm:justify-start">
                    <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <a
                      href={`tel:${selectedClient.phone}`}
                      className="text-primary-600 hover:underline text-sm sm:text-base"
                    >
                      {selectedClient.phone || 'Non renseigné'}
                    </a>
                  </div>
                  <div className="flex items-center text-gray-600 justify-center sm:justify-start">
                    <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Dernière visite:{' '}
                      {selectedClient.lastVisit
                        ? new Date(selectedClient.lastVisit).toLocaleDateString('fr-FR')
                        : 'Aucune'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 justify-center sm:justify-start">
                    <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      {selectedClient.totalSessions} sessions,{' '}
                      {selectedClient.totalSpent ? selectedClient.totalSpent.toLocaleString() : '0'}{' '}
                      MAD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Notes</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 text-sm sm:text-base">
                  {selectedClient.notes || 'Aucune note disponible.'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Sessions et Événements à venir
              </h4>
              {selectedClient.upcomingSessions && selectedClient.upcomingSessions.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {selectedClient.upcomingSessions.map((session, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 last:border-b-0 space-y-2 sm:space-y-0"
                    >
                      <div className="text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            {session.service}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              session.type === 'event'
                                ? 'bg-purple-100 text-purple-800'
                                : session.type === 'session'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {session.type === 'event'
                              ? 'Événement'
                              : session.type === 'session'
                                ? 'Session'
                                : 'Réservation'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString('fr-FR')} à {session.time}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.payment ? session.payment.toLocaleString() : '0'} MAD
                        </div>
                      </div>
                      <ProfessionalButton variant="ghost" size="sm">
                        Détails
                      </ProfessionalButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
                  Aucune session ou événement à venir
                </div>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Historique des sessions et événements
              </h4>
              {selectedClient.pastSessions && selectedClient.pastSessions.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Service
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Montant
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedClient.pastSessions.map((session, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(session.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  session.type === 'event'
                                    ? 'bg-purple-100 text-purple-800'
                                    : session.type === 'session'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {session.type === 'event'
                                  ? 'Événement'
                                  : session.type === 'session'
                                    ? 'Session'
                                    : 'Réservation'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.service}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.payment ? session.payment.toLocaleString() : '0'} MAD
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  session.status === 'completed' || session.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : session.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : session.status === 'no_show'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {session.status === 'completed' || session.status === 'confirmed'
                                  ? 'Complété'
                                  : session.status === 'cancelled'
                                    ? 'Annulé'
                                    : session.status === 'no_show'
                                      ? 'Non présenté'
                                      : session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="block sm:hidden divide-y divide-gray-200">
                    {selectedClient.pastSessions.map((session, index) => (
                      <div key={index} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 text-sm">
                                {session.service}
                              </div>
                              <span
                                className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  session.type === 'event'
                                    ? 'bg-purple-100 text-purple-800'
                                    : session.type === 'session'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {session.type === 'event'
                                  ? 'Événement'
                                  : session.type === 'session'
                                    ? 'Session'
                                    : 'Réservation'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(session.date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 text-sm">
                              {session.payment ? session.payment.toLocaleString() : '0'} MAD
                            </div>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                session.status === 'completed' || session.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : session.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : session.status === 'no_show'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {session.status === 'completed' || session.status === 'confirmed'
                                ? 'Complété'
                                : session.status === 'cancelled'
                                  ? 'Annulé'
                                  : session.status === 'no_show'
                                    ? 'Non présenté'
                                    : session.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
                  Aucun historique disponible
                </div>
              )}
            </div>

            {/* Commandes du client */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Commandes</h4>
              {selectedClient.orders && selectedClient.orders.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Produits
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Montant
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedClient.orders.map((order, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <ul className="list-disc list-inside">
                                {order.items.map((item, idx) => (
                                  <li key={idx}>
                                    {item.quantity}x {item.product.name || item.product.title}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.totalAmount
                                ? order.totalAmount.amount
                                  ? order.totalAmount.amount.toLocaleString()
                                  : '0'
                                : order.total
                                  ? order.total.toLocaleString()
                                  : '0'}{' '}
                              MAD
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === 'completed' || order.status === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : order.status === 'processing' || order.status === 'pending'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status === 'completed' || order.status === 'delivered'
                                  ? 'Livré'
                                  : order.status === 'cancelled'
                                    ? 'Annulé'
                                    : order.status === 'processing'
                                      ? 'En traitement'
                                      : order.status === 'pending'
                                        ? 'En attente'
                                        : order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="block sm:hidden divide-y divide-gray-200">
                    {selectedClient.orders.map((order, index) => (
                      <div key={index} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString('fr-FR')}
                          </div>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'completed' || order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : order.status === 'processing' || order.status === 'pending'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status === 'completed' || order.status === 'delivered'
                              ? 'Livré'
                              : order.status === 'cancelled'
                                ? 'Annulé'
                                : order.status === 'processing'
                                  ? 'En traitement'
                                  : order.status === 'pending'
                                    ? 'En attente'
                                    : order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          <ul className="list-disc list-inside space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.quantity}x {item.product.name || item.product.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="font-medium text-gray-900">
                          {order.totalAmount
                            ? order.totalAmount.amount
                              ? order.totalAmount.amount.toLocaleString()
                              : '0'
                            : order.total
                              ? order.total.toLocaleString()
                              : '0'}{' '}
                          MAD
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
                  Aucune commande
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 shadow-lotus"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header avec titre et boutons d'action */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Clients</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-600">
          Consultez et gérez vos clients actuels
        </p>
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

      {/* Barre de recherche et filtres */}
      <ProfessionalCard
        className={`mb-6 sm:mb-8 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}
      >
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                  placeholder="Rechercher par nom, email ou tag..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <label htmlFor="filter" className="sr-only">
                Filtrer par statut
              </label>
              <select
                id="filter"
                name="filter"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                value={filterStatus}
                onChange={handleFilterChange}
              >
                <option value="all">Tous les clients</option>
                <option value="active">Clients actifs</option>
                <option value="inactive">Clients inactifs</option>
              </select>
            </div>
            <div className="flex-shrink-0">
              <label htmlFor="filterType" className="sr-only">
                Filtrer par type
              </label>
              <select
                id="filterType"
                name="filterType"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                value={filterType}
                onChange={handleFilterTypeChange}
              >
                <option value="all">Tous les types</option>
                <option value="session">Sessions uniquement</option>
                <option value="event">Événements uniquement</option>
                <option value="boutique">Boutique uniquement</option>
                <option value="mixed">Clients mixtes</option>
              </select>
            </div>
          </div>
        </div>
      </ProfessionalCard>

      {/* Liste des clients */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6 sm:mb-8">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="min-w-full divide-y divide-gray-200">
            <div className="bg-gray-50">
              <div className="grid grid-cols-12 gap-3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Client</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-2">Dernière visite</div>
                <div className="col-span-2">Sessions</div>
                <div className="col-span-2">Total dépensé</div>
              </div>
            </div>
            <div className="bg-white divide-y divide-gray-200">
              {clients.length > 0 ? (
                clients.map(client => (
                  <div
                    key={client.id}
                    className="grid grid-cols-12 gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleClientSelect(client)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleClientSelect(client);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="col-span-3 flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={client.image || 'https://via.placeholder.com/150?text=Client'}
                          alt={client.name}
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=Client';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {client.tags &&
                            client.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 flex flex-col justify-center">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm text-gray-900">
                        {client.lastVisit
                          ? new Date(client.lastVisit).toLocaleDateString('fr-FR')
                          : 'Jamais'}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm text-gray-900">
                        {client.totalSessions} sessions
                        {client.tags && client.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {client.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {client.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{client.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {client.totalSpent ? client.totalSpent.toLocaleString() : '0'} MAD
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.totalSessions > 0
                            ? `Moy: ${Math.round(client.totalSpent / client.totalSessions).toLocaleString()} MAD/session`
                            : 'Aucune session'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  Aucun client trouvé. Ajustez vos critères de recherche.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden divide-y divide-gray-200">
          {clients.length > 0 ? (
            clients.map(client => (
              <div
                key={client.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleClientSelect(client)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClientSelect(client);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={client.image || 'https://via.placeholder.com/150?text=Client'}
                      alt={client.name}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Client';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{client.name}</h3>
                      <ArrowRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {client.tags &&
                        client.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {tag}
                          </span>
                        ))}
                      {client.tags && client.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{client.tags.length - 2}</span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                      <div>
                        <span>{client.totalSessions} sessions</span>
                        {client.totalSessions > 0 && (
                          <div className="text-xs text-gray-400">
                            Moy:{' '}
                            {Math.round(client.totalSpent / client.totalSessions).toLocaleString()}{' '}
                            MAD/session
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {client.totalSpent ? client.totalSpent.toLocaleString() : '0'} MAD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun client trouvé. Ajustez vos critères de recherche.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mb-6 sm:mb-8">
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                pagination.page === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Précédent</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {[...Array(pagination.pages).keys()].map((_, i) => {
              const pageNumber = i + 1;
              // Show current page, first, last, and pages around current
              if (
                pageNumber === 1 ||
                pageNumber === pagination.pages ||
                (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.page === pageNumber
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                (pageNumber === 2 && pagination.page > 3) ||
                (pageNumber === pagination.pages - 1 && pagination.page < pagination.pages - 2)
              ) {
                // Show ellipsis
                return (
                  <span
                    key={pageNumber}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page === pagination.pages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                pagination.page === pagination.pages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Suivant</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      )}

      {/* Statistiques clients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfessionalCard>
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 sm:p-3 rounded-md bg-primary-100">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <div className="ml-3 sm:ml-5">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Clients Totaux</h3>
                <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
                  {stats.totalClients}
                </p>
                <p className="text-xs text-gray-500 mt-1">Sessions, Événements & Boutique</p>
              </div>
            </div>
          </div>
        </ProfessionalCard>

        <ProfessionalCard>
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 sm:p-3 rounded-md bg-green-100">
                <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-5">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Clients Actifs</h3>
                <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
                  {stats.activeClients}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalClients > 0
                    ? Math.round((stats.activeClients / stats.totalClients) * 100)
                    : 0}
                  % du total
                </p>
              </div>
            </div>
          </div>
        </ProfessionalCard>

        <ProfessionalCard>
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 sm:p-3 rounded-md bg-blue-100">
                <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-5">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Revenu Total</h3>
                <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
                  {stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'} MAD
                </p>
                <p className="text-xs text-gray-500 mt-1">Toutes activités confondues</p>
              </div>
            </div>
          </div>
        </ProfessionalCard>

        <ProfessionalCard>
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 sm:p-3 rounded-md bg-purple-100">
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-5">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Revenu Moyen</h3>
                <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
                  {stats.averageRevenue ? stats.averageRevenue.toLocaleString() : '0'} MAD
                </p>
                <p className="text-xs text-gray-500 mt-1">Par client</p>
              </div>
            </div>
          </div>
        </ProfessionalCard>
      </div>

      {/* Afficher les modals si nécessaire */}
      {showClientDetails && <ClientDetailModal />}
    </div>
  );
};

export default ProfessionalClientsPage;
