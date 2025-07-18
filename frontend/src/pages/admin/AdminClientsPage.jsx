import {
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon as _PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShoppingBagIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [_showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    newThisMonth: 0,
  });

  // Fetch clients data
  const fetchClients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/clients`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: 10,
            search,
            role: 'client',
          },
        }
      );

      setClients(response.data.clients);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  // Toggle client verification status
  const toggleVerification = async (clientId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/clients/${clientId}/verify`,
        { isVerified: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(!currentStatus ? 'Client vérifié avec succès' : 'Vérification retirée');
      fetchClients(currentPage, searchTerm);
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  // Delete client
  const deleteClient = async clientId => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/clients/${clientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Client supprimé avec succès');
      fetchClients(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // View client details
  const viewClientDetails = async clientId => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/clients/${clientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedClient(response.data.client);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="h-8 w-8 text-emerald-600 mr-3" />
              Gestion des Clients
            </h1>
            <p className="mt-2 text-gray-600">Gérez tous les clients de la plateforme</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouveau Client
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Clients', value: stats.total, icon: UsersIcon, color: 'blue' },
          { label: 'Vérifiés', value: stats.verified, icon: CheckCircleIcon, color: 'green' },
          { label: 'Non Vérifiés', value: stats.unverified, icon: XCircleIcon, color: 'red' },
          {
            label: 'Nouveaux ce mois',
            value: stats.newThisMonth,
            icon: CalendarIcon,
            color: 'purple',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-lg ${
                  stat.color === 'blue'
                    ? 'bg-blue-100'
                    : stat.color === 'green'
                      ? 'bg-green-100'
                      : stat.color === 'red'
                        ? 'bg-red-100'
                        : stat.color === 'purple'
                          ? 'bg-purple-100'
                          : 'bg-gray-100'
                }`}
              >
                <stat.icon
                  className={`h-6 w-6 ${
                    stat.color === 'blue'
                      ? 'text-blue-600'
                      : stat.color === 'green'
                        ? 'text-green-600'
                        : stat.color === 'red'
                          ? 'text-red-600'
                          : stat.color === 'purple'
                            ? 'text-purple-600'
                            : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <motion.tr
                    key={client._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {client.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={client.profileImage}
                            alt={client.fullName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.fullName}</div>
                          <div className="text-sm text-gray-500">ID: {client._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {client.isVerified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewClientDetails(client._id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir détails"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleVerification(client._id, client.isVerified)}
                          className={`p-1 rounded ${
                            client.isVerified
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={client.isVerified ? 'Retirer vérification' : 'Vérifier'}
                        >
                          {client.isVerified ? (
                            <XCircleIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteClient(client._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Client Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Détails du Client</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Client Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Informations Personnelles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nom complet</p>
                        <p className="font-medium">{selectedClient.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedClient.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium">{selectedClient.phone || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date d'inscription</p>
                        <p className="font-medium">
                          {new Date(selectedClient.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Booking History */}
                  {selectedClient.bookingHistory?.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <BookOpenIcon className="h-5 w-5 mr-2" />
                        Historique des Réservations ({selectedClient.bookingHistory.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedClient.bookingHistory.slice(0, 3).map((booking, index) => (
                          <div key={index} className="text-sm">
                            <span className="text-gray-600">Réservation #{booking.slice(-6)}</span>
                          </div>
                        ))}
                        {selectedClient.bookingHistory.length > 3 && (
                          <p className="text-sm text-gray-500">
                            ... et {selectedClient.bookingHistory.length - 3} de plus
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order History */}
                  {selectedClient.orderHistory?.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <ShoppingBagIcon className="h-5 w-5 mr-2" />
                        Historique des Commandes ({selectedClient.orderHistory.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedClient.orderHistory.slice(0, 3).map((order, index) => (
                          <div key={index} className="text-sm">
                            <span className="text-gray-600">Commande #{order.slice(-6)}</span>
                          </div>
                        ))}
                        {selectedClient.orderHistory.length > 3 && (
                          <p className="text-sm text-gray-500">
                            ... et {selectedClient.orderHistory.length - 3} de plus
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminClientsPage;
