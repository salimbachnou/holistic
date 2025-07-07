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
      // console.log('Texte du message à analyser:', messageText);

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
      // console.log('Informations de commande extraites:', orderInfo);

      // Debug spécifique pour la recherche de produit
      // console.log('Nom du produit pour la recherche de stock:', orderInfo.product);

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
      // console.log('Traitement de la commande pour le message:', message._id);

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

        // console.log(`Vérification du stock pour: ${productName}, taille: ${size}`);

        const stockResponse = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/check-stock?productName=${productName}&size=${size}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // console.log('Vérification du stock disponible:', stockResponse.data);

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
          // console.log('Acceptation de la commande sans vérification de stock');
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
      // console.log("Données envoyées à l'API:", requestData);

      // Appeler l'API pour accepter la commande et mettre à jour le stock
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/accept`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // console.log("Réponse de l'API:", response.data);

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
      // console.log('Traitement du refus de commande pour le message:', message._id);

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
      // console.log("Données envoyées à l'API pour refus:", requestData);

      // Appeler l'API pour refuser la commande
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/reject`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // console.log("Réponse de l'API (refus):", response.data);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
          </div>
          <h2 className="mt-6 text-xl font-bold text-gray-900">Connexion en cours</h2>
          <p className="mt-2 text-gray-600">Chargement de votre profil professionnel...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher un message d'erreur
  const userId = user?._id || user?.id;
  if (!isAuthenticated || !user || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-2xl border border-gray-200">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Restreint</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
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
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-1 sm:py-2 h-full flex flex-col">
        {/* Header Section avec design professionnel - ultra compact */}
        <div className="mb-1 sm:mb-2 flex-shrink-0">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                  <svg
                    className="w-4 h-4 sm:w-6 sm:h-6 text-white"
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
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 mb-0">
                    Centre de Messages
                  </h1>
                  <p className="text-xs text-gray-600 hidden lg:block">
                    Interface professionnelle de communication client
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="text-center">
                  <div className="text-xs sm:text-lg font-bold text-blue-600">
                    {conversations.length}
                  </div>
                  <div className="text-xs text-gray-500 font-medium hidden lg:block">Conv.</div>
                </div>
                <div className="flex items-center space-x-1 bg-green-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium text-xs">En ligne</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Conversations List - Hidden on mobile when conversation is selected */}
            <div
              className={`lg:col-span-4 border-r border-gray-200 overflow-y-auto bg-gradient-to-b from-gray-50/80 to-white ${
                selectedConversation ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-2 sm:p-3">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base">Conversations</h2>
                  <div className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                    {conversations.length}
                  </div>
                </div>
                <p className="text-xs text-gray-600 hidden lg:block">
                  {conversations.length} client{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-1 sm:p-2 space-y-1 overflow-y-auto">
                {loading && conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                      <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
                    </div>
                    <p className="text-gray-500 font-medium">Chargement des conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <UserCircleIcon className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Aucune conversation</h3>
                    <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                      Les conversations avec vos clients apparaîtront ici. Restez connecté pour
                      recevoir de nouveaux messages.
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
                          className={`w-full p-3 m-1 text-left rounded-xl transition-all duration-300 group hover:shadow-md transform hover:-translate-y-0.5 ${
                            selectedConversation?._id === partner._id
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md border-2 border-blue-200'
                              : 'bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border border-gray-100 hover:border-blue-200'
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
                                    conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                  } group-hover:text-blue-700 transition-colors duration-300`}
                                >
                                  {partner.firstName && partner.lastName
                                    ? `${partner.firstName} ${partner.lastName}`
                                    : partner.fullName || partner.name || 'Client'}
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">
                                  {formatTimestamp(conversation.lastMessage.createdAt)}
                                </span>
                              </div>
                              <p
                                className={`text-xs truncate leading-relaxed ${
                                  conversation.unreadCount > 0
                                    ? 'font-medium text-gray-800'
                                    : 'text-gray-600'
                                } group-hover:text-gray-700 transition-colors duration-300`}
                              >
                                {conversation.lastMessage.content &&
                                  conversation.lastMessage.content.substring(
                                    0,
                                    window.innerWidth < 640 ? 25 : 40
                                  ) +
                                    (conversation.lastMessage.content.length >
                                    (window.innerWidth < 640 ? 25 : 40)
                                      ? '...'
                                      : '')}
                              </p>
                            </div>
                            {/* Indicateur de flèche moderne */}
                            <div className="flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
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
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              </div>
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
                      // console.error('Conversation with invalid format:', conversation);
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
                        className={`w-full p-4 m-2 text-left rounded-2xl transition-all duration-300 group hover:shadow-lg transform hover:-translate-y-1 ${
                          selectedConversation?._id === partner._id
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg border-2 border-blue-200 scale-[1.02]'
                            : 'bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border border-gray-100 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-3 ring-white shadow-lg group-hover:ring-blue-200 transition-all duration-300 transform group-hover:scale-105">
                              {partner.profileImage ? (
                                <img
                                  src={partner.profileImage}
                                  alt={partner.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center">
                                  <UserCircleIcon className="h-8 w-8 text-blue-600" />
                                </div>
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-3 border-white rounded-full shadow-sm"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3
                                className={`font-bold text-lg truncate ${
                                  conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                } group-hover:text-blue-700 transition-colors duration-300`}
                              >
                                {partner.fullName ||
                                  partner.name ||
                                  (partner.firstName && partner.lastName
                                    ? `${partner.firstName} ${partner.lastName}`
                                    : 'Client')}
                              </h3>
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                                  {formatTimestamp(conversation.lastMessage.timestamp)}
                                </span>
                                {selectedConversation?._id === partner._id && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            <p
                              className={`text-sm truncate leading-relaxed ${
                                conversation.unreadCount > 0
                                  ? 'font-semibold text-gray-800'
                                  : 'text-gray-600'
                              } group-hover:text-gray-700 transition-colors duration-300`}
                            >
                              {conversation.lastMessage.senderId === userId ? 'Vous: ' : ''}
                              {conversation.lastMessage.text &&
                                conversation.lastMessage.text.substring(0, 60) +
                                  (conversation.lastMessage.text.length > 60 ? '...' : '')}
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

            {/* Messages Area - Show only when conversation is selected on mobile */}
            <div
              className={`lg:col-span-8 flex flex-col h-full bg-gradient-to-br from-white to-gray-50 ${
                selectedConversation ? 'block' : 'hidden lg:flex'
              }`}
            >
              {selectedConversation ? (
                <>
                  {/* Conversation Header avec design moderne - plus compact et responsive */}
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-2 sm:p-4 shadow-sm">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      >
                        <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <div className="relative">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden ring-2 ring-white shadow-lg">
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
                              <UserCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-lg mb-0 sm:mb-0.5">
                          {selectedConversation.fullName ||
                            selectedConversation.name ||
                            (selectedConversation.firstName && selectedConversation.lastName
                              ? `${selectedConversation.firstName} ${selectedConversation.lastName}`
                              : 'Client')}
                        </h3>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                            {selectedConversation.email ||
                              (selectedConversation.role === 'client' ? 'Client' : 'Professionnel')}
                          </p>
                          <div className="flex items-center space-x-1 bg-green-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 text-xs font-semibold">Actif</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages List avec design moderne - plus compact et responsive */}
                  <div
                    className="flex-1 p-2 sm:p-4 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white relative scroll-smooth"
                    ref={messagesContainerRef}
                    style={{ scrollBehavior: 'smooth', maxHeight: 'calc(100vh - 16rem)' }}
                  >
                    {/* Bouton de défilement moderne - responsive */}
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
                        className="fixed bottom-24 sm:bottom-32 right-4 sm:right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-2 sm:p-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 z-30 border-2 sm:border-4 border-white"
                        title="Défiler vers le bas"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-6 sm:w-6"
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
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                          <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
                        </div>
                        <p className="text-gray-600 font-medium mt-6 text-lg">
                          Chargement des messages...
                        </p>
                        <p className="text-gray-500 text-sm mt-2">Veuillez patienter</p>
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
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                          Commencez la conversation
                        </h3>
                        <p className="text-gray-600 text-center max-w-sm leading-relaxed text-sm sm:text-base">
                          Envoyez votre premier message pour démarrer une conversation
                          professionnelle avec ce client.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-6 pb-4 sm:pb-6">
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
                              } group`}
                            >
                              <div
                                className={`max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-6 sm:py-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                                  isFromProfessional
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-auto'
                                    : 'bg-white border-2 border-gray-100 text-gray-800 mr-auto hover:border-blue-200'
                                }`}
                              >
                                {/* Contenu du message amélioré */}
                                {message.messageType === 'image' &&
                                  message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mb-4">
                                      <img
                                        src={message.attachments[0].url}
                                        alt={message.attachments[0].filename || 'Image attachée'}
                                        className="rounded-2xl max-w-full h-auto max-h-80 object-contain shadow-lg"
                                      />
                                    </div>
                                  )}

                                {message.messageType === 'file' &&
                                  message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mb-4">
                                      <a
                                        href={message.attachments[0].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center p-4 rounded-2xl transition-all duration-200 hover:shadow-md ${
                                          isFromProfessional
                                            ? 'bg-blue-700 hover:bg-blue-800'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                      >
                                        <div
                                          className={`p-2 rounded-xl mr-3 ${
                                            isFromProfessional ? 'bg-blue-800' : 'bg-blue-100'
                                          }`}
                                        >
                                          <ArrowUpTrayIcon
                                            className={`h-5 w-5 ${
                                              isFromProfessional ? 'text-white' : 'text-blue-600'
                                            }`}
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <p
                                            className={`font-semibold text-sm ${
                                              isFromProfessional ? 'text-white' : 'text-gray-800'
                                            }`}
                                          >
                                            {message.attachments[0].filename || 'Document attaché'}
                                          </p>
                                          <p
                                            className={`text-xs ${
                                              isFromProfessional ? 'text-blue-200' : 'text-gray-500'
                                            }`}
                                          >
                                            Cliquez pour ouvrir
                                          </p>
                                        </div>
                                      </a>
                                    </div>
                                  )}

                                {message.text &&
                                  message.text !==
                                    `A envoyé un fichier: ${message.attachments?.[0]?.filename}` && (
                                    <div className="leading-relaxed">
                                      <p className="text-base">{message.text}</p>
                                    </div>
                                  )}

                                {/* Boutons modernes pour les commandes */}
                                {message.text &&
                                  message.text.includes('NOUVELLE COMMANDE') &&
                                  !isFromProfessional &&
                                  !message.orderProcessed && (
                                    <div className="mt-4 flex space-x-3">
                                      <button
                                        onClick={() => handleAcceptOrder(message)}
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-2xl hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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

                                {/* Footer du message avec timestamp amélioré */}
                                <div
                                  className={`flex items-center justify-between mt-4 pt-3 border-t ${
                                    isFromProfessional ? 'border-blue-400/30' : 'border-gray-200'
                                  }`}
                                >
                                  <p
                                    className={`text-xs font-medium ${
                                      isFromProfessional ? 'text-blue-100' : 'text-gray-500'
                                    }`}
                                  >
                                    {formatTimestamp(message.timestamp)}
                                  </p>
                                  {message.isRead && isFromProfessional && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-2.5 h-2.5 text-white"
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

                  {/* Barre de saisie moderne - plus compacte et responsive */}
                  <div className="bg-white border-t border-gray-200 p-2 sm:p-4 sticky bottom-0">
                    <form onSubmit={sendMessage} className="flex items-end space-x-2 sm:space-x-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200"
                        disabled={sendingMessage || uploadingAttachment}
                        title="Joindre un fichier"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>

                      <div className="flex-1 relative">
                        {attachment && (
                          <div className="absolute -top-14 left-0 right-0 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between shadow-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ArrowUpTrayIcon className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {attachment.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachment(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="w-5 h-5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors duration-200"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <div className="relative">
                          <input
                            type="text"
                            value={messageText}
                            onChange={e => setMessageText(e.target.value)}
                            placeholder={
                              attachment
                                ? 'Ajouter un message (optionnel)...'
                                : 'Tapez votre message...'
                            }
                            className="w-full rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-4 py-3 text-sm transition-all duration-200 placeholder-gray-400"
                            disabled={sendingMessage || uploadingAttachment}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          (!messageText.trim() && !attachment) ||
                          sendingMessage ||
                          uploadingAttachment
                        }
                        className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        title="Envoyer le message"
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
                <div className="hidden lg:flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl">
                      <svg
                        className="w-10 h-10 sm:w-16 sm:h-16 text-blue-600"
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
                    <h3 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Centre de Communication
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-lg leading-relaxed mb-4 sm:mb-6">
                      Sélectionnez une conversation dans la liste de gauche pour commencer à
                      communiquer avec vos clients de manière professionnelle.
                    </p>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Interface en temps réel</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
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
