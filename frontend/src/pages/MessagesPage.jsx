import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
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

  // States pour les conversations
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 640); // Hide by default on mobile
  const [lastConversationsFetch, setLastConversationsFetch] = useState(0);

  // States pour les messages
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [professional, setProfessional] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Debug log pour la modal
  useEffect(() => {
    // Image preview state tracking
  }, [previewImage]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Constante pour l'image par défaut
  const DEFAULT_PROFILE_IMAGE = 'https://placehold.co/40x40/gray/white?text=User';

  // Fonction pour obtenir le token d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Fonction pour gérer les fichiers multiples
  const handleMultipleFiles = (files, isShiftPressed = false) => {
    const maxFiles = 5;
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ],
    };

    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file, index) => {
      if (validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }

      if (file.size > maxFileSize) {
        errors.push(`${file.name}: Taille trop importante (max 10MB)`);
        return;
      }

      const isImage = allowedTypes.images.includes(file.type);
      const isDocument = allowedTypes.documents.includes(file.type);

      if (!isImage && !isDocument) {
        errors.push(`${file.name}: Type de fichier non supporté`);
        return;
      }

      // Logique professionnelle pour Shift
      if (isShiftPressed && isImage) {
        // Avec Shift: Compression et optimisation pour images
        const reader = new FileReader();
        reader.onload = e => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Redimensionner si nécessaire (max 1920x1080)
            const maxWidth = 1920;
            const maxHeight = 1080;
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              blob => {
                const optimizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                validFiles.push({
                  file: optimizedFile,
                  id: Date.now() + index,
                  type: 'image',
                  preview: URL.createObjectURL(optimizedFile),
                  optimized: true,
                });

                setAttachments(prev => [...prev, ...validFiles]);
              },
              'image/jpeg',
              0.8
            );
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Sans Shift: Fichier original
        validFiles.push({
          file,
          id: Date.now() + index,
          type: isImage ? 'image' : 'document',
          preview: isImage ? URL.createObjectURL(file) : null,
          optimized: false,
        });
      }
    });

    if (!isShiftPressed || files.length === 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }
  };

  // Gestion du drag and drop
  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    const isShiftPressed = e.shiftKey;

    if (files && files.length > 0) {
      handleMultipleFiles(files, isShiftPressed);
    }
  };

  // Gestion de la sélection de fichiers
  const handleFileSelect = (e, type = 'all') => {
    const files = e.target.files;
    const isShiftPressed = e.shiftKey;

    if (files && files.length > 0) {
      handleMultipleFiles(files, isShiftPressed);
    }

    // Reset input
    e.target.value = '';
  };

  // Supprimer un fichier attaché
  const removeAttachment = id => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      // Nettoyer les URLs d'objet
      const toRemove = prev.find(att => att.id === id);
      if (toRemove && toRemove.preview) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return updated;
    });
  };

  // Upload des fichiers
  const uploadAttachments = async () => {
    if (attachments.length === 0) return [];

    const uploadedFiles = [];
    setUploadingAttachment(true);

    try {
      for (const attachment of attachments) {
        const formData = new FormData();
        formData.append('file', attachment.file);

        const response = await _axios.post(
          'https://holistic-maroc-backend.onrender.com/api/uploads/message',
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        uploadedFiles.push({
          type: attachment.type,
          url: response.data.url,
          filename: attachment.file.name,
          size: attachment.file.size,
          mimetype: attachment.file.type,
          optimized: attachment.optimized,
        });
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading attachments:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Erreur lors du téléchargement des fichiers');
      return [];
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    };

    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Charger les conversations au démarrage
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/messages/${professionalId}` } });
      return;
    }
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  // Sélectionner une conversation
  const selectConversation = conversation => {
    navigate(`/messages/${conversation.otherPerson._id}`);
  };

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = async senderId => {
    try {
      if (markMessagesAsRead.lastSenderId === senderId) {
        return;
      }

      await _axios.post(
        `https://holistic-maroc-backend.onrender.com/api/messages/mark-read/${senderId}`,
        {},
        getAuthHeaders()
      );

      markMessagesAsRead.lastSenderId = senderId;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fonction pour charger les messages d'une conversation spécifique
  const loadConversationMessages = async conversationId => {
    try {
      setLoading(true);

      const conversation = conversations.find(conv => conv.otherPerson._id === conversationId);

      if (conversation) {
        setProfessional({
          _id: conversation.otherPerson._id,
          firstName: conversation.otherPerson.firstName,
          lastName: conversation.otherPerson.lastName,
          businessName: conversation.otherPerson.businessName,
          profileImage: conversation.otherPerson.profileImage,
          specialties: conversation.otherPerson.specialties || [],
          isTemporary: false,
        });

        await fetchMessages(conversation.otherPerson._id);

        if (conversation.unreadCount > 0) {
          await markMessagesAsRead(conversation.otherPerson._id);

          setTimeout(() => {
            fetchConversations(true);
          }, 1000);
        }
      } else {
        await fetchProfessionalAndMessages();
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      await fetchProfessionalAndMessages();
    } finally {
      setLoading(false);
    }
  };

  // Charger les données du professionnel et messages quand professionalId change
  useEffect(() => {
    if (professionalId && isAuthenticated) {
      if (conversations.length > 0) {
        loadConversationMessages(professionalId);
      } else {
        fetchProfessionalAndMessages();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, isAuthenticated]);

  // Gérer le message initial de commande s'il existe
  useEffect(() => {
    if (location.state?.initialMessage && !initialMessageSent && professional && !loading) {
      setNewMessage(location.state.initialMessage);
      setInitialMessageSent(true);

      const timer = setTimeout(() => {
        if (location.state.initialMessage.trim()) {
          handleSendMessage(new Event('submit'));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.initialMessage, initialMessageSent, professional, loading]);

  // Récupérer les conversations
  const fetchConversations = async (force = false) => {
    try {
      const now = Date.now();
      if (!force && now - lastConversationsFetch < 5000) {
        return;
      }

      setConversationsLoading(true);
      const response = await _axios.get(
        'https://holistic-maroc-backend.onrender.com/api/messages/conversations',
        getAuthHeaders()
      );

      if (response.data?.success && response.data.conversations) {
        setConversations(response.data.conversations);
      } else if (Array.isArray(response.data)) {
        setConversations(response.data);
      } else {
        setConversations([]);
      }

      setLastConversationsFetch(now);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  // Récupérer les données du professionnel et les messages
  const fetchProfessionalAndMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const professionalData = await fetchProfessional(professionalId);
      if (professionalData) {
        setProfessional(professionalData);

        const userId = professionalData.userId
          ? typeof professionalData.userId === 'object'
            ? professionalData.userId._id
            : professionalData.userId
          : professionalId;

        await fetchMessages(userId);

        if (!professionalData.isTemporary) {
          await markMessagesAsRead(userId);

          setTimeout(() => {
            fetchConversations(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Une erreur est survenue lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un professionnel
  const fetchProfessional = async id => {
    try {
      const response = await _axios.get(
        `https://holistic-maroc-backend.onrender.com/api/professionals/${id}`,
        getAuthHeaders()
      );

      if (response.data?.professional) {
        return response.data.professional;
      }
    } catch (error) {
      console.error('Error fetching professional:', error);

      return {
        _id: `temp-${id}`,
        businessName: 'Professionnel',
        firstName: 'Utilisateur',
        lastName: 'Indisponible',
        specialties: ['Service'],
        profileImage: DEFAULT_PROFILE_IMAGE,
        isTemporary: true,
      };
    }
    return null;
  };

  // Récupérer les messages
  const fetchMessages = async userId => {
    try {
      setMessagesLoading(true);
      const response = await _axios.get(
        `https://holistic-maroc-backend.onrender.com/api/messages/${userId}`,
        getAuthHeaders()
      );

      if (response.data) {
        const formattedMessages = Array.isArray(response.data)
          ? response.data.map(msg => ({
              _id: msg._id,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: msg.text || msg.content,
              createdAt: msg.timestamp || msg.createdAt,
              isRead: msg.isRead,
              messageType: msg.messageType,
              attachments: msg.attachments,
            }))
          : [];
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: `/messages/${professionalId}` } });
      } else {
        setMessages([]);
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  // Envoyer un message
  const handleSendMessage = async e => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !professional) return;

    try {
      setSending(true);

      if (professional?.isTemporary) {
        await simulateMessageSend();
        return;
      }

      let uploadedAttachments = [];
      if (attachments.length > 0) {
        uploadedAttachments = await uploadAttachments();
        if (uploadedAttachments.length === 0) {
          toast.error('Échec du téléchargement des fichiers');
          return;
        }
      }

      const receiverId = professional?.userId
        ? typeof professional.userId === 'object'
          ? professional.userId._id
          : professional.userId
        : professionalId;

      const response = await _axios.post(
        'https://holistic-maroc-backend.onrender.com/api/messages',
        {
          receiverId: receiverId,
          text:
            newMessage.trim() ||
            (attachments.length > 0 ? `${attachments.length} fichier(s) envoyé(s)` : ''),
          messageType:
            uploadedAttachments.length > 0
              ? uploadedAttachments[0].type === 'image'
                ? 'image'
                : 'file'
              : 'text',
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        },
        getAuthHeaders()
      );

      if (response.data) {
        const newMsg = {
          _id: response.data._id || `temp-msg-${Date.now()}`,
          senderId: user?._id || user?.id,
          receiverId: receiverId,
          content:
            newMessage.trim() ||
            (attachments.length > 0 ? `${attachments.length} fichier(s) envoyé(s)` : ''),
          createdAt: response.data.timestamp || new Date().toISOString(),
          messageType:
            uploadedAttachments.length > 0
              ? uploadedAttachments[0].type === 'image'
                ? 'image'
                : 'file'
              : 'text',
          attachments: uploadedAttachments,
        };

        setMessages([...messages, newMsg]);
        setNewMessage('');
        setAttachments([]);
        setShowAttachmentOptions(false);
        toast.success('Message envoyé');

        if (markMessagesAsRead.lastSenderId !== receiverId) {
          await markMessagesAsRead(receiverId);
        }

        setTimeout(() => {
          fetchConversations(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      await simulateMessageSend();
    } finally {
      setSending(false);
    }
  };

  // Simuler l'envoi d'un message
  const simulateMessageSend = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockMessage = {
      _id: `temp-msg-${Date.now()}`,
      senderId: user?._id || user?.id || 'current-user',
      receiverId: professional?._id || professionalId,
      content:
        newMessage.trim() ||
        (attachments.length > 0 ? `${attachments.length} fichier(s) envoyé(s)` : ''),
      createdAt: new Date().toISOString(),
      attachments: attachments.map(att => ({
        type: att.type,
        url: att.preview || '#',
        filename: att.file.name,
        size: att.file.size,
        optimized: att.optimized,
      })),
    };

    setMessages([...messages, mockMessage]);
    setNewMessage('');
    setAttachments([]);
    setShowAttachmentOptions(false);
    toast.success('Message envoyé');

    setTimeout(() => {
      const autoReply = {
        _id: `temp-reply-${Date.now()}`,
        senderId: professional?._id || professionalId,
        receiverId: user?._id || user?.id || 'current-user',
        content: 'Merci pour votre message. Un conseiller vous contactera prochainement.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, autoReply]);
    }, 1500);
  };

  // Formater l'heure des messages
  const formatMessageTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
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

  // Filtrer les conversations
  const filteredConversations = conversations.filter(
    conversation =>
      conversation.otherPerson &&
      `${conversation.otherPerson.firstName} ${conversation.otherPerson.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setShowSidebar(true);
      } else if (professionalId) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [professionalId]);

  if (loading && !professional) {
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
      {/* Preview Modal */}
      {previewImage && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
          onClick={() => setPreviewImage(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setPreviewImage(null);
          }}
          style={{ zIndex: 9999 }}
          aria-label="Fermer l'aperçu de l'image"
        >
          <div className="relative w-full h-full max-w-4xl max-h-4xl flex items-center justify-center">
            <button
              onClick={e => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              className="absolute top-4 right-4 bg-white text-gray-800 hover:bg-gray-100 rounded-full p-2 shadow-lg z-10 transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </button>
      )}

      <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 overflow-hidden max-w-7xl mx-auto">
          <div className="flex h-[calc(100vh-2rem)] sm:h-[80vh] relative">
            {/* Mobile overlay */}
            {showSidebar && (
              <button
                type="button"
                className="absolute inset-0 bg-black bg-opacity-50 z-10 sm:hidden"
                onClick={() => setShowSidebar(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowSidebar(false);
                }}
                aria-label="Fermer le menu"
              />
            )}
            {/* Sidebar des conversations */}
            <div
              className={`${showSidebar ? 'w-full sm:w-80 lg:w-96' : 'w-0'} ${
                showSidebar ? 'absolute sm:relative' : ''
              } transition-all duration-300 overflow-hidden border-r border-slate-200 bg-slate-50/50 z-20 h-full ${
                showSidebar ? 'left-0' : '-left-full sm:left-0'
              }`}
            >
              <div className="p-3 sm:p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                    Conversations
                  </h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors sm:hidden"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Liste des conversations */}
              <div className="overflow-y-auto h-full">
                {conversationsLoading ? (
                  <div className="p-8 text-center">
                    <LoadingSpinner />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-sm">
                      {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map(conversation => (
                      <button
                        key={conversation.conversationId}
                        onClick={() => {
                          selectConversation(conversation);
                          setShowSidebar(false); // Close sidebar on mobile after selection
                        }}
                        className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-200 hover:bg-white/80 ${
                          conversation.otherPerson._id === professionalId
                            ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                            : 'hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="relative">
                            <img
                              src={conversation.otherPerson.profileImage || DEFAULT_PROFILE_IMAGE}
                              alt={`${conversation.otherPerson.firstName} ${conversation.otherPerson.lastName}`}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                              onError={e => {
                                e.target.src = DEFAULT_PROFILE_IMAGE;
                              }}
                            />
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </div>
                            )}
                            {conversation.otherPerson._id === professionalId && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm sm:text-base font-medium truncate ${
                                conversation.otherPerson._id === professionalId
                                  ? 'text-blue-900'
                                  : 'text-slate-900'
                              }`}
                            >
                              {conversation.otherPerson.firstName}{' '}
                              {conversation.otherPerson.lastName}
                            </h4>
                            <p
                              className={`text-xs sm:text-sm truncate ${
                                conversation.otherPerson._id === professionalId
                                  ? 'text-blue-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {conversation.lastMessage.content}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <div className="text-xs text-slate-500">
                              {formatMessageTime(conversation.lastMessage.createdAt)}
                            </div>
                            {conversation.otherPerson._id === professionalId && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Zone de messages */}
            <div
              className={`flex-1 flex flex-col ${showSidebar ? 'hidden sm:flex' : 'flex'}`}
              ref={dropZoneRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {dragActive && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 flex items-center justify-center z-20">
                  <div className="text-center p-4">
                    <ArrowUpTrayIcon className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-2 sm:mb-4" />
                    <p className="text-blue-600 font-semibold text-sm sm:text-base">
                      Relâchez pour télécharger les fichiers
                    </p>
                    <p className="text-blue-500 text-xs sm:text-sm">
                      Maintenez Shift pour optimiser les images
                    </p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 flex items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                  {!showSidebar && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors sm:hidden"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {professional && (
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <img
                          src={
                            professional.profileImage ||
                            professional.profilePhoto ||
                            DEFAULT_PROFILE_IMAGE
                          }
                          alt={
                            professional.businessName ||
                            `${professional.firstName} ${professional.lastName}`
                          }
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/30"
                          onError={e => {
                            e.target.src = DEFAULT_PROFILE_IMAGE;
                          }}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {professional.businessName ||
                            `${professional.firstName} ${professional.lastName}`}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs sm:text-sm opacity-90">
                          {professional.specialties && professional.specialties.length > 0 && (
                            <span className="truncate">{professional.specialties[0]}</span>
                          )}
                          {professional.isTemporary && (
                            <span className="bg-yellow-400/20 text-yellow-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs whitespace-nowrap">
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
              <div
                className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gradient-to-b from-slate-50/50 to-white/50 relative"
                ref={messagesContainerRef}
              >
                {/* Scroll button */}
                {showScrollButton && (
                  <button
                    onClick={() => {
                      if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="fixed bottom-20 sm:bottom-32 right-4 sm:right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-2 sm:p-3 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 z-30 border-2 sm:border-4 border-white"
                  >
                    <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}

                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <LoadingSpinner />
                      <p className="mt-4 text-slate-600 font-medium text-sm sm:text-base">
                        Chargement des messages...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <UserCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
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
                  <div className="space-y-3 sm:space-y-4">
                    {messages.map(message => {
                      const currentUserId = user?._id || user?.id;
                      let isFromCurrentUser = false;

                      const normalizeId = id => {
                        if (!id) return '';
                        if (typeof id === 'object' && id._id) return String(id._id);
                        return String(id);
                      };

                      const normalizedCurrentUserId = normalizeId(currentUserId);
                      const normalizedSenderId = normalizeId(message.senderId);

                      isFromCurrentUser = normalizedSenderId === normalizedCurrentUserId;

                      const messageContent = message.content || message.text || '';
                      const isOrderMessage = messageContent.includes('NOUVELLE COMMANDE');
                      const isOrderAcceptedMessage = messageContent.includes('Commande acceptée');
                      const isOrderRejectedMessage = messageContent.includes('Commande refusée');
                      const isFileMessage = messageContent.includes('A envoyé un fichier');

                      if (isOrderAcceptedMessage || isOrderRejectedMessage) {
                        isFromCurrentUser = false;
                      }

                      if (isOrderMessage && !isOrderAcceptedMessage && !isOrderRejectedMessage) {
                        isFromCurrentUser = true;
                      }

                      const isSystemMessage = message.isSystemMessage;

                      return (
                        <div
                          key={message._id}
                          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                              isSystemMessage
                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                : isFromCurrentUser
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md'
                                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                            }`}
                          >
                            {/* Image attachments */}
                            {message.messageType === 'image' &&
                              message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mb-2 sm:mb-3 space-y-2">
                                  {message.attachments.map((attachment, index) => (
                                    <div key={index} className="relative group">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPreviewImage(attachment.url);
                                        }}
                                        className="block w-full rounded-xl max-w-full h-auto max-h-48 sm:max-h-80 object-contain shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-none bg-transparent p-0"
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.filename || 'Image'}
                                          className="rounded-xl max-w-full h-auto max-h-48 sm:max-h-80 object-contain w-full"
                                        />
                                      </button>
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <EyeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                      </div>
                                      {attachment.optimized && (
                                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-green-500 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                          Optimisé
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* File attachments */}
                            {message.messageType === 'file' &&
                              message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mb-2 sm:mb-3 space-y-2">
                                  {message.attachments.map((attachment, index) => (
                                    <a
                                      key={index}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center p-2 sm:p-3 rounded-xl transition-all duration-200 hover:shadow-md ${
                                        isFromCurrentUser
                                          ? 'bg-blue-700 hover:bg-blue-800'
                                          : 'bg-slate-50 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div
                                        className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${
                                          isFromCurrentUser ? 'bg-blue-800' : 'bg-blue-100'
                                        }`}
                                      >
                                        <DocumentIcon
                                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                            isFromCurrentUser ? 'text-white' : 'text-blue-600'
                                          }`}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`font-semibold text-xs sm:text-sm truncate ${
                                            isFromCurrentUser ? 'text-white' : 'text-slate-800'
                                          }`}
                                        >
                                          {attachment.filename || 'Document'}
                                        </p>
                                        <p
                                          className={`text-xs ${
                                            isFromCurrentUser ? 'text-blue-200' : 'text-slate-500'
                                          }`}
                                        >
                                          {attachment.size &&
                                            (attachment.size / 1024 / 1024).toFixed(2)}{' '}
                                          MB
                                        </p>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              )}

                            {/* Affichage spécial pour les messages de commande acceptée */}
                            {isOrderAcceptedMessage && (
                              <div className="flex items-start space-x-2 mb-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                                <div className="text-green-600 font-semibold text-sm">
                                  Commande acceptée
                                </div>
                              </div>
                            )}

                            {/* Affichage spécial pour les messages de commande refusée */}
                            {isOrderRejectedMessage && (
                              <div className="flex items-start space-x-2 mb-2">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </div>
                                <div className="text-red-600 font-semibold text-sm">
                                  Commande refusée
                                </div>
                              </div>
                            )}

                            {/* Affichage spécial pour les nouvelles commandes */}
                            {isOrderMessage &&
                              !isOrderAcceptedMessage &&
                              !isOrderRejectedMessage && (
                                <div className="flex items-start space-x-2 mb-2">
                                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg
                                      className="w-4 h-4 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-orange-600 font-semibold text-sm">
                                    Nouvelle commande
                                  </div>
                                </div>
                              )}

                            {/* Affichage spécial pour les fichiers */}
                            {isFileMessage && (
                              <div className="flex items-start space-x-2 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                  </svg>
                                </div>
                                <div className="text-blue-600 font-semibold text-sm">
                                  Fichier joint
                                </div>
                              </div>
                            )}

                            {/* Contenu du message avec formatage amélioré */}
                            <div className="leading-relaxed">
                              {isOrderMessage &&
                              !isOrderAcceptedMessage &&
                              !isOrderRejectedMessage ? (
                                <div className="space-y-2">
                                  {messageContent.split('\n').map((line, index) => {
                                    if (line.trim() === '') return null;

                                    if (
                                      line.includes('📦') ||
                                      line.includes('💰') ||
                                      line.includes('📏') ||
                                      line.includes('🔢') ||
                                      line.includes('💵')
                                    ) {
                                      return (
                                        <div key={index} className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">{line}</span>
                                        </div>
                                      );
                                    }

                                    if (line.includes('NOUVELLE COMMANDE')) {
                                      return (
                                        <div
                                          key={index}
                                          className="font-bold text-lg mb-2 text-center"
                                        >
                                          {line}
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={index} className="text-sm">
                                        {line}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {messageContent}
                                </p>
                              )}
                            </div>

                            {/* Timestamp */}
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

              {/* Input de message */}
              <div className="border-t border-slate-200 p-2 sm:p-4 bg-white/80 backdrop-blur-sm">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-700">
                        Fichiers joints ({attachments.length})
                      </span>
                      <button
                        onClick={() => setAttachments([])}
                        className="text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {attachments.map(attachment => (
                        <div key={attachment.id} className="relative group">
                          {attachment.type === 'image' ? (
                            <div className="relative">
                              <img
                                src={attachment.preview}
                                alt={attachment.file.name}
                                className="w-full h-12 sm:h-16 object-cover rounded-lg"
                              />
                              {attachment.optimized && (
                                <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                  Opt
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center p-1.5 sm:p-2 bg-white rounded-lg border">
                              <DocumentIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="text-xs truncate">{attachment.file.name}</span>
                            </div>
                          )}
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end space-x-2 sm:space-x-3"
                >
                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => handleFileSelect(e, 'all')}
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx"
                  />
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={e => handleFileSelect(e, 'image')}
                    className="hidden"
                    multiple
                    accept="image/*"
                  />

                  {/* Attachment button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                      className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      disabled={sending || uploadingAttachment}
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {showAttachmentOptions && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-2 min-w-36 sm:min-w-48 z-50">
                        <button
                          type="button"
                          onClick={() => {
                            imageInputRef.current?.click();
                            setShowAttachmentOptions(false);
                          }}
                          className="w-full flex items-center px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <PhotoIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600" />
                          Images
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowAttachmentOptions(false);
                          }}
                          className="w-full flex items-center px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <DocumentIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-slate-600" />
                          Documents
                        </button>
                        <div className="border-t border-slate-200 my-1.5 sm:my-2"></div>
                        <div className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs text-slate-500">
                          <p>💡 Maintenez Shift pour optimiser</p>
                        </div>
                      </div>
                    )}
                  </div>

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
                        attachments.length > 0
                          ? 'Ajouter un message (optionnel)...'
                          : messages.length === 0
                            ? 'Écrivez votre premier message...'
                            : 'Tapez votre message...'
                      }
                      rows={1}
                      className="w-full border border-slate-300 rounded-xl py-2.5 px-3 sm:py-3 sm:px-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                      disabled={sending || uploadingAttachment}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-2.5 sm:p-3 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {sending || uploadingAttachment ? (
                      <svg
                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
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
                      <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </form>
                <p className="text-xs text-slate-500 mt-1.5 sm:mt-2 text-center hidden sm:block">
                  Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne •
                  Glissez-déposez vos fichiers
                </p>
                <p className="text-xs text-slate-500 mt-1.5 text-center sm:hidden">
                  Entrée pour envoyer • Shift+Entrée pour nouvelle ligne
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
