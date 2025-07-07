import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useRef, useState } from 'react';
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
  const [attachment, setAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fonction utilitaire pour normaliser les IDs MongoDB (peut être string ou ObjectId)
  const normalizeId = id => {
    if (!id) return '';
    // Si c'est un objet avec _id (cas d'un ObjectId populé), prendre _id
    if (typeof id === 'object' && id._id) return String(id._id);
    // Sinon convertir en string
    return String(id);
  };

  // Log authentication status
  useEffect(() => {
    const userId = user?._id || user?.id;

    // Inspecter la structure complète de l'objet utilisateur
  }, [user, isAuthenticated, authLoading]);

  // Connect to Socket.io
  useEffect(() => {
    // Ne connectez la socket que lorsque l'utilisateur est authentifié
    // L'ID utilisateur peut être stocké sous user._id ou user.id
    const userId = user?._id || user?.id;

    if (!user || !userId) {
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    // Join user room for receiving messages when connected
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-user-room', userId);
    });

    // Handle reconnection
    socketRef.current.on('reconnect', () => {
      socketRef.current.emit('join-user-room', userId);
    });

    // Join user room for receiving messages if already connected
    if (socketRef.current.connected) {
      socketRef.current.emit('join-user-room', userId);
    }

    // Listen for incoming messages
    socketRef.current.on('receive-message', data => {
      if (
        selectedConversation &&
        (data.senderId === selectedConversation._id ||
          data.recipientId === selectedConversation._id)
      ) {
        // Normaliser les IDs pour comparaison
        const normalizedUserId = normalizeId(userId);
        const normalizedSenderId = normalizeId(data.senderId);

        // Vérifier si le message provient du professionnel
        const isFromProfessional = normalizedSenderId === normalizedUserId;

        // Ajouter une propriété explicite pour identifier l'expéditeur
        const messageWithSender = {
          ...data,
          isProfessionalMessage: isFromProfessional,
        };

        // Ajouter le message modifié à l'état
        setMessages(prev => [...prev, messageWithSender]);

        // Mark message as read immediately if we're in the conversation
        if (data.senderId === selectedConversation._id) {
          const token = localStorage.getItem('token');
          axios
            .post(
              `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/mark-read/${selectedConversation._id}`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .catch(error => console.error('Error marking message as read:', error));
        }
      }

      // Update conversation list with new message
      fetchConversations();
    });

    // Handle errors
    socketRef.current.on('connect_error', error => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, selectedConversation]);

  // Fetch user's conversations
  useEffect(() => {
    const fetchData = async () => {
      // L'ID utilisateur peut être stocké sous user._id ou user.id
      const userId = user?._id || user?.id;

      if (!user || !userId) {
        return;
      }

      try {
        // Vérifier que le token est disponible
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

      // Mark messages as read when conversation is selected
      const markMessagesAsRead = async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/mark-read/${selectedConversation._id}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Update conversations to reflect read status
          fetchConversations();
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markMessagesAsRead();
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    // Fonction pour faire défiler vers le bas de manière robuste
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }

      // Méthode alternative pour s'assurer que le défilement fonctionne
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    // Utiliser un petit délai pour s'assurer que le DOM est mis à jour
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    // Nettoyer le timeout
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Ajouter un gestionnaire d'événements de défilement pour afficher/masquer le bouton de défilement
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // Afficher le bouton si l'utilisateur a défilé vers le haut (pas en bas)
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

      // L'ID utilisateur peut être stocké sous user._id ou user.id
      const userId = user?._id || user?.id;

      if (!user || !userId) {
        console.error('User data not available for fetching conversations');
        setLoading(false);
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Gérer le nouveau format de réponse avec la propriété conversations
      if (response.data && response.data.success && Array.isArray(response.data.conversations)) {
        setConversations(response.data.conversations);
      } else if (Array.isArray(response.data)) {
        // Fallback pour l'ancien format si jamais il est encore utilisé
        setConversations(response.data);
      } else {
        console.error('Invalid response format, expected conversations array:', response.data);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');

      // Check for specific error types
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
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/${conversationPartnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Sort messages in chronological order (oldest first)
      const sortedMessages = [...response.data].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Normaliser l'ID de l'utilisateur courant
      const normalizedUserId = normalizeId(userId);

      // Vérifier et corriger les IDs des messages
      const correctedMessages = sortedMessages.map(msg => {
        // Normaliser l'ID de l'expéditeur du message
        const normalizedSenderId = normalizeId(msg.senderId);

        // Déterminer si le message provient du professionnel en comparant les IDs normalisés
        const isFromProfessional = normalizedSenderId === normalizedUserId;

        // Ajouter une propriété explicite pour identifier l'expéditeur
        return {
          ...msg,
          isProfessionalMessage: isFromProfessional,
        };
      });

      setMessages(correctedMessages);

      // Forcer un défilement vers le bas après le chargement des messages
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

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };

  const uploadAttachment = async () => {
    if (!attachment) return null;

    try {
      setUploadingAttachment(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', attachment);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/uploads/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    } finally {
      setUploadingAttachment(false);
      setAttachment(null);
    }
  };

  const sendMessage = async e => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');
      // Définir userId pour s'assurer qu'il est disponible
      const userId = user?._id || user?.id;
      const normalizedUserId = normalizeId(userId);

      let attachments = [];
      if (attachment) {
        const attachmentUrl = await uploadAttachment();
        if (attachmentUrl) {
          attachments = [
            {
              type: attachment.type.startsWith('image/') ? 'image' : 'document',
              url: attachmentUrl,
              filename: attachment.name,
              size: attachment.size,
              mimetype: attachment.type,
            },
          ];
        }
      }

      const messageData = {
        receiverId: selectedConversation._id,
        text: messageText.trim() || (attachment ? `A envoyé un fichier: ${attachment.name}` : ''),
        messageType: attachment
          ? attachment.type.startsWith('image/')
            ? 'image'
            : 'file'
          : 'text',
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages`,
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Créer un objet message modifié avec un ID d'expéditeur forcé
      const modifiedMessage = {
        ...response.data,
        senderId: userId, // Forcer l'ID de l'expéditeur à être celui du professionnel
        isProfessionalMessage: true, // Marquer explicitement comme message du professionnel
      };

      // Ajouter le message modifié à l'état
      setMessages(prev => [...prev, modifiedMessage]);

      // Forcer un défilement vers le bas après l'envoi du message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);

      // Clear input
      setMessageText('');
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Send via socket for real-time
      // S'assurer que le message est correctement identifié comme provenant du professionnel
      socketRef.current.emit('send-message', {
        ...modifiedMessage,
        senderId: userId,
        recipientId: selectedConversation._id,
        isProfessionalMessage: true, // Ajouter cette propriété pour le socket aussi
      });

      // Update conversations list to show the latest message
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
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

    // Vérifier que le message contient les éléments essentiels d'une commande avec les bons emojis
    const requiredPatterns = [
      /📦\s*\*\s*Produit:\s*\*/u,
      /📏\s*\*\s*Taille:\s*\*/u,
      /🔢\s*\*\s*Quantité:\s*\*/u,
    ];

    return requiredPatterns.every(pattern => pattern.test(messageText));
  };

  // Extraire les informations de commande à partir du texte du message
  const extractOrderInfo = messageText => {
    try {
      // Vérifier d'abord si le message contient une commande valide
      if (!isValidOrderMessage(messageText)) {
        console.error('Format de commande invalide dans le message');
        return null;
      }

      // Ajouter un log pour voir le texte complet du message
      console.log('Texte du message à analyser:', messageText);

      // Améliorer les regex pour être plus spécifiques et éviter de capturer du texte supplémentaire
      // Extraire le nom du produit - s'arrêter avant le prochain élément ou saut de ligne
      const productMatch = messageText.match(
        /📦\s*\*\s*Produit:\s*\*\s*([^\n💰📏]+?)(?=\s*(?:💰|📏|\n)|$)/u
      );
      const product = productMatch ? productMatch[1].trim() : null;

      // Extraire le prix - rechercher spécifiquement le format prix avec devise
      const priceMatch = messageText.match(/💰\s*\*\s*Prix:\s*\*\s*([0-9.,]+)\s*([A-Z]{3})/u);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
      const currency = priceMatch ? priceMatch[2] : 'MAD';

      // Extraire la taille - s'arrêter aux emojis ou nouvelles lignes
      const sizeMatch = messageText.match(
        /📏\s*\*\s*Taille:\s*\*\s*([^\n🔢💵]+?)(?=\s*(?:🔢|💵|\n)|$)/u
      );
      const size = sizeMatch ? sizeMatch[1].trim() : null;

      // Extraire la quantité - rechercher spécifiquement les chiffres
      const quantityMatch = messageText.match(/🔢\s*\*\s*Quantité:\s*\*\s*([0-9]+)/u);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;

      // Extraire le total - rechercher spécifiquement le format total avec devise
      const totalMatch = messageText.match(/💵\s*\*\s*Total:\s*\*\s*([0-9.,]+)\s*([A-Z]{3})/u);
      const total = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0;

      // Créer l'objet d'informations de commande
      const orderInfo = {
        product,
        price,
        currency,
        size,
        quantity,
        total,
      };

      // Vérifier que toutes les informations nécessaires sont présentes
      const missingFields = [];
      if (!orderInfo.product) missingFields.push('produit');
      if (!orderInfo.size) missingFields.push('taille');
      if (!orderInfo.quantity || orderInfo.quantity <= 0) missingFields.push('quantité');

      if (missingFields.length > 0) {
        console.error('Informations manquantes dans la commande:', missingFields.join(', '));
        return null;
      }

      // Afficher les informations extraites pour le débogage
      console.log('Informations de commande extraites:', orderInfo);

      // Debug spécifique pour la recherche de produit
      console.log('Nom du produit pour la recherche de stock:', orderInfo.product);

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
      console.log('Traitement de la commande pour le message:', message._id);

      // Vérifier si le message contient une commande valide
      if (!isValidOrderMessage(message.text)) {
        throw new Error('Ce message ne contient pas une commande valide');
      }

      // Extraire les informations de la commande
      const orderInfo = extractOrderInfo(message.text);
      if (!orderInfo) {
        throw new Error("Impossible d'extraire les informations de la commande");
      }

      // Rechercher le produit dans la base de données
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      // Vérifier le stock disponible avant de passer la commande
      try {
        const productName = encodeURIComponent(orderInfo.product);
        const size = encodeURIComponent(orderInfo.size);

        console.log(`Vérification du stock pour: ${productName}, taille: ${size}`);

        const stockResponse = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/check-stock?productName=${productName}&size=${size}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log('Vérification du stock disponible:', stockResponse.data);

        // Si plusieurs produits correspondent, demander à l'utilisateur de confirmer le produit
        if (stockResponse.data.multipleProducts && stockResponse.data.products) {
          const products = stockResponse.data.products;

          // Créer une liste de choix
          const productChoices = products
            .map(
              p =>
                `${p.title}${p.name !== p.title ? ` (${p.name})` : ''} - Tailles: ${p.sizes.join(', ')}`
            )
            .join('\n');

          const confirmMessage = `Plusieurs produits correspondent à "${orderInfo.product}".\nVeuillez confirmer le produit à utiliser:\n\n${productChoices}\n\nVoulez-vous continuer avec le produit sélectionné: ${stockResponse.data.product.title}?`;

          if (!window.confirm(confirmMessage)) {
            alert(
              'Commande annulée. Veuillez préciser le nom exact du produit dans votre réponse.'
            );
            return;
          }
        }

        if (stockResponse.data && stockResponse.data.available) {
          if (stockResponse.data.stock < orderInfo.quantity) {
            alert(
              `⚠️ Stock insuffisant! Disponible: ${stockResponse.data.stock}, Demandé: ${orderInfo.quantity}`
            );
            return;
          }
        } else if (stockResponse.data && !stockResponse.data.available) {
          // Le produit existe mais la taille n'est pas disponible
          alert(
            `⚠️ La taille ${orderInfo.size} n'est pas disponible pour ce produit. Tailles disponibles: ${
              stockResponse.data.product.availableSizes?.join(', ') || 'aucune'
            }`
          );
          return;
        }
      } catch (stockError) {
        console.error('Erreur lors de la vérification du stock:', stockError);

        // Afficher un message d'erreur mais continuer le processus
        if (
          window.confirm(
            '⚠️ Impossible de vérifier le stock pour ce produit. Voulez-vous quand même accepter la commande (non recommandé)?'
          )
        ) {
          console.log('Acceptation de la commande sans vérification de stock');
        } else {
          return;
        }
      }

      // Normaliser l'ID du client
      const clientId = normalizeId(message.senderId);

      // Préparer les données pour l'API
      const requestData = {
        messageId: message._id,
        orderInfo: orderInfo,
        clientId: clientId,
      };
      console.log("Données envoyées à l'API:", requestData);

      // Appeler l'API pour accepter la commande et mettre à jour le stock
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/accept`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Réponse de l'API:", response.data);

      if (response.data.success) {
        // Envoyer un message de confirmation au client
        const confirmationMessage = `✅ Commande acceptée !\n\nVotre commande pour ${orderInfo.quantity}x ${orderInfo.product} (${orderInfo.size}) a été acceptée.\n\nTotal: ${orderInfo.total} ${orderInfo.currency}\n\nNous vous contacterons prochainement pour organiser la livraison.`;

        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages`,
          {
            receiverId: clientId,
            text: confirmationMessage,
            messageType: 'text',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Marquer le message comme traité
        const updatedMessages = messages.map(msg =>
          msg._id === message._id ? { ...msg, orderProcessed: true } : msg
        );
        setMessages(updatedMessages);

        // Rafraîchir la liste des conversations
        fetchConversations();

        // Afficher une notification de succès
        alert('✅ Commande acceptée avec succès!');
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la commande:", error);

      // Afficher plus de détails sur l'erreur
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état hors de la plage 2xx
        console.error("Détails de l'erreur:", error.response.data);
        console.error("Code d'état:", error.response.status);

        // Afficher un message d'erreur plus spécifique
        if (error.response.data && error.response.data.message) {
          alert(`❌ Erreur: ${error.response.data.message}`);
        } else {
          alert("❌ Erreur lors de l'acceptation de la commande. Veuillez réessayer.");
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Pas de réponse reçue:', error.request);
        alert('❌ Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.');
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Erreur de configuration de la requête:', error.message);
        alert('❌ Erreur: ' + error.message);
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
      console.log('Traitement du refus de commande pour le message:', message._id);

      // Vérifier si le message contient une commande valide
      if (!isValidOrderMessage(message.text)) {
        throw new Error('Ce message ne contient pas une commande valide');
      }

      // Extraire les informations de la commande
      const orderInfo = extractOrderInfo(message.text);
      if (!orderInfo) {
        throw new Error("Impossible d'extraire les informations de la commande");
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      // Normaliser l'ID du client
      const clientId = normalizeId(message.senderId);

      // Préparer les données pour l'API
      const requestData = {
        messageId: message._id,
        clientId: clientId,
      };
      console.log("Données envoyées à l'API pour refus:", requestData);

      // Appeler l'API pour refuser la commande
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/reject`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Réponse de l'API (refus):", response.data);

      if (response.data.success) {
        // Envoyer un message de refus au client
        const rejectionMessage = `❌ Commande refusée\n\nNous sommes désolés, mais votre commande pour ${orderInfo.product} ne peut pas être traitée pour le moment.\n\nRaison: ${response.data.reason || 'Stock insuffisant ou produit indisponible'}\n\nN'hésitez pas à nous contacter pour plus d'informations.`;

        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages`,
          {
            receiverId: clientId,
            text: rejectionMessage,
            messageType: 'text',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Marquer le message comme traité
        const updatedMessages = messages.map(msg =>
          msg._id === message._id ? { ...msg, orderProcessed: true } : msg
        );
        setMessages(updatedMessages);

        // Rafraîchir la liste des conversations
        fetchConversations();

        // Afficher une notification de succès
        alert('✓ Commande refusée avec succès.');
      }
    } catch (error) {
      console.error('Erreur lors du refus de la commande:', error);

      // Afficher plus de détails sur l'erreur
      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data);
        console.error("Code d'état:", error.response.status);

        if (error.response.data && error.response.data.message) {
          alert(`❌ Erreur: ${error.response.data.message}`);
        } else {
          alert('❌ Erreur lors du refus de la commande. Veuillez réessayer.');
        }
      } else if (error.request) {
        console.error('Pas de réponse reçue:', error.request);
        alert('❌ Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.');
      } else {
        console.error('Erreur de configuration de la requête:', error.message);
        alert('❌ Erreur: ' + error.message);
      }
    } finally {
      setProcessingOrder(false);
    }
  };

  // Si l'authentification est en cours, afficher un indicateur de chargement
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher un message d'erreur
  const userId = user?._id || user?.id;
  if (!isAuthenticated || !user || !userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto"
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
          <h2 className="mt-4 text-xl font-bold text-gray-900">Authentification requise</h2>
          <p className="mt-2 text-gray-600">
            Vous devez être connecté pour accéder à vos messages.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages Professionnels</h1>
              <p className="text-slate-600">Gérez vos conversations avec vos clients</p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(85vh-8rem)]">
            {/* Conversations List */}
            <div className="border-r border-slate-200 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white/50">
              <div className="p-6 border-b border-slate-200 bg-white/80">
                <h2 className="font-semibold text-slate-900 text-lg">Conversations</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {conversations.length} client{conversations.length !== 1 ? 's' : ''} en contact
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {loading && conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Chargement des conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <UserCircleIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Aucune conversation
                    </h3>
                    <p className="text-slate-600">
                      Les conversations avec vos clients apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  conversations.map(conversation => {
                    // Adapter le nouveau format de conversation
                    if (conversation.otherPerson && conversation.lastMessage) {
                      // Nouveau format avec otherPerson
                      const partner = conversation.otherPerson;

                      return (
                        <button
                          key={conversation.conversationId}
                          onClick={() => setSelectedConversation(partner)}
                          className={`w-full p-6 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group ${
                            selectedConversation?._id === partner._id
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white shadow-lg group-hover:ring-blue-200 transition-all duration-200">
                                {partner.profileImage ? (
                                  <img
                                    src={partner.profileImage}
                                    alt={partner.firstName + ' ' + partner.lastName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                  </div>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                </div>
                              )}
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3
                                  className={`font-semibold truncate ${
                                    conversation.unreadCount > 0
                                      ? 'text-slate-900'
                                      : 'text-slate-700'
                                  } group-hover:text-blue-700 transition-colors duration-200`}
                                >
                                  {partner.firstName && partner.lastName
                                    ? `${partner.firstName} ${partner.lastName}`
                                    : partner.fullName || partner.name || 'Client'}
                                </h3>
                                <span className="text-xs text-slate-500 font-medium ml-2 flex-shrink-0">
                                  {formatTimestamp(conversation.lastMessage.createdAt)}
                                </span>
                              </div>
                              <p
                                className={`text-sm truncate ${
                                  conversation.unreadCount > 0
                                    ? 'font-medium text-slate-800'
                                    : 'text-slate-600'
                                } group-hover:text-slate-700 transition-colors duration-200`}
                              >
                                {conversation.lastMessage.content &&
                                  conversation.lastMessage.content.substring(0, 50) +
                                    (conversation.lastMessage.content.length > 50 ? '...' : '')}
                              </p>
                            </div>
                            {/* Arrow indicator */}
                            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    }

                    // Ancien format avec sender/receiver (fallback)
                    if (
                      !conversation.lastMessage ||
                      !conversation.sender ||
                      !conversation.receiver
                    ) {
                      console.error('Conversation with invalid format:', conversation);
                      return null;
                    }

                    const partner =
                      conversation.lastMessage.senderId === userId
                        ? conversation.receiver[0]
                        : conversation.sender[0];

                    return (
                      <button
                        key={conversation._id}
                        onClick={() => setSelectedConversation(partner)}
                        className={`w-full p-6 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group ${
                          selectedConversation?._id === partner._id
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white shadow-lg group-hover:ring-blue-200 transition-all duration-200">
                              {partner.profileImage ? (
                                <img
                                  src={partner.profileImage}
                                  alt={partner.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                  <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3
                                className={`font-semibold truncate ${
                                  conversation.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'
                                } group-hover:text-blue-700 transition-colors duration-200`}
                              >
                                {partner.fullName ||
                                  partner.name ||
                                  (partner.firstName && partner.lastName
                                    ? `${partner.firstName} ${partner.lastName}`
                                    : 'Client')}
                              </h3>
                              <span className="text-xs text-slate-500 font-medium ml-2 flex-shrink-0">
                                {formatTimestamp(conversation.lastMessage.timestamp)}
                              </span>
                            </div>
                            <p
                              className={`text-sm truncate ${
                                conversation.unreadCount > 0
                                  ? 'font-medium text-slate-800'
                                  : 'text-slate-600'
                              } group-hover:text-slate-700 transition-colors duration-200`}
                            >
                              {conversation.lastMessage.senderId === userId ? 'Vous: ' : ''}
                              {conversation.lastMessage.text &&
                                conversation.lastMessage.text.substring(0, 50) +
                                  (conversation.lastMessage.text.length > 50 ? '...' : '')}
                            </p>
                          </div>
                          {/* Arrow indicator */}
                          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="col-span-2 flex flex-col h-full bg-white">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </button>
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white shadow-lg">
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
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                              <UserCircleIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {selectedConversation.fullName ||
                            selectedConversation.name ||
                            (selectedConversation.firstName && selectedConversation.lastName
                              ? `${selectedConversation.firstName} ${selectedConversation.lastName}`
                              : 'Client')}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {selectedConversation.email ||
                            (selectedConversation.role === 'client' ? 'Client' : 'Professionnel')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div
                    className="flex-1 p-4 overflow-y-auto bg-gray-50 relative scroll-smooth"
                    ref={messagesContainerRef}
                    style={{ scrollBehavior: 'smooth', maxHeight: 'calc(80vh - 14rem)' }}
                  >
                    {/* Bouton de défilement vers le bas */}
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
                        className="absolute bottom-4 right-4 bg-primary-600 text-white rounded-full p-2 shadow-md hover:bg-primary-700 focus:outline-none transition-opacity duration-300"
                        title="Défiler vers le bas"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}

                    {loading ? (
                      <div className="text-center text-gray-500 py-4">
                        Chargement des messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">
                        Aucun message. Commencez la conversation!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map(message => {
                          // Normaliser les IDs pour comparaison
                          const userId = user?._id || user?.id;
                          const normalizedUserId = normalizeId(userId);
                          const normalizedSenderId = normalizeId(message.senderId);

                          // Déterminer si le message provient du professionnel en comparant les IDs normalisés
                          const isFromProfessional = normalizedSenderId === normalizedUserId;

                          return (
                            <div
                              key={message._id}
                              className={`flex ${
                                isFromProfessional ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                                  isFromProfessional
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-800'
                                }`}
                              >
                                {/* Indicateur de l'expéditeur pour le débogage */}
                                <div className="text-xs mb-1 opacity-50">
                                  {isFromProfessional ? '👨‍⚕️ Vous' : '👤 Client'}{' '}
                                  (normalizedSenderId: {normalizedSenderId.substring(0, 6)}...,
                                  normalizedUserId: {normalizedUserId.substring(0, 6)}...)
                                </div>

                                {message.messageType === 'image' &&
                                  message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mb-2">
                                      <img
                                        src={message.attachments[0].url}
                                        alt={message.attachments[0].filename || 'Image attachée'}
                                        className="rounded-lg max-w-full h-auto max-h-60 object-contain"
                                      />
                                    </div>
                                  )}

                                {message.messageType === 'file' &&
                                  message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mb-2 flex items-center">
                                      <a
                                        href={message.attachments[0].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center p-2 rounded ${
                                          isFromProfessional ? 'bg-blue-600' : 'bg-gray-100'
                                        }`}
                                      >
                                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                                        <span className="text-sm truncate max-w-[150px]">
                                          {message.attachments[0].filename || 'Document attaché'}
                                        </span>
                                      </a>
                                    </div>
                                  )}

                                {message.text &&
                                  message.text !==
                                    `A envoyé un fichier: ${message.attachments?.[0]?.filename}` && (
                                    <p>{message.text}</p>
                                  )}

                                {/* Boutons Accepter/Refuser pour les commandes */}
                                {message.text &&
                                  message.text.includes('NOUVELLE COMMANDE') &&
                                  !isFromProfessional &&
                                  !message.orderProcessed && (
                                    <div className="mt-3 flex space-x-2">
                                      <button
                                        onClick={() => handleAcceptOrder(message)}
                                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                      >
                                        Accepter
                                      </button>
                                      <button
                                        onClick={() => handleRejectOrder(message)}
                                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                      >
                                        Refuser
                                      </button>
                                    </div>
                                  )}

                                <p
                                  className={`text-xs mt-1 ${
                                    isFromProfessional ? 'text-blue-100' : 'text-gray-500'
                                  }`}
                                >
                                  {formatTimestamp(message.timestamp)}
                                  {message.isRead && isFromProfessional && (
                                    <span className="ml-1">✓</span>
                                  )}
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
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={sendMessage} className="flex space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        disabled={sendingMessage || uploadingAttachment}
                      >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                      </button>
                      <div className="flex-1 relative">
                        {attachment && (
                          <div className="absolute -top-10 left-0 right-0 bg-blue-50 p-2 rounded-md flex items-center justify-between">
                            <span className="text-sm truncate">{attachment.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachment(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              &times;
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          value={messageText}
                          onChange={e => setMessageText(e.target.value)}
                          placeholder={
                            attachment
                              ? 'Ajouter un message (optionnel)...'
                              : 'Tapez votre message...'
                          }
                          className="w-full rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
                          disabled={sendingMessage || uploadingAttachment}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={
                          (!messageText.trim() && !attachment) ||
                          sendingMessage ||
                          uploadingAttachment
                        }
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sélectionnez une conversation pour afficher les messages.
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
