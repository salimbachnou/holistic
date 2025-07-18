import {
  BellIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

import { userAPI } from '../../utils/api';

const NOTIFICATIONS_TYPES = {
  MESSAGE: 'message',
  ORDER_PLACED: 'order_placed',
  ORDER_PROCESSING: 'order_processing',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  NEW_PROFESSIONAL: 'new_professional',
  NEW_CLIENT: 'new_client',
  NEW_CONTACT: 'new_contact',
  NEW_ORDER: 'new_order',
  NEW_EVENT: 'new_event',
  SESSION_CANCELLED: 'session_cancelled',
  SYSTEM: 'system',
};

const ClientNotificationsPanel = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const panelRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = event => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fonction pour récupérer les notifications, mémorisée avec useCallback
  const fetchNotifications = useCallback(async () => {
    const userId = user?._id || user?.id;
    if (!userId) {
      return;
    }

    try {
      setLoading(true);

      let notificationsData = [];

      try {
        const response = await userAPI.getNotifications();

        if (response.data.success) {
          // Normaliser les données MongoDB
          notificationsData = normalizeMongoData(response.data.notifications) || [];
          // S'assurer que les dates sont valides
          notificationsData = ensureValidDates(notificationsData);
        }
      } catch (error) {
        console.error('ClientNotificationsPanel: Error fetching notifications from API:', error);

        // Pour le développement, utiliser des données fictives
        notificationsData = [
          {
            _id: '1',
            type: NOTIFICATIONS_TYPES.ORDER_CANCELLED,
            title: 'Commande annulée',
            message:
              'Votre commande #ORD-12345 a été annulée. Nous sommes désolés pour ce désagrément.',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
            read: false,
            link: '/orders',
            data: { orderId: 'ORD-12345' },
          },
          {
            _id: '2',
            type: NOTIFICATIONS_TYPES.ORDER_SHIPPED,
            title: 'Commande expédiée',
            message: 'Votre commande #ORD-54321 a été expédiée et sera livrée prochainement.',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            read: false,
            link: '/orders',
            data: { orderId: 'ORD-54321' },
          },
          {
            _id: '3',
            type: NOTIFICATIONS_TYPES.APPOINTMENT_SCHEDULED,
            title: 'Rendez-vous confirmé',
            message: 'Votre rendez-vous avec Dr. Martin a été confirmé pour le 15 juin à 14h00.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: true,
            link: '/bookings',
            data: { bookingId: '123456' },
          },
        ];
      }

      // // Vérifier chaque notification pour s'assurer qu'elle a les propriétés requises
      // notificationsData.forEach((notification, index) => {
      //   console.log(`ClientNotificationsPanel: Notification ${index}:`, {
      //     id: notification._id,
      //     type: notification.type,
      //     title: notification.title,
      //     message: notification.message,
      //     read: notification.read,
      //     createdAt: notification.createdAt,
      //   });
      // });

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    } catch (error) {
      console.error('ClientNotificationsPanel: Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl]);

  // Récupérer les notifications au chargement du composant
  useEffect(() => {
    const userId = user?._id || user?.id;
  }, [user, fetchNotifications]);

  // Récupérer les notifications lorsque le panneau est ouvert
  useEffect(() => {
    if (isOpen) {
      console.log('ClientNotificationsPanel: Panel opened, fetching notifications');
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Connect to Socket.io and set up notification listening
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    socketRef.current = io(apiUrl);

    // Join user's notification room
    socketRef.current.emit('join-user-room', userId);

    // Listen for incoming notifications
    socketRef.current.on('receive-notification', notification => {
      console.log('ClientNotificationsPanel: Received new notification:', notification);
      // Add new notification to state
      setNotifications(prev => [normalizeMongoData(notification), ...prev]);

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(err => console.error('Failed to play notification sound:', err));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, apiUrl]);

  // Fonction pour vérifier si un objet est un ObjectId MongoDB
  const isMongoObjectId = obj => {
    return obj && typeof obj === 'object' && obj.$oid && typeof obj.$oid === 'string';
  };

  // Fonction pour vérifier si un objet est une date MongoDB
  const isMongoDate = obj => {
    return (
      obj &&
      typeof obj === 'object' &&
      obj.$date &&
      (typeof obj.$date === 'string' || typeof obj.$date === 'number')
    );
  };

  // Fonction pour normaliser les données MongoDB en JSON standard
  const normalizeMongoData = data => {
    if (!data) return data;

    // Si c'est un tableau, normaliser chaque élément
    if (Array.isArray(data)) {
      return data.map(item => normalizeMongoData(item));
    }

    // Si c'est un objet
    if (typeof data === 'object' && data !== null) {
      // Cas spécial pour les ID MongoDB
      if (isMongoObjectId(data)) {
        return data.$oid;
      }

      // Cas spécial pour les dates MongoDB
      if (isMongoDate(data)) {
        return new Date(data.$date).toISOString();
      }

      // Pour les autres objets, normaliser récursivement
      const normalized = {};
      for (const [key, value] of Object.entries(data)) {
        // Vérifier si la valeur est un ObjectId ou une date MongoDB
        if (isMongoObjectId(value)) {
          normalized[key] = value.$oid;
        } else if (isMongoDate(value)) {
          normalized[key] = new Date(value.$date).toISOString();
        } else if (key === 'data' && typeof value === 'object') {
          // Traitement spécial pour le champ 'data' qui peut contenir des ObjectId imbriqués
          normalized[key] = normalizeMongoData(value);
        } else {
          normalized[key] = normalizeMongoData(value);
        }
      }
      return normalized;
    }

    return data;
  };

  // Fonction pour s'assurer que les dates sont valides
  const ensureValidDates = notifications => {
    if (!notifications || !Array.isArray(notifications)) return [];

    return notifications.map(notification => {
      // Copier la notification pour ne pas modifier l'original
      const notif = { ...notification };

      // Vérifier si createdAt est une date valide
      if (notif.createdAt) {
        try {
          // Si c'est déjà une date ISO, la garder telle quelle
          if (
            typeof notif.createdAt === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(notif.createdAt)
          ) {
            // C'est déjà une date ISO valide
          }
          // Si c'est un objet Date MongoDB
          else if (typeof notif.createdAt === 'object' && notif.createdAt.$date) {
            notif.createdAt = new Date(notif.createdAt.$date).toISOString();
          }
          // Sinon, essayer de convertir en date
          else {
            const date = new Date(notif.createdAt);
            if (!isNaN(date.getTime())) {
              notif.createdAt = date.toISOString();
            } else {
              // Si la date n'est pas valide, utiliser la date actuelle
              notif.createdAt = new Date().toISOString();
              console.warn(
                'ClientNotificationsPanel: Invalid date detected, using current date instead'
              );
            }
          }
        } catch (error) {
          console.error('ClientNotificationsPanel: Error parsing date:', error);
          notif.createdAt = new Date().toISOString();
        }
      } else {
        // Si pas de date, utiliser la date actuelle
        notif.createdAt = new Date().toISOString();
      }

      return notif;
    });
  };

  const markAllAsRead = async () => {
    try {
      try {
        await userAPI.markAllNotificationsRead();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }

      // Update UI immediately
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAsRead = async notificationId => {
    try {
      try {
        await userAPI.markNotificationRead(notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }

      // Update UI immediately
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = type => {
    switch (type) {
      case NOTIFICATIONS_TYPES.MESSAGE:
        return <ChatBubbleLeftIcon className="h-6 w-6 text-blue-500" />;
      case NOTIFICATIONS_TYPES.APPOINTMENT_SCHEDULED:
        return <ClockIcon className="h-6 w-6 text-green-500" />;
      case NOTIFICATIONS_TYPES.APPOINTMENT_CANCELLED:
        return <ClockIcon className="h-6 w-6 text-red-500" />;
      case NOTIFICATIONS_TYPES.ORDER_PLACED:
      case NOTIFICATIONS_TYPES.ORDER_PROCESSING:
        return <ShoppingBagIcon className="h-6 w-6 text-blue-500" />;
      case NOTIFICATIONS_TYPES.ORDER_SHIPPED:
        return <ShoppingBagIcon className="h-6 w-6 text-orange-500" />;
      case NOTIFICATIONS_TYPES.ORDER_DELIVERED:
      case NOTIFICATIONS_TYPES.PAYMENT_RECEIVED:
        return <ShoppingBagIcon className="h-6 w-6 text-green-500" />;
      case NOTIFICATIONS_TYPES.ORDER_CANCELLED:
      case NOTIFICATIONS_TYPES.SESSION_CANCELLED:
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case NOTIFICATIONS_TYPES.NEW_EVENT:
        return <ClockIcon className="h-6 w-6 text-purple-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 60) {
      return `${diffMin}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}j`;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          console.log('ClientNotificationsPanel: Opening panel, notifications:', notifications);
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-purple-50">
              <h3 className="font-medium text-primary-700">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('ClientNotificationsPanel: Manually refreshing notifications');
                    fetchNotifications();
                  }}
                  className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
                  title="Rafraîchir"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors duration-200"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p>Chargement...</p>
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {console.log('ClientNotificationsPanel: Rendering notifications:', notifications)}
                  {notifications.map((notification, index) => {
                    console.log(
                      `ClientNotificationsPanel: Rendering notification ${index}:`,
                      notification
                    );
                    return (
                      <Link
                        key={notification._id || index}
                        to={notification.link || '/notifications'}
                        className={`block p-4 hover:bg-gray-50 transition-colors duration-150 ${
                          !notification.read ? 'bg-primary-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification._id);
                          }
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="p-2 rounded-full bg-white shadow-sm">
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title || 'Notification'}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message || 'Pas de détails'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 text-center bg-gradient-to-r from-primary-50 to-purple-50">
              <Link
                to="/notifications"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientNotificationsPanel;
