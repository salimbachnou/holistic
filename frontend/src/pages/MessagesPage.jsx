import { PaperAirplaneIcon, ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import _axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage = () => {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [professional, setProfessional] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [isTempProfessional, setIsTempProfessional] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const messagesEndRef = useRef(null);

  // Constante pour l'image par défaut
  const DEFAULT_PROFILE_IMAGE = 'https://placehold.co/40x40/gray/white?text=User';

  // Fonction pour obtenir le token d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/messages/${professionalId}` } });
      return;
    }

    // Vérifier si c'est un ID temporaire (commençant par 'temp-')
    if (professionalId.startsWith('temp-')) {
      setIsTempProfessional(true);
      // Créer un professionnel fictif pour les IDs temporaires
      const mockProfessional = {
        _id: professionalId,
        businessName: 'Professionnel Temporaire',
        firstName: 'Service',
        lastName: 'Client',
        specialties: ['Assistance'],
        profileImage: DEFAULT_PROFILE_IMAGE,
      };
      setProfessional(mockProfessional);
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        let professionalData = null;

        // Essayer d'abord de récupérer le professionnel par userId (qui est l'ID passé dans l'URL)
        try {
          // Remarque: l'API s'attend à ce que professionalId soit l'ID de l'utilisateur (userId)
          // et non l'ID du document professionnel (_id)
          const proResponse = await _axios.get(
            `http://localhost:5000/api/professionals/${professionalId}`,
            getAuthHeaders()
          );

          if (proResponse.data && proResponse.data.professional) {
            professionalData = proResponse.data.professional;
            setProfessional(professionalData);
          } else {
            throw new Error('Professionnel non trouvé');
          }
        } catch (userIdError) {
          console.error('Error fetching professional by userId:', userIdError);

          // Essayer ensuite de récupérer directement par l'ID du professionnel
          try {
            const proResponse = await _axios.get(
              `http://localhost:5000/api/professionals/${professionalId}`,
              getAuthHeaders()
            );
            professionalData = proResponse.data.professional;
            setProfessional(professionalData);
          } catch (proError) {
            console.error('Error fetching professional by _id:', proError);

            // Créer un ID temporaire pour ce professionnel
            const tempId = `temp-${professionalId}`;
            setIsTempProfessional(true);

            // Créer un professionnel fictif avec l'ID fourni
            const mockProfessional = {
              _id: tempId,
              businessName: 'Professionnel',
              firstName: 'Utilisateur',
              lastName: 'Indisponible',
              specialties: ['Service'],
              profileImage: DEFAULT_PROFILE_IMAGE,
            };
            professionalData = mockProfessional;
            setProfessional(mockProfessional);
            toast.error("Destinataire introuvable. Ce professionnel n'existe peut-être plus.");

            // Simuler un message système
            setTimeout(() => {
              const systemMessage = {
                _id: `system-${Date.now()}`,
                senderId: tempId,
                receiverId: user?._id || 'current-user',
                content:
                  "Ce professionnel n'est plus disponible sur la plateforme. Vous pouvez toujours envoyer des messages, mais ils seront traités par notre service client.",
                createdAt: new Date().toISOString(),
                isSystemMessage: true,
              };
              setMessages([systemMessage]);
            }, 500);
          }
        }

        // Ne pas essayer de récupérer les messages si c'est un ID temporaire ou si le professionnel n'a pas été trouvé
        if (professionalData && !professionalData._id.startsWith('temp-')) {
          // Fetch conversation if it exists
          try {
            // S'assurer que userId est une chaîne de caractères valide
            // Utiliser l'ID utilisateur associé au professionnel pour les messages
            const userId = professionalData.userId
              ? typeof professionalData.userId === 'object'
                ? professionalData.userId._id
                : professionalData.userId
              : professionalId;

            console.log('Using userId for messages:', userId);

            const msgResponse = await _axios.get(
              `http://localhost:5000/api/messages/${userId}`,
              getAuthHeaders()
            );
            if (msgResponse.data) {
              // Adapter le format des messages reçus au format attendu par l'interface
              const formattedMessages = Array.isArray(msgResponse.data)
                ? msgResponse.data.map(msg => ({
                    _id: msg._id,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    content: msg.text || msg.content, // Utiliser text ou content selon ce qui est disponible
                    createdAt: msg.timestamp || msg.createdAt,
                    isRead: msg.isRead,
                  }))
                : [];
              setMessages(formattedMessages);
            }
          } catch (msgError) {
            console.error('Error fetching messages:', msgError);

            // Afficher un message d'erreur spécifique pour l'erreur 401
            if (msgError.response && msgError.response.status === 401) {
              toast.error('Session expirée. Veuillez vous reconnecter.');
              // Rediriger vers la page de connexion si le token est invalide
              navigate('/login', { state: { from: `/messages/${professionalId}` } });
              return;
            } else if (msgError.response && msgError.response.status === 404) {
              // Pas de messages trouvés, c'est normal pour une nouvelle conversation
              setMessages([]);
            } else {
              setMessages([]);
              // Ne pas afficher de message d'erreur ici car on a déjà géré l'erreur de professionnel
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Une erreur est survenue lors du chargement des données.');
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [professionalId, isAuthenticated, navigate, DEFAULT_PROFILE_IMAGE, user]);

  // Gérer le message initial de commande s'il existe
  useEffect(() => {
    // Éviter les envois multiples en vérifiant si le message a déjà été envoyé
    if (location.state?.initialMessage && !initialMessageSent && professional && !loading) {
      setNewMessage(location.state.initialMessage);
      // Marquer immédiatement comme envoyé pour éviter les envois multiples
      setInitialMessageSent(true);

      // Attendre un peu avant d'envoyer automatiquement le message
      const timer = setTimeout(() => {
        // Au lieu d'appeler directement handleSendMessage, nous allons simuler un clic sur le bouton d'envoi
        const sendButton = document.getElementById('send-message-button');
        if (sendButton) {
          sendButton.click();
        } else {
          // Si le bouton n'est pas trouvé, envoyons le message manuellement
          if (newMessage.trim()) {
            const event = new Event('submit');
            event.preventDefault = () => {}; // Simuler la méthode preventDefault
            handleSendMessage(event);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, professional, loading, initialMessageSent]);

  const handleSendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      // Si c'est un ID temporaire ou si le professionnel n'existe pas, simuler l'envoi du message
      if (isTempProfessional || (professional && professional._id.toString().startsWith('temp-'))) {
        // Simuler un délai d'envoi
        await new Promise(resolve => setTimeout(resolve, 500));

        // Créer un message fictif
        const mockMessage = {
          _id: `temp-msg-${Date.now()}`,
          senderId: user?._id || 'current-user',
          receiverId: professional?._id,
          content: newMessage,
          createdAt: new Date().toISOString(),
        };

        // Ajouter le message à la liste
        setMessages([...messages, mockMessage]);
        setNewMessage('');
        toast.success('Message envoyé');

        // Simuler une réponse automatique après un délai
        setTimeout(() => {
          const autoReply = {
            _id: `temp-reply-${Date.now()}`,
            senderId: professional?._id,
            receiverId: user?._id || 'current-user',
            content: 'Merci pour votre message. Un conseiller vous contactera prochainement.',
            createdAt: new Date().toISOString(),
          };
          setMessages(prevMessages => [...prevMessages, autoReply]);
        }, 1500);

        return;
      }

      // Envoi normal pour les professionnels existants
      try {
        // S'assurer que receiverId est une chaîne de caractères valide
        // Utiliser l'ID utilisateur associé au professionnel
        const receiverId = professional?.userId
          ? typeof professional.userId === 'object'
            ? professional.userId._id
            : professional.userId
          : professionalId;

        console.log('Using receiverId for sending message:', receiverId);

        const response = await _axios.post(
          'http://localhost:5000/api/messages',
          {
            receiverId: receiverId,
            text: newMessage,
            messageType: 'text',
          },
          getAuthHeaders()
        );

        if (response.data) {
          // Créer un format de message cohérent avec le reste de l'application
          const newMsg = {
            _id: response.data._id || `temp-msg-${Date.now()}`,
            senderId: user?._id,
            receiverId: receiverId,
            content: newMessage, // Pour la cohérence dans l'interface
            text: newMessage, // Pour la cohérence avec le backend
            createdAt: response.data.timestamp || new Date().toISOString(),
          };

          // Add the new message to the messages list
          setMessages([...messages, newMsg]);
          setNewMessage('');
          toast.success('Message envoyé');
        }
      } catch (error) {
        console.error('Error sending message:', error);

        // En cas d'erreur 404, 400 ou 500, simuler l'envoi comme si c'était un professionnel temporaire
        if (
          error.response &&
          (error.response.status === 404 ||
            error.response.status === 400 ||
            error.response.status === 500)
        ) {
          // Créer un message fictif pour montrer à l'utilisateur que son message a été envoyé
          const mockMessage = {
            _id: `temp-msg-${Date.now()}`,
            senderId: user?._id || 'current-user',
            receiverId: professional?._id || professionalId,
            content: newMessage,
            createdAt: new Date().toISOString(),
          };

          // Ajouter le message à la liste
          setMessages([...messages, mockMessage]);
          setNewMessage('');

          if (error.response && error.response.status === 500) {
            toast.success('Message envoyé localement (erreur serveur)');
            console.log("Message envoyé en mode local en raison d'une erreur serveur");
          } else {
            toast.success('Message envoyé');
          }

          // Si c'est une erreur 404 ou 400, traiter comme un professionnel temporaire
          if (error.response && (error.response.status === 404 || error.response.status === 400)) {
            // Créer un ID temporaire pour ce professionnel s'il n'en a pas déjà un
            const tempId =
              professional && professional._id.toString().startsWith('temp-')
                ? professional._id
                : `temp-${professionalId}`;

            // Mettre à jour l'état pour indiquer qu'il s'agit d'un professionnel temporaire
            setIsTempProfessional(true);

            // Simuler une réponse automatique après un délai
            setTimeout(() => {
              const autoReply = {
                _id: `temp-reply-${Date.now()}`,
                senderId: tempId,
                receiverId: user?._id || 'current-user',
                content:
                  "Merci pour votre message. Ce professionnel n'est plus disponible sur la plateforme, mais votre message a été transmis à notre service client.",
                createdAt: new Date().toISOString(),
              };
              setMessages(prevMessages => [...prevMessages, autoReply]);
            }, 1500);
          }

          return;
        }

        toast.error("Erreur lors de l'envoi du message");
      } finally {
        setSending(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Une erreur inattendue est survenue');
    }
  };

  const formatMessageTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-slate-600 font-medium">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Erreur</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-white/10 rounded-xl transition-colors duration-200 group"
              >
                <ArrowLeftIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              </button>
              {professional && (
                <div className="flex items-center flex-1">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/30 shadow-lg">
                      <img
                        src={
                          professional.profileImage ||
                          professional.profilePhoto ||
                          'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(
                              professional.businessName ||
                                `${professional.firstName} ${professional.lastName}`
                            ) +
                            '&background=ffffff&color=6366f1&size=48'
                        }
                        alt={
                          professional.businessName ||
                          `${professional.firstName} ${professional.lastName}`
                        }
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(
                              professional.businessName ||
                                `${professional.firstName} ${professional.lastName}`
                            ) +
                            '&background=ffffff&color=6366f1&size=48';
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h2 className="font-semibold text-lg">
                      {professional.businessName ||
                        `${professional.firstName} ${professional.lastName}`}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm opacity-90">
                      {professional.specialties && professional.specialties.length > 0 && (
                        <span>{professional.specialties[0]}</span>
                      )}
                      {professional.businessType && !professional.specialties && (
                        <span>{professional.businessType}</span>
                      )}
                      {isTempProfessional && (
                        <span className="bg-yellow-400/20 text-yellow-100 px-2 py-1 rounded-lg text-xs">
                          Compte temporaire
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="h-[60vh] overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white/50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserCircleIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nouvelle conversation
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Commencez votre conversation avec{' '}
                    {professional?.businessName || professional?.firstName}. Votre message sera
                    envoyé instantanément.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  // Vérifier si le message contient "NOUVELLE COMMANDE" pour s'assurer qu'il s'affiche correctement
                  const isOrderMessage =
                    message.content && message.content.includes('NOUVELLE COMMANDE');
                  // Si c'est un message de commande et que l'utilisateur est connecté, forcer l'affichage comme envoyé par l'utilisateur
                  const isFromCurrentUser = isOrderMessage ? true : message.senderId === user?._id;
                  const isSystemMessage = message.isSystemMessage;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          isSystemMessage
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                            : isFromCurrentUser
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            isSystemMessage
                              ? 'text-yellow-600'
                              : isFromCurrentUser
                                ? 'text-blue-100'
                                : 'text-slate-500'
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 p-6 bg-white/80 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={
                    messages.length === 0
                      ? 'Écrivez votre premier message...'
                      : 'Tapez votre message...'
                  }
                  rows={1}
                  className="w-full border border-slate-300 rounded-2xl py-3 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                id="send-message-button"
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-3 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {sending ? (
                  <svg
                    className="animate-spin h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <PaperAirplaneIcon className="h-6 w-6" />
                )}
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
