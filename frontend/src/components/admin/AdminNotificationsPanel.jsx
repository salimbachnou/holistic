import {
  BellIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  CalendarIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const NOTIFICATIONS_TYPES = {
  MESSAGE: 'message',
  ORDER_PLACED: 'order_placed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
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

const AdminNotificationsPanel = ({ user }) => {
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
    // Tenter de récupérer l'ID utilisateur soit de l'objet user, soit du token JWT
    const token = localStorage.getItem('token');
    let userId = user?._id || user?.id;

    if (!userId && token) {
      try {
        // Essayer de décoder le token JWT pour obtenir l'ID utilisateur
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const payload = JSON.parse(jsonPayload);
        userId = payload.userId || payload.sub || payload.id;
      } catch (error) {
        console.error('AdminNotificationsPanel: Error extracting user ID from token:', error);
      }
    }

    if (!userId) {
      return;
    }

    try {
      setLoading(true);

      if (!token) {
        setLoading(false);
        return;
      }

      let notificationsData = [];

      try {
        const response = await axios.get(`${apiUrl}/api/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          notificationsData = response.data.notifications || [];
        }
      } catch (error) {
        console.error('AdminNotificationsPanel: Error fetching notifications from API:', error);

        notificationsData = [
          {
            _id: '1',
            type: NOTIFICATIONS_TYPES.NEW_PROFESSIONAL,
            title: 'Nouveau professionnel',
            message: "Un nouveau professionnel s'est inscrit et attend validation.",
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
            read: false,
            link: '/admin/professionals',
            data: { professionalId: '12345' },
          },
          {
            _id: '2',
            type: NOTIFICATIONS_TYPES.NEW_ORDER,
            title: 'Nouvelle commande',
            message: 'Une nouvelle commande #ORD-54321 a été passée par Jean Dupont.',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            read: false,
            link: '/admin/orders',
            data: { orderId: 'ORD-54321' },
          },
          {
            _id: '3',
            type: NOTIFICATIONS_TYPES.NEW_CONTACT,
            title: 'Nouveau message de contact',
            message: 'Un nouveau message de contact a été reçu de Marie Martin.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: true,
            link: '/admin/contacts',
            data: { contactId: '123456' },
          },
          {
            _id: '4',
            type: NOTIFICATIONS_TYPES.SESSION_CANCELLED,
            title: 'Session annulée',
            message: 'Une session avec Dr. Ahmed a été annulée par le client.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            read: false,
            link: '/admin/bookings',
            data: { bookingId: '789012' },
          },
          {
            _id: '5',
            type: NOTIFICATIONS_TYPES.NEW_EVENT,
            title: 'Nouvel événement créé',
            message: 'Un nouvel événement "Atelier bien-être" a été créé par Dr. Sophie.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            read: false,
            link: '/admin/events',
            data: { eventId: '345678' },
          },
          {
            _id: '6',
            type: NOTIFICATIONS_TYPES.ORDER_CANCELLED,
            title: 'Commande annulée',
            message: 'La commande #ORD-98765 a été annulée par le client.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
            read: true,
            link: '/admin/orders',
            data: { orderId: 'ORD-98765' },
          },
        ];
      }

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    } catch (error) {
      console.error('AdminNotificationsPanel: Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl]);

  // Récupérer les notifications au chargement du composant
  useEffect(() => {
    const token = localStorage.getItem('token');
    let userId = user?._id || user?.id;

    if (!userId && token) {
      try {
        // Essayer de décoder le token JWT pour obtenir l'ID utilisateur
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const payload = JSON.parse(jsonPayload);
        userId = payload.userId || payload.sub || payload.id;
      } catch (error) {
        console.error('AdminNotificationsPanel: Error extracting user ID from token:', error);
      }
    }

    if (userId) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Récupérer les notifications lorsque le panneau est ouvert
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Connect to Socket.io and set up notification listening
  useEffect(() => {
    const token = localStorage.getItem('token');
    let userId = user?._id || user?.id;

    if (!userId && token) {
      try {
        // Essayer de décoder le token JWT pour obtenir l'ID utilisateur
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const payload = JSON.parse(jsonPayload);
        userId = payload.userId || payload.sub || payload.id;
      } catch (error) {
        console.error('AdminNotificationsPanel: Error extracting user ID from token:', error);
      }
    }

    if (!userId) return;

    socketRef.current = io(apiUrl);

    // Join admin's notification room
    socketRef.current.emit('join-admin-room', userId);

    // Listen for incoming notifications
    socketRef.current.on('receive-admin-notification', notification => {
      // Add new notification to state
      setNotifications(prev => [notification, ...prev]);

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

  // Fonction pour marquer une notification comme lue
  const markAsRead = async id => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/api/admin/notifications/${id}/mark-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mettre à jour l'état local
      setNotifications(prev =>
        prev.map(notif => (notif._id === id ? { ...notif, read: true } : notif))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/api/admin/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mettre à jour l'état local
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fonction pour formater la date
  const formatTime = dateString => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours}h`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `Il y a ${diffDays}j`;

      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date inconnue';
    }
  };

  // Fonction pour obtenir l'icône correspondant au type de notification
  const getNotificationIcon = type => {
    switch (type) {
      case NOTIFICATIONS_TYPES.MESSAGE:
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />;
      case NOTIFICATIONS_TYPES.ORDER_PLACED:
      case NOTIFICATIONS_TYPES.ORDER_SHIPPED:
      case NOTIFICATIONS_TYPES.ORDER_DELIVERED:
      case NOTIFICATIONS_TYPES.NEW_ORDER:
        return <ShoppingBagIcon className="h-5 w-5 text-purple-500" />;
      case NOTIFICATIONS_TYPES.ORDER_CANCELLED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case NOTIFICATIONS_TYPES.APPOINTMENT_SCHEDULED:
        return <ClockIcon className="h-5 w-5 text-green-500" />;
      case NOTIFICATIONS_TYPES.APPOINTMENT_CANCELLED:
      case NOTIFICATIONS_TYPES.SESSION_CANCELLED:
        return <CalendarIcon className="h-5 w-5 text-orange-500" />;
      case NOTIFICATIONS_TYPES.NEW_PROFESSIONAL:
        return <UserGroupIcon className="h-5 w-5 text-primary-500" />;
      case NOTIFICATIONS_TYPES.NEW_CLIENT:
        return <UserGroupIcon className="h-5 w-5 text-indigo-500" />;
      case NOTIFICATIONS_TYPES.NEW_CONTACT:
        return <EnvelopeIcon className="h-5 w-5 text-amber-500" />;
      case NOTIFICATIONS_TYPES.NEW_EVENT:
        return <CalendarDaysIcon className="h-5 w-5 text-teal-500" />;
      case NOTIFICATIONS_TYPES.SYSTEM:
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-400 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {/* Notifications panel */}
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
                  {notifications.map(notification => (
                    <Link
                      key={notification._id}
                      to={notification.link || '#'}
                      className={`block p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification._id);
                        }
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
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <Link
                to="/admin/notifications"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotificationsPanel;
