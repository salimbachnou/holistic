import {
  UsersIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Clients',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up',
      link: '/admin/clients',
    },
    {
      title: 'Professionnels Actifs',
      value: stats?.totalProfessionals || 0,
      icon: UserGroupIcon,
      color: 'bg-emerald-500',
      change: '+8%',
      trend: 'up',
      link: '/admin/professionals',
    },
    {
      title: 'Commandes',
      value: stats?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'bg-purple-500',
      change: '+15%',
      trend: 'up',
      link: '/admin/orders',
    },
    {
      title: 'Réservations',
      value: stats?.totalBookings || 0,
      icon: CalendarDaysIcon,
      color: 'bg-orange-500',
      change: '+5%',
      trend: 'up',
      link: '/admin/bookings',
    },
    {
      title: 'Événements',
      value: stats?.totalEvents || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-pink-500',
      change: '+3%',
      trend: 'up',
      link: '/admin/events',
    },
    {
      title: 'Contacts en Attente',
      value: stats?.pendingContacts || 0,
      icon: EnvelopeIcon,
      color: 'bg-red-500',
      change: '-2%',
      trend: 'down',
      link: '/admin/contacts',
    },
    {
      title: 'Revenus du Mois',
      value: `${stats?.monthlyRevenue || 0} MAD`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      change: '+18%',
      trend: 'up',
      link: '/admin/analytics',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre plateforme Holistic.ma</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Dernière mise à jour</p>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(), 'PPp', { locale: fr })}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Link
                  to={stat.link}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Commandes Récentes</h3>
              <Link
                to="/admin/orders"
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
              >
                Voir tout
                <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {stats?.recentOrders?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map(order => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <ShoppingBagIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{order.totalAmount?.amount} MAD</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'dd MMM', { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBagIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune commande récente</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Actions Rapides</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/admin/professionals"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
              >
                <UserGroupIcon className="h-8 w-8 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-center text-gray-600 group-hover:text-emerald-700">
                  Ajouter Professionnel
                </p>
              </Link>

              <Link
                to="/admin/contacts?status=pending"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
              >
                <EnvelopeIcon className="h-8 w-8 text-gray-400 group-hover:text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-center text-gray-600 group-hover:text-orange-700">
                  Contacts en Attente
                </p>
              </Link>

              <Link
                to="/admin/products?status=pending"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
              >
                <ShoppingBagIcon className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-center text-gray-600 group-hover:text-purple-700">
                  Produits à Valider
                </p>
              </Link>

              <Link
                to="/admin/analytics"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <EyeIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-center text-gray-600 group-hover:text-blue-700">
                  Voir Analytics
                </p>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">État du Système</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Serveur API</p>
              <p className="text-xs text-gray-500">En ligne</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Base de données</p>
              <p className="text-xs text-gray-500">Opérationnelle</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Paiements</p>
              <p className="text-xs text-gray-500">Maintenance prévue</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;
