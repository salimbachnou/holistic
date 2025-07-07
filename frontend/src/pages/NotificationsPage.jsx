import {
  ArrowPathIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../utils/api';

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

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      try {
        const response = await userAPI.getNotifications();

        if (response.data.success) {
          // Normaliser les données MongoDB
          setNotifications(normalizeMongoData(response.data.notifications) || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);

        // Pour le développement, utiliser des données fictives
        const mockNotifications = [
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

        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      try {
        await userAPI.markAllNotificationsRead();
        toast.success('Toutes les notifications ont été marquées comme lues');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        toast.error('Erreur lors du marquage des notifications');
      }

      // Update UI immediately
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const markAsRead = async notificationId => {
    try {
      try {
        await userAPI.markNotificationRead(notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        toast.error('Erreur lors du marquage de la notification');
      }

      // Update UI immediately
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const deleteNotification = async notificationId => {
    try {
      try {
        await userAPI.deleteNotification(notificationId);
        toast.success('Notification supprimée');
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Erreur lors de la suppression de la notification');
      }

      // Update UI immediately
      setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression de la notification');
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

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'orders') return notification.type.includes('order');
    if (filter === 'appointments') return notification.type.includes('appointment');
    if (filter === 'messages') return notification.type === 'message';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <BellIcon className="h-6 w-6 mr-2 text-primary-600" />
                Mes notifications
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={fetchNotifications}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Actualiser
                </button>
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Tout marquer comme lu
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-800 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'unread'
                    ? 'bg-primary-100 text-primary-800 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Non lues
              </button>
              <button
                onClick={() => setFilter('orders')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'orders'
                    ? 'bg-primary-100 text-primary-800 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Commandes
              </button>
              <button
                onClick={() => setFilter('appointments')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'appointments'
                    ? 'bg-primary-100 text-primary-800 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Rendez-vous
              </button>
              <button
                onClick={() => setFilter('messages')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'messages'
                    ? 'bg-primary-100 text-primary-800 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Messages
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement de vos notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune notification</h3>
                <p className="text-gray-500">
                  {filter === 'all'
                    ? "Vous n'avez pas encore reçu de notifications."
                    : 'Aucune notification ne correspond à ce filtre.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 sm:p-6 ${!notification.read ? 'bg-primary-50' : 'bg-white'}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          to={notification.link || '#'}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          Voir les détails
                        </Link>
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1 text-gray-500 hover:text-primary-600"
                              title="Marquer comme lu"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
