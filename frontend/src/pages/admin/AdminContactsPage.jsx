import {
  EnvelopeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  ArchiveBoxIcon,
  PhoneIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseType, setResponseType] = useState('email');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    professional: 0,
    information: 0,
    pending: 0,
    processed: 0,
  });

  // Fetch contacts data
  const fetchContacts = async (page = 1, search = '', type = '', status = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contacts`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: 12, // Increased for cards layout
            search,
            type,
            status,
          },
        }
      );

      setContacts(response.data.contacts);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(currentPage, searchTerm, typeFilter, statusFilter);
  }, [currentPage, searchTerm, typeFilter, statusFilter]);

  // Mark contact as processed/unprocessed
  const toggleProcessed = async (contactId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contacts/${contactId}/status`,
        { isProcessed: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        !currentStatus ? 'Contact marqué comme traité' : 'Contact marqué comme non traité'
      );
      fetchContacts(currentPage, searchTerm, typeFilter, statusFilter);
    } catch (error) {
      console.error('Error toggling processed status:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  // Delete contact
  const deleteContact = async contactId => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contacts/${contactId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Contact supprimé avec succès');
      fetchContacts(currentPage, searchTerm, typeFilter, statusFilter);
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // View contact details
  const viewContactDetails = contact => {
    setSelectedContact(contact);
    setShowDetailsModal(true);

    // Mark as read if not already
    if (!contact.isRead) {
      markAsRead(contact._id);
    }
  };

  // Open response modal
  const openResponseModal = contact => {
    setSelectedContact(contact);
    setResponseMessage('');
    setResponseType('email');
    setShowResponseModal(true);
  };

  // Send response to contact
  const sendResponse = async () => {
    if (!responseMessage.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    try {
      setSendingResponse(true);
      const token = localStorage.getItem('token');

      // Debug logs
      console.log('Sending response to contact:', selectedContact._id);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Message:', responseMessage.trim());
      console.log('Response type:', responseType);

      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contacts/${selectedContact._id}/respond`;
      console.log('Request URL:', url);

      const response = await axios.post(
        url,
        {
          message: responseMessage.trim(),
          responseType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response received:', response.data);
      toast.success('Réponse envoyée avec succès');
      setShowResponseModal(false);
      setResponseMessage('');
      fetchContacts(currentPage, searchTerm, typeFilter, statusFilter);
    } catch (error) {
      console.error('Error sending response:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSendingResponse(false);
    }
  };

  // Mark contact as read
  const markAsRead = async contactId => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contacts/${contactId}/read`,
        { isRead: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setContacts(
        contacts.map(contact =>
          contact._id === contactId ? { ...contact, isRead: true } : contact
        )
      );
    } catch (error) {
      console.error('Error marking contact as read:', error);
    }
  };

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'professional', label: 'Demande professionnelle' },
    { value: 'information', label: "Demande d'information" },
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'processed', label: 'Traités' },
  ];

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
              <EnvelopeIcon className="h-8 w-8 text-emerald-600 mr-3" />
              Gestion des Contacts
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez tous les messages de contact de la plateforme
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[
          { label: 'Total Messages', value: stats.total, icon: InboxIcon, color: 'blue' },
          { label: 'Demandes Pro', value: stats.professional, icon: UserIcon, color: 'green' },
          {
            label: 'Informations',
            value: stats.information,
            icon: ExclamationTriangleIcon,
            color: 'purple',
          },
          { label: 'En attente', value: stats.pending, icon: ClockIcon, color: 'yellow' },
          { label: 'Traités', value: stats.processed, icon: ArchiveBoxIcon, color: 'gray' },
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
                      : stat.color === 'purple'
                        ? 'bg-purple-100'
                        : stat.color === 'yellow'
                          ? 'bg-yellow-100'
                          : stat.color === 'gray'
                            ? 'bg-gray-100'
                            : 'bg-gray-100'
                }`}
              >
                <stat.icon
                  className={`h-6 w-6 ${
                    stat.color === 'blue'
                      ? 'text-blue-600'
                      : stat.color === 'green'
                        ? 'text-green-600'
                        : stat.color === 'purple'
                          ? 'text-purple-600'
                          : stat.color === 'yellow'
                            ? 'text-yellow-600'
                            : stat.color === 'gray'
                              ? 'text-gray-600'
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
                placeholder="Rechercher par nom, email, message..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Contacts Cards Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun contact trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun contact ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  !contact.isRead ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="ml-3">
                        <h3
                          className={`text-sm font-medium ${
                            !contact.isRead ? 'text-gray-900 font-bold' : 'text-gray-900'
                          }`}
                        >
                          {contact.type === 'professional'
                            ? contact.businessName
                            : `${contact.firstName} ${contact.lastName}`}
                        </h3>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.type === 'professional'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {contact.type === 'professional' ? 'Pro' : 'Info'}
                      </span>
                      {!contact.isRead && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {contact.message || contact.activityType || 'Pas de message'}
                    </div>

                    {contact.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        {contact.phone}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(contact.createdAt).toLocaleDateString('fr-FR')}
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.isProcessed
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {contact.isProcessed ? 'Traité' : 'En attente'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => viewContactDetails(contact)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Voir détails"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openResponseModal(contact)}
                      className="text-emerald-600 hover:text-emerald-900 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="Répondre"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleProcessed(contact._id, contact.isProcessed)}
                      className={`p-2 rounded-lg transition-colors ${
                        contact.isProcessed
                          ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={
                        contact.isProcessed ? 'Marquer comme non traité' : 'Marquer comme traité'
                      }
                    >
                      {contact.isProcessed ? (
                        <XCircleIcon className="h-4 w-4" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteContact(contact._id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contact Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedContact && (
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
                  <h3 className="text-xl font-bold text-gray-900">Détails du Contact</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Informations de Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedContact.type === 'professional' ? (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Nom de l'entité</p>
                            <p className="font-medium">{selectedContact.businessName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date de création</p>
                            <p className="font-medium">
                              {new Date(selectedContact.businessCreationDate).toLocaleDateString(
                                'fr-FR'
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Type d'activité</p>
                            <p className="font-medium">{selectedContact.activityType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Formule choisie</p>
                            <p className="font-medium">{selectedContact.selectedPlan}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Prénom</p>
                            <p className="font-medium">{selectedContact.firstName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Nom</p>
                            <p className="font-medium">{selectedContact.lastName}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedContact.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium">{selectedContact.phone || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date de soumission</p>
                        <p className="font-medium">
                          {new Date(selectedContact.createdAt).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(selectedContact.createdAt).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedContact.type === 'professional'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {selectedContact.type === 'professional'
                            ? 'Demande professionnelle'
                            : "Demande d'information"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {(selectedContact.message || selectedContact.activityType) && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Message</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedContact.message ||
                          (selectedContact.type === 'professional'
                            ? `Demande professionnelle: ${selectedContact.activityType || 'Non spécifié'}`
                            : 'Pas de message')}
                      </p>
                    </div>
                  )}

                  {/* Responses History */}
                  {selectedContact.responses && selectedContact.responses.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Historique des Réponses</h4>
                      <div className="space-y-3">
                        {selectedContact.responses.map((response, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3 border border-green-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {response.adminId?.firstName} {response.adminId?.lastName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(response.sentAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {response.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                Type: {response.responseType === 'email' ? 'Email' : 'Note interne'}
                              </span>
                              {response.isSent && (
                                <span className="text-xs text-green-600">✓ Envoyé</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Statut</h4>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedContact.isProcessed
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {selectedContact.isProcessed ? 'Traité' : 'En attente'}
                      </span>
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedContact.isRead
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {selectedContact.isRead ? 'Lu' : 'Non lu'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openResponseModal(selectedContact);
                      }}
                      className="px-4 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-sm font-medium"
                    >
                      Répondre
                    </button>
                    <button
                      onClick={() =>
                        toggleProcessed(selectedContact._id, selectedContact.isProcessed)
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedContact.isProcessed
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {selectedContact.isProcessed
                        ? 'Marquer comme non traité'
                        : 'Marquer comme traité'}
                    </button>
                    <button
                      onClick={() => deleteContact(selectedContact._id)}
                      className="px-4 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowResponseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Répondre au Contact</h3>
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Destinataire</h4>
                    <p className="text-sm text-gray-600">
                      {selectedContact.type === 'professional'
                        ? selectedContact.businessName
                        : `${selectedContact.firstName} ${selectedContact.lastName}`}
                    </p>
                    <p className="text-sm text-gray-600">{selectedContact.email}</p>
                  </div>

                  {/* Response Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de réponse
                    </label>
                    <select
                      value={responseType}
                      onChange={e => setResponseType(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="email">Email</option>
                      <option value="internal_note">Note interne</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={responseMessage}
                      onChange={e => setResponseMessage(e.target.value)}
                      rows={6}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Saisissez votre réponse..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowResponseModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={sendResponse}
                      disabled={sendingResponse || !responseMessage.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center"
                    >
                      {sendingResponse ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminContactsPage;
