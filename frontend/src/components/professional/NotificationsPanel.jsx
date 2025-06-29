import {
  BellIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShoppingBagIcon,
  UserIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const NOTIFICATIONS_TYPES = {
  MESSAGE: 'message',
  BOOKING_REQUEST: 'booking_request',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  NEW_CLIENT: 'new_client',
  SYSTEM: 'system',
};

const NotificationsPanel = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const panelRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    if (!user?._id) {
      console.log('NotificationsPanel: No user ID, skipping fetch');
      return;
    }

    try {
      console.log('NotificationsPanel: Fetching notifications...');
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('NotificationsPanel: Token exists:', !!token);

      if (!token) {
        console.log('NotificationsPanel: No token, skipping fetch');
        setLoading(false);
        return;
      }

      let notificationsData = [];

      try {
        console.log('NotificationsPanel: Making API request...');
        const response = await axios.get(`${apiUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('NotificationsPanel: API response:', response.data);
        if (response.data.success) {
          // Normaliser les données MongoDB
          notificationsData = normalizeMongoData(response.data.notifications) || [];
          console.log('NotificationsPanel: Normalized notifications from API:', notificationsData);
        }
      } catch (error) {
        console.error('NotificationsPanel: Error fetching notifications from API:', error);

        // For demo, we'll use mock data
        console.log('NotificationsPanel: Using mock data');
        notificationsData = [
          {
            _id: '1',
            type: NOTIFICATIONS_TYPES.MESSAGE,
            title: 'Nouveau message',
            message: 'Bonjour, je suis intéressé par votre service...',
            sender: {
              _id: '123',
              name: 'Marie Dupont',
              avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
            read: false,
            link: '/dashboard/professional/messages',
          },
          {
            _id: '2',
            type: NOTIFICATIONS_TYPES.BOOKING_REQUEST,
            title: 'Nouvelle demande de réservation',
            message: 'Pour le 15 juin à 14h00',
            sender: {
              _id: '456',
              name: 'Jean Martin',
              avatar: null,
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            read: false,
            link: '/dashboard/professional/sessions',
          },
          {
            _id: '3',
            type: NOTIFICATIONS_TYPES.PAYMENT_RECEIVED,
            title: 'Paiement reçu',
            message: '75 MAD - Session de coaching',
            sender: {
              _id: '789',
              name: 'Sophie Leclerc',
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: true,
            link: '/dashboard/professional/payments',
          },
        ];
      }

      console.log('NotificationsPanel: Setting notifications state:', notificationsData);
      console.log('NotificationsPanel: Notifications length:', notificationsData.length);

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    } catch (error) {
      console.error('NotificationsPanel: Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl]);

  // Récupérer les notifications au chargement du composant
  useEffect(() => {
    if (user?._id) {
      console.log('NotificationsPanel: User ID changed, fetching notifications:', user._id);
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Récupérer les notifications lorsque le panneau est ouvert
  useEffect(() => {
    if (isOpen) {
      console.log('NotificationsPanel: Panel opened, fetching notifications');
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Connect to Socket.io and set up notification listening
  useEffect(() => {
    if (!user?._id) return;

    console.log('NotificationsPanel: Setting up socket connection for user:', user._id);
    socketRef.current = io(apiUrl);

    // Join user's notification room
    socketRef.current.emit('join-user-room', user._id);

    // Listen for incoming notifications
    socketRef.current.on('receive-notification', notification => {
      console.log('NotificationsPanel: Received new notification:', notification);
      // Add new notification to state
      setNotifications(prev => [normalizeMongoData(notification), ...prev]);

      // Update unread count
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, apiUrl]);

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
      if (data.$oid) {
        return data.$oid;
      }

      // Cas spécial pour les dates MongoDB
      if (data.$date) {
        return new Date(data.$date).toISOString();
      }

      // Pour les autres objets, normaliser récursivement
      const normalized = {};
      for (const [key, value] of Object.entries(data)) {
        normalized[key] = normalizeMongoData(value);
      }
      return normalized;
    }

    return data;
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');

      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/mark-all-read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
      const token = localStorage.getItem('token');

      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${notificationId}/mark-read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
      case NOTIFICATIONS_TYPES.BOOKING_REQUEST:
      case NOTIFICATIONS_TYPES.BOOKING_CONFIRMED:
      case NOTIFICATIONS_TYPES.BOOKING_CANCELLED:
        return <ClockIcon className="h-6 w-6 text-purple-500" />;
      case NOTIFICATIONS_TYPES.PAYMENT_RECEIVED:
        return <ShoppingBagIcon className="h-6 w-6 text-green-500" />;
      case NOTIFICATIONS_TYPES.NEW_CLIENT:
        return <UserIcon className="h-6 w-6 text-orange-500" />;
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
          console.log('NotificationsPanel: Opening panel, notifications:', notifications);
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
                    console.log('NotificationsPanel: Manually refreshing notifications');
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
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <Link
                      key={notification._id}
                      to={notification.link}
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
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {notification.message}
                          </p>
                          {notification.sender && (
                            <div className="flex items-center mt-2">
                              {notification.sender.avatar ? (
                                <img
                                  src={notification.sender.avatar}
                                  alt={notification.sender.name}
                                  className="h-6 w-6 rounded-full mr-2 border border-white shadow-sm"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-gradient-lotus flex items-center justify-center mr-2 shadow-sm text-white">
                                  <span className="text-xs">
                                    {notification.sender.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-gray-600 font-medium">
                                {notification.sender.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 text-center bg-gradient-to-r from-primary-50 to-purple-50">
              <Link
                to="/dashboard/professional/notifications"
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

export default NotificationsPanel;
