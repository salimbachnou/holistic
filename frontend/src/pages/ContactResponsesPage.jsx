import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ContactResponsesPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch contact responses
  const fetchContactResponses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/contact/responses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setContacts(response.data.contacts);
    } catch (error) {
      console.error('Error fetching contact responses:', error);
      toast.error('Erreur lors du chargement des réponses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactResponses();
  }, []);

  // View contact details
  const viewContactDetails = contact => {
    setSelectedContact(contact);
    setShowDetailsModal(true);
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
              <EnvelopeIcon className="h-8 w-8 text-emerald-600 mr-3" />
              Réponses de l'Équipe
            </h1>
            <p className="mt-2 text-gray-600">
              Consultez les réponses de notre équipe à vos demandes de contact
            </p>
          </div>
        </motion.div>
      </div>

      {/* Contact Responses */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune réponse trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vous n'avez pas encore reçu de réponses à vos demandes de contact.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        Répondu
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {contact.message || contact.activityType || 'Pas de message'}
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(contact.createdAt).toLocaleDateString('fr-FR')}
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">
                        {contact.responses.length} réponse{contact.responses.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => viewContactDetails(contact)}
                      className="text-emerald-600 hover:text-emerald-900 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="Voir détails"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

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
                  <h3 className="text-xl font-bold text-gray-900">Détails de la Demande</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Original Request */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Votre Demande</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Date de soumission</p>
                        <p className="font-medium">
                          {new Date(selectedContact.createdAt).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(selectedContact.createdAt).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type de demande</p>
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
                      {(selectedContact.message || selectedContact.activityType) && (
                        <div>
                          <p className="text-sm text-gray-600">Message</p>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {selectedContact.message ||
                              (selectedContact.type === 'professional'
                                ? `Demande professionnelle: ${selectedContact.activityType || 'Non spécifié'}`
                                : 'Pas de message')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Responses */}
                  {selectedContact.responses && selectedContact.responses.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Réponses de l'Équipe</h4>
                      <div className="space-y-4">
                        {selectedContact.responses.map((response, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-4 border border-emerald-200"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <UserIcon className="h-5 w-5 text-emerald-600 mr-2" />
                                <span className="text-sm font-medium text-gray-700">
                                  {response.adminId?.firstName} {response.adminId?.lastName}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(response.sentAt).toLocaleDateString('fr-FR')} à{' '}
                                {new Date(response.sentAt).toLocaleTimeString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {response.message}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">
                                Type: {response.responseType === 'email' ? 'Email' : 'Note interne'}
                              </span>
                              {response.isSent && (
                                <span className="text-xs text-emerald-600">✓ Envoyé</span>
                              )}
                            </div>
                          </div>
                        ))}
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

export default ContactResponsesPage;
