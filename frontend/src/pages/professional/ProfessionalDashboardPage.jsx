// External dependencies
import {
  UserIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  CogIcon,
  ArrowRightIcon,
  EyeIcon,
  PlusIcon,
  TicketIcon,
  ChatBubbleBottomCenterTextIcon,
  CreditCardIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Internal dependencies
import ProfessionalButton from '../../components/professional/ProfessionalButton';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import ProfessionalDashboardCard from '../../components/professional/ProfessionalDashboardCard';
import { API_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalDashboardPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await axios.get(`${API_URL}/professionals/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.success) {
          setStats(response.data.stats);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);

        // More descriptive error message based on the error type
        let errorMessage = 'Une erreur est survenue lors du chargement des données';
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status === 500) {
            errorMessage = 'Erreur serveur: Le service est temporairement indisponible';
          } else if (error.response.status === 404) {
            errorMessage = 'Endpoint introuvable: Veuillez contacter le support technique';
          } else if (error.response.status === 403) {
            errorMessage = "Accès refusé: Vous n'avez pas les permissions nécessaires";
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'Aucune réponse du serveur: Vérifiez votre connexion internet';
        }

        setError(errorMessage);

        // Use mock data as fallback in case of error
        setStats({
          sessions: {
            total: 0,
            trend: 'up',
            trendValue: '+0%',
          },
          clients: {
            total: 0,
            trend: 'up',
            trendValue: '+0',
          },
          revenue: {
            total: '0',
            trend: 'up',
            trendValue: '+0%',
          },
          rating: {
            total: '0.0',
            trend: 'up',
            trendValue: '+0.0',
          },
          upcomingSessions: [],
          recentMessages: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const quickActions = [
    {
      name: 'Mon Profil',
      href: '/dashboard/professional/profile',
      icon: UserIcon,
      description: 'Gérer les informations de votre profil',
      color: 'primary',
    },
    {
      name: 'Mes Sessions',
      href: '/dashboard/professional/sessions',
      icon: CalendarDaysIcon,
      description: 'Créer et gérer vos sessions',
      color: 'green',
    },
    {
      name: 'Mes Produits',
      href: '/dashboard/professional/products',
      icon: ShoppingBagIcon,
      description: 'Gérer votre catalogue de produits',
      color: 'blue',
    },
    {
      name: 'Mes Événements',
      href: '/dashboard/professional/events',
      icon: TicketIcon,
      description: 'Organiser et gérer vos événements',
      color: 'purple',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 shadow-lotus"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Professionnel</h1>
        <p className="mt-2 text-lg text-gray-600">
          Bienvenue {user?.firstName}, gérez votre activité holistic
        </p>
        {error && (
          <div className="mt-2 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            <div className="font-medium mb-1">Erreur de chargement des données</div>
            <div className="text-sm">{error}</div>
            {error.includes('serveur') && (
              <div className="mt-2 text-sm">
                Le serveur rencontre actuellement des difficultés. Nous travaillons à résoudre ce
                problème.
                <br />
                Les données affichées ci-dessous sont des exemples et ne reflètent pas votre
                activité réelle.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProfessionalDashboardCard
          title="Sessions ce mois"
          value={stats.sessions.total}
          icon={CalendarDaysIcon}
          color="primary"
          trend={stats.sessions.trend}
          trendValue={stats.sessions.trendValue}
          link="/dashboard/professional/sessions"
        />
        <ProfessionalDashboardCard
          title="Nouveaux clients"
          value={stats.clients.total}
          icon={UsersIcon}
          color="green"
          trend={stats.clients.trend}
          trendValue={stats.clients.trendValue}
          link="/dashboard/professional/clients"
        />
        <ProfessionalDashboardCard
          title="Revenus (MAD)"
          value={stats.revenue.total}
          icon={CreditCardIcon}
          color="blue"
          trend={stats.revenue.trend}
          trendValue={stats.revenue.trendValue}
          link="/dashboard/professional/analytics"
        />
        <ProfessionalDashboardCard
          title="Note moyenne"
          value={stats.rating.total}
          icon={StarIcon}
          color="yellow"
          trend={stats.rating.trend}
          trendValue={stats.rating.trendValue}
          description="/5"
          link="/dashboard/professional/reviews"
        />
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900">Actions rapides</h2>
          <ProfessionalButton
            to="/dashboard/professional/settings"
            variant="ghost"
            icon={CogIcon}
            size="sm"
          >
            Paramètres
          </ProfessionalButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ProfessionalCard hover title={action.name} icon={action.icon} color={action.color}>
                <div className="text-center pt-2 pb-3">
                  <p className="text-sm text-gray-600 mb-5">{action.description}</p>
                  <ProfessionalButton to={action.href} variant="primary" fullWidth>
                    Accéder
                  </ProfessionalButton>
                </div>
              </ProfessionalCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Prochaines sessions */}
        <ProfessionalCard
          title="Prochaines sessions"
          icon={CalendarDaysIcon}
          color="primary"
          actionButtons={
            <Link
              to="/dashboard/professional/sessions"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              Voir tout
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          }
        >
          <div className="space-y-4">
            {stats.upcomingSessions && stats.upcomingSessions.length > 0 ? (
              stats.upcomingSessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-12 bg-gradient-lotus rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">{session.title}</p>
                      <p className="text-sm text-gray-600">{session.time}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{session.participants} participants</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">Aucune session à venir</div>
            )}
          </div>
          <div className="mt-6">
            <ProfessionalButton
              to="/dashboard/professional/sessions/new"
              variant="primary"
              icon={PlusIcon}
              fullWidth
            >
              Créer une session
            </ProfessionalButton>
          </div>
        </ProfessionalCard>

        {/* Messages récents */}
        <ProfessionalCard
          title="Messages récents"
          icon={ChatBubbleBottomCenterTextIcon}
          color="blue"
          actionButtons={
            <Link
              to="/dashboard/professional/messages"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Voir tout
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          }
        >
          <div className="space-y-4">
            {stats.recentMessages && stats.recentMessages.length > 0 ? (
              stats.recentMessages.map(message => (
                <div
                  key={message.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{message.name}</p>
                      <p className="text-sm text-gray-600 truncate">{message.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{message.time}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">Aucun message récent</div>
            )}
          </div>
          <div className="mt-6">
            <ProfessionalButton
              to="/dashboard/professional/messages"
              variant="outline"
              color="blue"
              icon={EyeIcon}
              fullWidth
            >
              Voir tous les messages
            </ProfessionalButton>
          </div>
        </ProfessionalCard>
      </div>
    </div>
  );
};

export default ProfessionalDashboardPage;
