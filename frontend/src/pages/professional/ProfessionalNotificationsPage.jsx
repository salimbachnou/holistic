import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  CreditCardIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowPathIcon,
  TruckIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import apiService from '../../services/api.service';

const ProfessionalNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedType, setSelectedType] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async id => {
    try {
      const response = await apiService.post(`/notifications/${id}/mark-read`);
      if (response.data.success) {
        setNotifications(
          notifications.map(notification =>
            notification._id === id ? { ...notification, read: true } : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.post('/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })));
        toast.success('Toutes les notifications ont été marquées comme lues');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const deleteNotification = async id => {
    try {
      const response = await apiService.delete(`/notifications/${id}`);
      if (response.data.success) {
        setNotifications(notifications.filter(notification => notification._id !== id));
        toast.success('Notification supprimée');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression de la notification');
    }
  };

  const getNotificationIcon = type => {
    switch (type) {
      case 'message':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />;
      case 'appointment_scheduled':
        return <CalendarIcon className="h-5 w-5 text-purple-500" />;
      case 'appointment_cancelled':
        return <CalendarIcon className="h-5 w-5 text-red-500" />;
      case 'payment_received':
        return <CreditCardIcon className="h-5 w-5 text-green-500" />;
      case 'new_client':
        return <UserCircleIcon className="h-5 w-5 text-indigo-500" />;
      case 'new_contact':
        return <EnvelopeIcon className="h-5 w-5 text-yellow-500" />;
      case 'new_order':
        return <ShoppingBagIcon className="h-5 w-5 text-orange-500" />;
      case 'order_placed':
        return <ShoppingBagIcon className="h-5 w-5 text-blue-500" />;
      case 'order_shipped':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case 'order_delivered':
        return <ArchiveBoxIcon className="h-5 w-5 text-green-500" />;
      case 'order_cancelled':
        return <ShoppingBagIcon className="h-5 w-5 text-red-500" />;
      case 'session_cancelled':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'new_professional':
        return <UserGroupIcon className="h-5 w-5 text-purple-500" />;
      case 'new_event':
        return <CalendarDaysIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
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

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'read') return notification.read;
      return true;
    })
    .filter(notification => {
      if (selectedType === 'all') return true;
      return notification.type === selectedType;
    });

  const notificationTypes = [
    { value: 'all', label: 'Toutes' },
    { value: 'message', label: 'Messages' },
    { value: 'appointment_scheduled', label: 'Rendez-vous' },
    { value: 'session_cancelled', label: 'Sessions annulées' },
    { value: 'payment_received', label: 'Paiements' },
    { value: 'new_client', label: 'Nouveaux clients' },
    { value: 'new_order', label: 'Nouvelles commandes' },
    { value: 'order_placed', label: 'Commandes passées' },
    { value: 'order_shipped', label: 'Commandes expédiées' },
    { value: 'order_delivered', label: 'Commandes livrées' },
    { value: 'order_cancelled', label: 'Commandes annulées' },
    { value: 'new_event', label: 'Nouveaux événements' },
    { value: 'system', label: 'Système' },
  ];

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos notifications et restez informé de l'activité de votre compte
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchNotifications}
              className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualiser
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } transition-colors duration-200`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                filter === 'unread'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } transition-colors duration-200`}
            >
              Non lues {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                filter === 'read'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } transition-colors duration-200`}
            >
              Lues
            </button>
          </div>

          <div className="relative">
            <div className="flex items-center">
              <FunnelIcon className="h-4 w-4 text-gray-500 mr-2" />
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune notification</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? "Vous n'avez pas encore de notifications"
                : filter === 'unread'
                  ? "Vous n'avez pas de notifications non lues"
                  : "Vous n'avez pas de notifications lues"}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification._id}
              className={`p-6 hover:bg-gray-50 transition-colors duration-150 ${
                !notification.read ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-white shadow-sm">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <a
                      href={notification.link || '#'}
                      className="text-base font-medium text-gray-900 hover:text-primary-600"
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification._id);
                        }
                      }}
                    >
                      {notification.title}
                    </a>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-primary-600 hover:text-primary-800 p-1 rounded-full hover:bg-primary-50 transition-colors duration-200"
                          title="Marquer comme lu"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDate(notification.createdAt)}
                  </div>

                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Détails supplémentaires:
                      </p>
                      {Object.entries(notification.data).map(([key, value]) => (
                        <div key={key} className="text-xs text-gray-600">
                          <span className="font-medium">{key}: </span>
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfessionalNotificationsPage;
