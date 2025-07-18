import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  PhotoIcon,
  DocumentIcon,
  XMarkIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { useAuth } from '../../contexts/AuthContext';

const ProfessionalMessagesPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Debug log pour la modal
  useEffect(() => {
    if (previewImage) {
      console.log('Preview image set:', previewImage);
    }
  }, [previewImage]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Fonction utilitaire pour normaliser les IDs MongoDB
  const normalizeId = id => {
    if (!id) return '';
    if (typeof id === 'object' && id._id) return String(id._id);
    return String(id);
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

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/uploads/message`,
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

  // Connect to Socket.io
  useEffect(() => {
    const userId = user?._id || user?.id;

    if (!user || !userId) {
      return;
    }

    const SOCKET_URL =
      process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-user-room', userId);
    });

    socketRef.current.on('reconnect', () => {
      socketRef.current.emit('join-user-room', userId);
    });

    if (socketRef.current.connected) {
      socketRef.current.emit('join-user-room', userId);
    }

    socketRef.current.on('receive-message', data => {
      if (
        selectedConversation &&
        (data.senderId === selectedConversation._id ||
          data.recipientId === selectedConversation._id)
      ) {
        const normalizedUserId = normalizeId(userId);
        const normalizedSenderId = normalizeId(data.senderId);
        const isFromProfessional = normalizedSenderId === normalizedUserId;

        const messageWithSender = {
          ...data,
          isProfessionalMessage: isFromProfessional,
        };

        setMessages(prev => [...prev, messageWithSender]);

        if (data.senderId === selectedConversation._id) {
          const token = localStorage.getItem('token');
          axios
            .post(
              `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/messages/mark-read/${selectedConversation._id}`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .catch(error => console.error('Error marking message as read:', error));
        }
      }

      fetchConversations();
    });

    socketRef.current.on('connect_error', error => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, selectedConversation]);

  // Fetch conversations
  useEffect(() => {
    const fetchData = async () => {
      const userId = user?._id || user?.id;

      if (!user || !userId) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        await fetchConversations();
      } catch (error) {
        console.error('Error in conversation fetch effect:', error);
      }
    };

    fetchData();
  }, [user]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);

      const markMessagesAsRead = async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/messages/mark-read/${selectedConversation._id}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          fetchConversations();
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markMessagesAsRead();
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }

      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
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

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token available for fetching conversations');
        setLoading(false);
        return;
      }

      const userId = user?._id || user?.id;

      if (!user || !userId) {
        console.error('User data not available for fetching conversations');
        setLoading(false);
        return;
      }

      const API_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';
      const response = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success && Array.isArray(response.data.conversations)) {
        setConversations(response.data.conversations);
      } else if (Array.isArray(response.data)) {
        setConversations(response.data);
      } else {
        console.error('Invalid response format, expected conversations array:', response.data);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');

      if (error.response) {
        if (error.response.status === 401) {
          console.error('Unauthorized: Token might be invalid or expired');
        } else if (error.response.status === 500) {
          console.error('Server error when fetching conversations');
        }
      } else if (error.request) {
        console.error('No response received from server, possible network issue');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async conversationPartnerId => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = user?._id || user?.id;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/messages/${conversationPartnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const sortedMessages = [...response.data].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      const normalizedUserId = normalizeId(userId);

      const correctedMessages = sortedMessages.map(msg => {
        const normalizedSenderId = normalizeId(msg.senderId);
        const isFromProfessional = normalizedSenderId === normalizedUserId;

        return {
          ...msg,
          isProfessionalMessage: isFromProfessional,
        };
      });

      setMessages(correctedMessages);

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 200);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async e => {
    e.preventDefault();
    if ((!messageText.trim() && attachments.length === 0) || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');
      const userId = user?._id || user?.id;

      let uploadedAttachments = [];
      if (attachments.length > 0) {
        uploadedAttachments = await uploadAttachments();
        if (uploadedAttachments.length === 0) {
          toast.error('Échec du téléchargement des fichiers');
          return;
        }
      }

      const messageData = {
        receiverId: selectedConversation._id,
        text:
          messageText.trim() ||
          (attachments.length > 0 ? `${attachments.length} fichier(s) envoyé(s)` : ''),
        messageType:
          uploadedAttachments.length > 0
            ? uploadedAttachments[0].type === 'image'
              ? 'image'
              : 'file'
            : 'text',
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/messages`,
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const modifiedMessage = {
        ...response.data,
        senderId: userId,
        isProfessionalMessage: true,
      };

      setMessages(prev => [...prev, modifiedMessage]);

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);

      setMessageText('');
      setAttachments([]);
      setShowAttachmentOptions(false);

      socketRef.current.emit('send-message', {
        ...modifiedMessage,
        senderId: userId,
        recipientId: selectedConversation._id,
        isProfessionalMessage: true,
      });

      fetchConversations();
      toast.success('Message envoyé avec succès');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = timestamp => {
    return format(new Date(timestamp), 'HH:mm', { locale: fr });
  };

  // Vérifier si un message contient une commande valide
  const isValidOrderMessage = messageText => {
    if (!messageText || !messageText.includes('NOUVELLE COMMANDE')) {
      return false;
    }

    const requiredPatterns = [/📦\s*\*\s*Produit:\s*\*/u, /🔢\s*\*\s*Quantité:\s*\*/u];

    const allRequiredPatternsMatch = requiredPatterns.every(pattern => {
      const matches = pattern.test(messageText);
      return matches;
    });

    if (!allRequiredPatternsMatch) {
      const hasProduct = messageText.includes('📦') && messageText.includes('Produit');
      const hasQuantity = messageText.includes('🔢') && messageText.includes('Quantité');

      if (hasProduct && hasQuantity) {
        return true;
      }
    }

    return allRequiredPatternsMatch;
  };

  // Extraire les informations de commande
  const extractOrderInfo = messageText => {
    try {
      if (!isValidOrderMessage(messageText)) {
        console.error('Format de commande invalide dans le message');
        return null;
      }

      const productMatch = messageText.match(
        /📦\s*\*\s*Produit:\s*\*\s*([^\n💰📏]+?)(?=\s*(?:💰|📏|\n)|$)/u
      );
      const product = productMatch ? productMatch[1].trim() : null;

      const priceMatch = messageText.match(/💰\s*\*\s*Prix:\s*\*\s*([0-9.,]+)\s*([A-Z]{3})/u);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
      const currency = priceMatch ? priceMatch[2] : 'MAD';

      const sizeMatch = messageText.match(
        /📏\s*\*\s*Taille:\s*\*\s*([^\n🔢💵]+?)(?=\s*(?:🔢|💵|\n)|$)/u
      );
      const size = sizeMatch ? sizeMatch[1].trim() : null;

      const quantityMatch = messageText.match(/🔢\s*\*\s*Quantité:\s*\*\s*([0-9]+)/u);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;

      const totalMatch = messageText.match(/💵\s*\*\s*Total:\s*\*\s*([0-9.,]+)\s*([A-Z]{3})/u);
      const total = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0;

      const orderInfo = {
        product,
        price,
        currency,
        size: size || 'N/A',
        quantity,
        total,
      };

      const missingFields = [];
      if (!orderInfo.product) missingFields.push('produit');
      if (!orderInfo.quantity || orderInfo.quantity <= 0) missingFields.push('quantité');

      if (missingFields.length > 0) {
        console.error('Informations manquantes dans la commande:', missingFields.join(', '));
        return null;
      }

      return orderInfo;
    } catch (error) {
      console.error("Erreur lors de l'extraction des informations de commande:", error);
      return null;
    }
  };

  // Gérer l'acceptation d'une commande
  const handleAcceptOrder = async message => {
    if (processingOrder) return;

    try {
      setProcessingOrder(true);
      const messageText = message.text || message.content;

      if (!isValidOrderMessage(messageText)) {
        throw new Error('Ce message ne contient pas une commande valide');
      }

      const orderInfo = extractOrderInfo(messageText);
      if (!orderInfo) {
        throw new Error("Impossible d'extraire les informations de la commande");
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      try {
        const productName = encodeURIComponent(orderInfo.product);
        const size = orderInfo.size ? encodeURIComponent(orderInfo.size) : '';

        const stockResponse = await axios.get(
          `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/products/check-stock?productName=${productName}${size ? `&size=${size}` : ''}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (stockResponse.data.multipleProducts && stockResponse.data.products) {
          const products = stockResponse.data.products;

          const productChoices = products
            .map(
              p =>
                `${p.title}${p.name !== p.title ? ` (${p.name})` : ''} - Tailles: ${p.sizes.join(', ')}`
            )
            .join('\n');

          const confirmMessage = `Plusieurs produits correspondent à "${orderInfo.product}".\nVeuillez confirmer le produit à utiliser:\n\n${productChoices}\n\nVoulez-vous continuer avec le produit sélectionné: ${stockResponse.data.product.title}?`;

          if (!window.confirm(confirmMessage)) {
            toast.error(
              'Commande annulée. Veuillez préciser le nom exact du produit dans votre réponse.'
            );
            return;
          }
        }

        if (stockResponse.data && stockResponse.data.available) {
          if (stockResponse.data.stock < orderInfo.quantity) {
            toast.error(
              `⚠️ Stock insuffisant! Disponible: ${stockResponse.data.stock}, Demandé: ${orderInfo.quantity}`
            );
            return;
          }
        } else if (stockResponse.data && !stockResponse.data.available && orderInfo.size) {
          toast.error(
            `⚠️ La taille ${orderInfo.size} n'est pas disponible pour ce produit. Tailles disponibles: ${
              stockResponse.data.product.availableSizes?.join(', ') || 'aucune'
            }`
          );
          return;
        }
      } catch (stockError) {
        console.error('Erreur lors de la vérification du stock:', stockError);

        if (
          !window.confirm(
            '⚠️ Impossible de vérifier le stock pour ce produit. Voulez-vous quand même accepter la commande (non recommandé)?'
          )
        ) {
          return;
        }
      }

      const clientId = normalizeId(message.senderId);

      const requestData = {
        messageId: message._id,
        orderInfo: orderInfo,
        clientId: clientId,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/orders/accept`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const sizeInfo = orderInfo.size ? ` (${orderInfo.size})` : '';
        const confirmationMessage = `✅ Commande acceptée !\n\nVotre commande pour ${orderInfo.quantity}x ${orderInfo.product}${sizeInfo} a été acceptée.\n\nTotal: ${orderInfo.total} ${orderInfo.currency}\n\nNous vous contacterons prochainement pour organiser la livraison.`;

        await axios.post(
          `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/messages`,
          {
            receiverId: clientId,
            text: confirmationMessage,
            messageType: 'text',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const updatedMessages = messages.map(msg =>
          msg._id === message._id ? { ...msg, orderProcessed: true } : msg
        );
        setMessages(updatedMessages);

        fetchConversations();
        toast.success('✅ Commande acceptée avec succès!');
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la commande:", error);

      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data);
        console.error("Code d'état:", error.response.status);

        if (error.response.data && error.response.data.message) {
          toast.error(`❌ Erreur: ${error.response.data.message}`);
        } else {
          toast.error("❌ Erreur lors de l'acceptation de la commande. Veuillez réessayer.");
        }
      } else if (error.request) {
        console.error('Pas de réponse reçue:', error.request);
        toast.error(
          '❌ Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.'
        );
      } else {
        console.error('Erreur de configuration de la requête:', error.message);
        toast.error('❌ Erreur: ' + error.message);
      }
    } finally {
      setProcessingOrder(false);
    }
  };

  // Gérer le refus d'une commande
  const handleRejectOrder = async message => {
    if (processingOrder) return;

    try {
      setProcessingOrder(true);
      const messageText = message.text || message.content;

      if (!isValidOrderMessage(messageText)) {
        throw new Error('Ce message ne contient pas une commande valide');
      }

      const orderInfo = extractOrderInfo(messageText);
      if (!orderInfo) {
        throw new Error("Impossible d'extraire les informations de la commande");
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const clientId = normalizeId(message.senderId);

      const requestData = {
        messageId: message._id,
        clientId: clientId,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/orders/reject`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const rejectionMessage = `❌ Commande refusée\n\nNous sommes désolés, mais votre commande pour ${orderInfo.product} ne peut pas être traitée pour le moment.\n\nRaison: ${response.data.reason || 'Stock insuffisant ou produit indisponible'}\n\nN'hésitez pas à nous contacter pour plus d'informations.`;

        await axios.post(
          `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/messages`,
          {
            receiverId: clientId,
            text: rejectionMessage,
            messageType: 'text',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const updatedMessages = messages.map(msg =>
          msg._id === message._id ? { ...msg, orderProcessed: true } : msg
        );
        setMessages(updatedMessages);

        fetchConversations();
        toast.success('✓ Commande refusée avec succès.');
      }
    } catch (error) {
      console.error('Erreur lors du refus de la commande:', error);

      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data);
        console.error("Code d'état:", error.response.status);

        if (error.response.data && error.response.data.message) {
          toast.error(`❌ Erreur: ${error.response.data.message}`);
        } else {
          toast.error('❌ Erreur lors du refus de la commande. Veuillez réessayer.');
        }
      } else if (error.request) {
        console.error('Pas de réponse reçue:', error.request);
        toast.error(
          '❌ Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.'
        );
      } else {
        console.error('Erreur de configuration de la requête:', error.message);
        toast.error('❌ Erreur: ' + error.message);
      }
    } finally {
      setProcessingOrder(false);
    }
  };

  // Si l'authentification est en cours
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900">Connexion en cours</h2>
          <p className="mt-2 text-slate-600">Chargement de votre profil professionnel...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié
  const userId = user?._id || user?.id;
  if (!isAuthenticated || !user || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-2xl border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Accès Restreint</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Vous devez être connecté en tant que professionnel pour accéder à cette interface de
            messagerie.
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 9999 }}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <button
              onClick={e => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              className="absolute -top-2 -right-2 bg-white text-gray-800 hover:bg-gray-100 rounded-full p-2 shadow-lg z-10 transition-all duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-1 sm:py-2 h-full flex flex-col">
        {/* Header Section */}
        <div className="mb-1 sm:mb-2 flex-shrink-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-xl shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                    Centre de Messages Pro
                  </h1>
                  <p className="text-xs text-slate-600 hidden lg:block">
                    Interface professionnelle de communication client
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-blue-600">
                    {conversations.length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium hidden lg:block">Conv.</div>
                </div>
                <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium text-xs">En ligne</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Conversations List */}
            <div
              className={`lg:col-span-4 border-r border-slate-200 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white ${
                selectedConversation ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Conversations</h2>
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {conversations.length}
                  </div>
                </div>
                <p className="text-xs text-slate-600 hidden lg:block">
                  {conversations.length} client{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto">
                {loading && conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                      <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
                    </div>
                    <p className="text-slate-500 font-medium">Chargement des conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <UserCircleIcon className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Aucune conversation</h3>
                    <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Les conversations avec vos clients apparaîtront ici. Restez connecté pour
                      recevoir de nouveaux messages.
                    </p>
                  </div>
                ) : (
                  conversations.map(conversation => {
                    if (conversation.otherPerson && conversation.lastMessage) {
                      const partner = conversation.otherPerson;

                      return (
                        <button
                          key={conversation.conversationId}
                          onClick={() => setSelectedConversation(partner)}
                          className={`w-full p-3 text-left rounded-xl transition-all duration-300 group hover:shadow-md transform hover:-translate-y-0.5 ${
                            selectedConversation?._id === partner._id
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md border-2 border-blue-200'
                              : 'bg-white hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 border border-slate-100 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow-md group-hover:ring-blue-200 transition-all duration-300">
                                {partner.profileImage ? (
                                  <img
                                    src={partner.profileImage}
                                    alt={partner.firstName + ' ' + partner.lastName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center">
                                    <UserCircleIcon className="h-5 w-5 text-blue-600" />
                                  </div>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                </div>
                              )}
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3
                                  className={`font-semibold text-sm truncate ${
                                    conversation.unreadCount > 0
                                      ? 'text-slate-900'
                                      : 'text-slate-700'
                                  } group-hover:text-blue-700 transition-colors duration-300`}
                                >
                                  {partner.firstName && partner.lastName
                                    ? `${partner.firstName} ${partner.lastName}`
                                    : partner.fullName || partner.name || 'Client'}
                                </h3>
                                <span className="text-xs text-slate-500 font-medium">
                                  {formatTimestamp(conversation.lastMessage.createdAt)}
                                </span>
                              </div>
                              <p
                                className={`text-xs truncate leading-relaxed ${
                                  conversation.unreadCount > 0
                                    ? 'font-medium text-slate-800'
                                    : 'text-slate-600'
                                } group-hover:text-slate-700 transition-colors duration-300`}
                              >
                                {conversation.lastMessage.content &&
                                  conversation.lastMessage.content.substring(0, 40) +
                                    (conversation.lastMessage.content.length > 40 ? '...' : '')}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div
              className={`lg:col-span-8 flex flex-col h-full bg-gradient-to-br from-white to-slate-50 ${
                selectedConversation ? 'block' : 'hidden lg:flex'
              }`}
              ref={dropZoneRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {dragActive && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 flex items-center justify-center z-20">
                  <div className="text-center">
                    <ArrowUpTrayIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-blue-600 font-semibold">
                      Relâchez pour télécharger les fichiers
                    </p>
                    <p className="text-blue-500 text-sm">
                      Maintenez Shift pour optimiser les images
                    </p>
                  </div>
                </div>
              )}

              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </button>
                      <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-2 ring-white shadow-lg">
                          {selectedConversation.profileImage ? (
                            <img
                              src={selectedConversation.profileImage}
                              alt={
                                selectedConversation.fullName ||
                                selectedConversation.name ||
                                'Client'
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center">
                              <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-lg">
                          {selectedConversation.fullName ||
                            selectedConversation.name ||
                            (selectedConversation.firstName && selectedConversation.lastName
                              ? `${selectedConversation.firstName} ${selectedConversation.lastName}`
                              : 'Client')}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-slate-600 text-xs sm:text-sm hidden sm:block">
                            {selectedConversation.email ||
                              (selectedConversation.role === 'client' ? 'Client' : 'Professionnel')}
                          </p>
                          <div className="flex items-center space-x-1 bg-green-100 px-2 py-0.5 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 text-xs font-semibold">Actif</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div
                    className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white relative scroll-smooth"
                    ref={messagesContainerRef}
                    style={{ scrollBehavior: 'smooth', maxHeight: 'calc(100vh - 16rem)' }}
                  >
                    {/* Scroll button */}
                    {showScrollButton && (
                      <button
                        onClick={() => {
                          if (messagesEndRef.current) {
                            messagesEndRef.current.scrollIntoView({
                              behavior: 'smooth',
                              block: 'end',
                            });
                          }
                          if (messagesContainerRef.current) {
                            messagesContainerRef.current.scrollTop =
                              messagesContainerRef.current.scrollHeight;
                          }
                        }}
                        className="fixed bottom-32 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-3 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 z-30 border-4 border-white"
                        title="Défiler vers le bas"
                      >
                        <ChevronDownIcon className="h-5 w-5" />
                      </button>
                    )}

                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                          <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
                        </div>
                        <p className="text-slate-600 font-medium mt-6 text-lg">
                          Chargement des messages...
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-xl mb-8">
                          <svg
                            className="w-12 h-12 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                          Commencez la conversation
                        </h3>
                        <p className="text-slate-600 text-center max-w-sm leading-relaxed">
                          Envoyez votre premier message pour démarrer une conversation
                          professionnelle avec ce client.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-6 pb-6">
                        {messages.map(message => {
                          const userId = user?._id || user?.id;
                          const normalizedUserId = normalizeId(userId);
                          const normalizedSenderId = normalizeId(message.senderId);
                          const isFromProfessional = normalizedSenderId === normalizedUserId;

                          return (
                            <div
                              key={message._id}
                              className={`flex ${
                                isFromProfessional ? 'justify-end' : 'justify-start'
                              } group`}
                            >
                              <div
                                className={`max-w-xs sm:max-w-lg rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
                                  isFromProfessional
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-800 hover:border-blue-200'
                                }`}
                              >
                                {/* Image attachments */}
                                {message.messageType === 'image' &&
                                  message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mb-3 space-y-2">
                                      {message.attachments.map((attachment, index) => (
                                        <div key={index} className="relative group">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              console.log('Image clicked, URL:', attachment.url);
                                              setPreviewImage(attachment.url);
                                            }}
                                            className="block w-full rounded-xl max-w-full h-auto max-h-80 object-contain shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-none bg-transparent p-0"
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.filename || 'Image'}
                                              className="rounded-xl max-w-full h-auto max-h-80 object-contain w-full"
                                            />
                                          </button>
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                            <EyeIcon className="h-8 w-8 text-white" />
                                          </div>
                                          {attachment.optimized && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
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
                                    <div className="mb-3 space-y-2">
                                      {message.attachments.map((attachment, index) => (
                                        <a
                                          key={index}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center p-3 rounded-xl transition-all duration-200 hover:shadow-md ${
                                            isFromProfessional
                                              ? 'bg-blue-700 hover:bg-blue-800'
                                              : 'bg-slate-50 hover:bg-slate-100'
                                          }`}
                                        >
                                          <div
                                            className={`p-2 rounded-lg mr-3 ${
                                              isFromProfessional ? 'bg-blue-800' : 'bg-blue-100'
                                            }`}
                                          >
                                            <DocumentIcon
                                              className={`h-5 w-5 ${
                                                isFromProfessional ? 'text-white' : 'text-blue-600'
                                              }`}
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <p
                                              className={`font-semibold text-sm ${
                                                isFromProfessional ? 'text-white' : 'text-slate-800'
                                              }`}
                                            >
                                              {attachment.filename || 'Document'}
                                            </p>
                                            <p
                                              className={`text-xs ${
                                                isFromProfessional
                                                  ? 'text-blue-200'
                                                  : 'text-slate-500'
                                              }`}
                                            >
                                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  )}

                                {/* Message text */}
                                {(message.text || message.content) && (
                                  <div className="leading-relaxed">
                                    <p className="text-sm">{message.text || message.content}</p>
                                  </div>
                                )}

                                {/* Order buttons */}
                                {(message.text || message.content) &&
                                  (message.text?.includes('NOUVELLE COMMANDE') ||
                                    message.content?.includes('NOUVELLE COMMANDE')) &&
                                  !isFromProfessional &&
                                  !message.orderProcessed && (
                                    <div className="mt-4 flex space-x-3">
                                      <button
                                        onClick={() => handleAcceptOrder(message)}
                                        disabled={processingOrder}
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-2"
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
                                        Accepter
                                      </button>
                                      <button
                                        onClick={() => handleRejectOrder(message)}
                                        disabled={processingOrder}
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-2"
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
                                        Refuser
                                      </button>
                                    </div>
                                  )}

                                {/* Timestamp */}
                                <div
                                  className={`flex items-center justify-between mt-3 pt-2 border-t ${
                                    isFromProfessional ? 'border-blue-400/30' : 'border-slate-200'
                                  }`}
                                >
                                  <p
                                    className={`text-xs font-medium ${
                                      isFromProfessional ? 'text-blue-100' : 'text-slate-500'
                                    }`}
                                  >
                                    {formatTimestamp(message.timestamp)}
                                  </p>
                                  {message.isRead && isFromProfessional && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-2 h-2 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </div>
                                      <span className="text-xs text-green-600 font-semibold">
                                        Lu
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 p-3 sm:p-4 sticky bottom-0">
                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Fichiers joints ({attachments.length})
                          </span>
                          <button
                            onClick={() => setAttachments([])}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {attachments.map(attachment => (
                            <div key={attachment.id} className="relative group">
                              {attachment.type === 'image' ? (
                                <div className="relative">
                                  <img
                                    src={attachment.preview}
                                    alt={attachment.file.name}
                                    className="w-full h-16 object-cover rounded-lg"
                                  />
                                  {attachment.optimized && (
                                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                      Optimisé
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center p-2 bg-white rounded-lg border">
                                  <DocumentIcon className="h-4 w-4 text-blue-600 mr-2" />
                                  <span className="text-xs truncate">{attachment.file.name}</span>
                                </div>
                              )}
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <form onSubmit={sendMessage} className="flex items-end space-x-2 sm:space-x-3">
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
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          disabled={sendingMessage || uploadingAttachment}
                        >
                          <ArrowUpTrayIcon className="h-5 w-5" />
                        </button>

                        {showAttachmentOptions && (
                          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-2 min-w-48">
                            <button
                              type="button"
                              onClick={() => {
                                imageInputRef.current?.click();
                                setShowAttachmentOptions(false);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <PhotoIcon className="h-4 w-4 mr-2 text-blue-600" />
                              Images
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowAttachmentOptions(false);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <DocumentIcon className="h-4 w-4 mr-2 text-slate-600" />
                              Documents
                            </button>
                            <div className="border-t border-slate-200 my-2"></div>
                            <div className="px-3 py-2 text-xs text-slate-500">
                              <p>💡 Maintenez Shift pour optimiser les images</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message input */}
                      <div className="flex-1">
                        <textarea
                          value={messageText}
                          onChange={e => setMessageText(e.target.value)}
                          onKeyPress={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(e);
                            }
                          }}
                          placeholder={
                            attachments.length > 0
                              ? 'Ajouter un message (optionnel)...'
                              : 'Tapez votre message...'
                          }
                          className="w-full rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-4 py-3 text-sm transition-all duration-200 placeholder-slate-400 resize-none"
                          disabled={sendingMessage || uploadingAttachment}
                          rows={1}
                          style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                      </div>

                      {/* Send button */}
                      <button
                        type="submit"
                        disabled={
                          (!messageText.trim() && attachments.length === 0) ||
                          sendingMessage ||
                          uploadingAttachment
                        }
                        className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {uploadingAttachment ? (
                          <svg
                            className="animate-spin h-5 w-5 text-white"
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
                          <PaperAirplaneIcon className="h-5 w-5" />
                        )}
                      </button>
                    </form>

                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Entrée pour envoyer, Shift+Entrée pour nouvelle ligne • Glissez-déposez vos
                      fichiers
                    </p>
                  </div>
                </>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-50 to-white">
                  <div className="text-center max-w-md px-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                      <svg
                        className="w-16 h-16 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">
                      Centre de Communication Pro
                    </h3>
                    <p className="text-slate-600 text-lg leading-relaxed mb-6">
                      Sélectionnez une conversation dans la liste de gauche pour commencer à
                      communiquer avec vos clients de manière professionnelle.
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Interface temps réel</span>
                      </div>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Messages sécurisés</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalMessagesPage;
