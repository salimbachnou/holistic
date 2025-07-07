import {
  ArrowPathIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CalendarIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

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

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fonction pour récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    console.log('AdminNotificationsPage: Debug user object:', user);

    // Tenter de récupérer l'ID utilisateur soit de l'objet user, soit du token JWT
    const token = localStorage.getItem('token');
    let userId = user?._id || user?.id;

    console.log('AdminNotificationsPage: User ID from user object:', userId);

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
        console.log('AdminNotificationsPage: Extracted user ID from token:', userId);
      } catch (error) {
        console.error('AdminNotificationsPage: Error extracting user ID from token:', error);
      }
    }

    if (!userId) {
      console.log('AdminNotificationsPage: No user ID available, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('AdminNotificationsPage: Fetching notifications...');
      setLoading(true);

      console.log('AdminNotificationsPage: Token exists:', !!token);

      const response = await axios.get(`${apiUrl}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('AdminNotificationsPage: API response:', response.data);

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        console.log(
          'AdminNotificationsPage: Notifications loaded:',
          response.data.notifications?.length
        );
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);

      // Pour le développement, utiliser des données fictives
      const mockNotifications = [
        {
          _id: '1',
          type: NOTIFICATIONS_TYPES.NEW_PROFESSIONAL,
          title: 'Nouveau professionnel',
          message: "Un nouveau professionnel s'est inscrit et attend validation.",
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          read: false,
          link: '/admin/professionals',
          data: { professionalId: '12345' },
        },
        {
          _id: '2',
          type: NOTIFICATIONS_TYPES.NEW_ORDER,
          title: 'Nouvelle commande',
          message: 'Une nouvelle commande #ORD-54321 a été passée par Jean Dupont.',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false,
          link: '/admin/orders',
          data: { orderId: 'ORD-54321' },
        },
        {
          _id: '3',
          type: NOTIFICATIONS_TYPES.NEW_CONTACT,
          title: 'Nouveau message de contact',
          message: 'Un nouveau message de contact a été reçu de Marie Martin.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: true,
          link: '/admin/contacts',
          data: { contactId: '123456' },
        },
        {
          _id: '4',
          type: NOTIFICATIONS_TYPES.SESSION_CANCELLED,
          title: 'Session annulée',
          message: 'Une session avec Dr. Ahmed a été annulée par le client.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          read: false,
          link: '/admin/bookings',
          data: { bookingId: '789012' },
        },
        {
          _id: '5',
          type: NOTIFICATIONS_TYPES.NEW_EVENT,
          title: 'Nouvel événement créé',
          message: 'Un nouvel événement "Atelier bien-être" a été créé par Dr. Sophie.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          read: false,
          link: '/admin/events',
          data: { eventId: '345678' },
        },
        {
          _id: '6',
          type: NOTIFICATIONS_TYPES.ORDER_CANCELLED,
          title: 'Commande annulée',
          message: 'La commande #ORD-98765 a été annulée par le client.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          read: true,
          link: '/admin/orders',
          data: { orderId: 'ORD-98765' },
        },
      ];

      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl]);

  // Récupérer les notifications au chargement de la page
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fonction pour formater la date
  const formatDate = dateString => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date inconnue';
    }
  };

  // Fonction pour obtenir l'icône correspondant au type de notification
  const getNotificationIcon = type => {
    switch (type) {
      case NOTIFICATIONS_TYPES.MESSAGE:
        return <ChatBubbleLeftIcon className="h-6 w-6 text-blue-500" />;
      case NOTIFICATIONS_TYPES.ORDER_PLACED:
      case NOTIFICATIONS_TYPES.ORDER_SHIPPED:
      case NOTIFICATIONS_TYPES.ORDER_DELIVERED:
      case NOTIFICATIONS_TYPES.NEW_ORDER:
        return <ShoppingBagIcon className="h-6 w-6 text-purple-500" />;
      case NOTIFICATIONS_TYPES.ORDER_CANCELLED:
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case NOTIFICATIONS_TYPES.APPOINTMENT_SCHEDULED:
        return <ClockIcon className="h-6 w-6 text-green-500" />;
      case NOTIFICATIONS_TYPES.APPOINTMENT_CANCELLED:
      case NOTIFICATIONS_TYPES.SESSION_CANCELLED:
        return <CalendarIcon className="h-6 w-6 text-orange-500" />;
      case NOTIFICATIONS_TYPES.NEW_PROFESSIONAL:
        return <UserGroupIcon className="h-6 w-6 text-primary-500" />;
      case NOTIFICATIONS_TYPES.NEW_CLIENT:
        return <UserGroupIcon className="h-6 w-6 text-indigo-500" />;
      case NOTIFICATIONS_TYPES.NEW_CONTACT:
        return <EnvelopeIcon className="h-6 w-6 text-amber-500" />;
      case NOTIFICATIONS_TYPES.NEW_EVENT:
        return <CalendarDaysIcon className="h-6 w-6 text-teal-500" />;
      case NOTIFICATIONS_TYPES.SYSTEM:
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
    }
  };

  // Filtrer les notifications selon le filtre sélectionné
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type.includes(filter);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez toutes les notifications du système administrateur
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-primary-700 flex items-center"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Non lues
          </button>
          <button
            onClick={() => setFilter('order')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'order'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Commandes
          </button>
          <button
            onClick={() => setFilter('session')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'session'
                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'event'
                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Événements
          </button>
          <button
            onClick={() => setFilter('professional')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'professional'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Professionnels
          </button>
          <button
            onClick={() => setFilter('client')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'client'
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Clients
          </button>
          <button
            onClick={() => setFilter('contact')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'contact'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'system'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Système
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des notifications...</p>
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
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(notification => (
              <div
                key={notification._id}
                className={`p-6 transition-colors duration-200 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-3 rounded-full bg-white shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex space-x-3">
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800"
                          >
                            Voir les détails
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-sm font-medium text-gray-600 hover:text-gray-800"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
