import {
  BellIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShoppingBagIcon,
  UserIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

import apiService from '../../services/api.service';

const NOTIFICATIONS_TYPES = {
  MESSAGE: 'message',
  BOOKING_REQUEST: 'booking_request',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  NEW_CLIENT: 'new_client',
  SYSTEM: 'system',
  ORDER_PLACED: 'order_placed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  SESSION_CANCELLED: 'session_cancelled',
  NEW_ORDER: 'new_order',
  NEW_CONTACT: 'new_contact',
  NEW_PROFESSIONAL: 'new_professional',
  NEW_EVENT: 'new_event',
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
    if (!user) {
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiService.get('/notifications');

      if (response.data.success) {
        const notificationsData = response.data.notifications || [];

        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('NotificationsPanel: Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Récupérer les notifications au chargement du composant
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      fetchNotifications();
    } else {
      // Skip fetching notifications if user ID is not available
    }
  }, [user, fetchNotifications]);

  // Récupérer les notifications lorsque le panneau est ouvert
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (isOpen && userId) {
      fetchNotifications();
    } else if (isOpen && !userId) {
      // Panel is open but user ID is not available
    }
  }, [isOpen, fetchNotifications, user]);

  // Connect to Socket.io and set up notification listening
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) {
      // Cannot connect to socket without user ID
      return;
    }

    socketRef.current = io(apiUrl);

    // Join user's notification room
    socketRef.current.emit('join-user-room', userId);

    // Listen for incoming notifications
    socketRef.current.on('receive-notification', notification => {
      // Add new notification to state
      setNotifications(prev => [notification, ...prev]);

      // Update unread count
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, apiUrl]);

  const markAllAsRead = async () => {
    try {
      await apiService.post('/notifications/mark-all-read');

      // Update UI immediately
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const markAsRead = async notificationId => {
    try {
      await apiService.post(`/notifications/${notificationId}/mark-read`);

      // Update UI immediately
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const getNotificationIcon = type => {
    switch (type) {
      case NOTIFICATIONS_TYPES.MESSAGE:
        return <ChatBubbleLeftIcon className="h-6 w-6 text-blue-500" />;
      case NOTIFICATIONS_TYPES.BOOKING_REQUEST:
      case NOTIFICATIONS_TYPES.BOOKING_CONFIRMED:
      case NOTIFICATIONS_TYPES.BOOKING_CANCELLED:
      case NOTIFICATIONS_TYPES.APPOINTMENT_SCHEDULED:
      case NOTIFICATIONS_TYPES.APPOINTMENT_CANCELLED:
        return <ClockIcon className="h-6 w-6 text-purple-500" />;
      case NOTIFICATIONS_TYPES.PAYMENT_RECEIVED:
      case NOTIFICATIONS_TYPES.ORDER_PLACED:
      case NOTIFICATIONS_TYPES.ORDER_SHIPPED:
      case NOTIFICATIONS_TYPES.ORDER_DELIVERED:
      case NOTIFICATIONS_TYPES.NEW_ORDER:
        return <ShoppingBagIcon className="h-6 w-6 text-green-500" />;
      case NOTIFICATIONS_TYPES.ORDER_CANCELLED:
      case NOTIFICATIONS_TYPES.SESSION_CANCELLED:
        return <ShoppingBagIcon className="h-6 w-6 text-red-500" />;
      case NOTIFICATIONS_TYPES.NEW_CLIENT:
      case NOTIFICATIONS_TYPES.NEW_PROFESSIONAL:
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

  // Early return if user is not loaded yet
  if (!user) {
    return (
      <div className="relative">
        <button disabled className="relative p-2 text-gray-300 rounded-lg cursor-not-allowed">
          <BellIcon className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
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
                      to={notification.link || '/dashboard/professional/notifications'}
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
                          {notification.data && notification.data.clientName && (
                            <div className="flex items-center mt-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-lotus flex items-center justify-center mr-2 shadow-sm text-white">
                                <span className="text-xs">
                                  {notification.data.clientName.charAt(0)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">
                                {notification.data.clientName}
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
