import {
  UserIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightIcon,
  EyeIcon,
  PlusIcon,
  UsersIcon,
  CreditCardIcon,
  StarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import ProfessionalStatsDebugger from '../../components/professional/ProfessionalStatsDebugger';
import RatingBreakdown from '../../components/professional/RatingBreakdown';
import RecentMessagesSection from '../../components/professional/RecentMessageCard';
import { useAuth } from '../../contexts/AuthContext';
import ProfessionalService from '../../services/professionalService';

const ProfessionalDashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(
    location.state?.showVerificationMessage ||
      searchParams.get('showVerification') === 'true' ||
      false
  );
  const [professionalProfile, setProfessionalProfile] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchProfessionalProfile();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ProfessionalService.getDashboardStats();

      if (result.success && result.data && result.data.success) {
        // Validate the data structure
        if (ProfessionalService.validateDashboardStats(result.data.stats)) {
          setStats(result.data.stats);
        } else {
          throw new Error('Format de données invalide');
        }
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionalProfile = async () => {
    try {
      const result = await ProfessionalService.getProfessionalProfile();

      if (result.success && result.data) {
        setProfessionalProfile(result.data);

        // Show verification message if professional is not verified and not dismissed
        if (!result.data.isVerified) {
          setShowVerificationMessage(true);
        } else if (result.data.isVerified) {
          setShowVerificationMessage(false);
          // Clear the dismissed flag since account is now verified
          localStorage.removeItem('verificationMessageDismissed');
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil professionnel:', err);
    }
  };

  const quickActions = [
    {
      name: 'Nouvelle session',
      description: 'Créer une nouvelle session',
      href: '/dashboard/professional/sessions',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Mes clients',
      description: 'Gérer mes clients',
      href: '/dashboard/professional/clients',
      icon: UsersIcon,
    },
    {
      name: 'Mes produits',
      description: 'Gérer mes produits',
      href: '/dashboard/professional/products',
      icon: ShoppingBagIcon,
    },
    {
      name: 'Statistiques',
      description: 'Voir mes statistiques',
      href: '/dashboard/professional/analytics',
      icon: ChartBarIcon,
    },
    {
      name: 'Mon profil',
      description: 'Modifier mon profil',
      href: '/dashboard/professional/profile',
      icon: UserIcon,
    },
    {
      name: 'Réservations Événements',
      description: 'Gérez les inscriptions et participants de vos événements',
      href: '/dashboard/professional/event-bookings',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Réservations de Sessions',
      description: 'Gérez toutes les réservations de vos sessions',
      href: '/dashboard/professional/session-bookings',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Paramètres',
      description: 'Configurer mon compte',
      href: '/dashboard/professional/settings',
      icon: CogIcon,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Verification Message */}
        {showVerificationMessage &&
          !localStorage.getItem('verificationMessageDismissed') &&
          (!professionalProfile || !professionalProfile.isVerified) && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Compte en attente de vérification
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Votre inscription a été effectuée avec succès ! Votre compte sera vérifié par
                      l'administrateur dans les plus brefs délais.
                    </p>
                    <p className="mt-2">
                      <strong>Important :</strong> Vos sessions, événements et produits ne seront
                      visibles par les clients qu'après la confirmation de votre compte par
                      l'administrateur.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        setShowVerificationMessage(false);
                        // Store in localStorage to remember user dismissed the message
                        localStorage.setItem('verificationMessageDismissed', 'true');
                      }}
                    >
                      Compris
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard Professionnel
              </h1>
              <p className="mt-2 text-base sm:text-lg text-gray-600">
                Bienvenue {user?.firstName}, gérez votre activité Holistic
              </p>
            </div>
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 transition-all duration-200 self-start"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
              <span className="sm:hidden">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lotus-card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Sessions ce mois</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats?.sessions?.total || 0}
                </p>
              </div>
              <div className="flex items-center ml-4">
                <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2" />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    stats?.sessions?.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {stats?.sessions?.trendValue || '+0%'}
                </span>
              </div>
            </div>
          </div>

          <div className="lotus-card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Nouveaux clients</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats?.clients?.total || 0}
                </p>
              </div>
              <div className="flex items-center ml-4">
                <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 mr-2" />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    stats?.clients?.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {stats?.clients?.trendValue || '+0'}
                </span>
              </div>
            </div>
          </div>

          <div className="lotus-card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Revenus ce mois</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {ProfessionalService.formatCurrency(stats?.revenue?.total || 0)} MAD
                </p>
              </div>
              <div className="flex items-center ml-4">
                <CreditCardIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2" />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    stats?.revenue?.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {stats?.revenue?.trendValue || '+0%'}
                </span>
              </div>
            </div>
          </div>

          <div className="lotus-card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Note moyenne</p>
                <div className="flex items-baseline">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats?.rating?.total || '0.0'}
                  </p>
                  <span className="text-sm text-gray-500 ml-1">/5</span>
                </div>
                {stats?.rating?.totalReviews > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{stats.rating.totalReviews} avis</p>
                )}
              </div>
              <div className="flex flex-col items-center ml-4">
                <StarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mb-1" />
                {stats?.rating?.totalReviews > 0 &&
                stats?.rating?.trendValue &&
                stats?.rating?.trendValue !== '0.0' &&
                stats?.rating?.trendValue !== '+0.0' ? (
                  <span
                    className={`text-xs font-medium ${
                      stats?.rating?.trend === 'up'
                        ? 'text-emerald-600'
                        : stats?.rating?.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {stats?.rating?.trend === 'up'
                      ? '↗'
                      : stats?.rating?.trend === 'down'
                        ? '↘'
                        : '→'}{' '}
                    {stats.rating.trendValue}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    {stats?.rating?.totalReviews > 0 ? 'Stable' : 'Nouveau'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="lotus-card hover:shadow-lotus-hover transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center p-3 sm:p-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-lotus opacity-90 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2 text-center leading-tight">
                      {action.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 text-center leading-tight hidden sm:block">
                      {action.description}
                    </p>
                    <div className="flex items-center text-primary-600 group-hover:text-primary-700 font-medium">
                      <span className="text-xs sm:text-sm">Accéder</span>
                      <ArrowRightIcon className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rating Breakdown */}
        {stats?.rating?.totalReviews > 0 && (
          <div className="mb-6 sm:mb-8">
            <RatingBreakdown rating={stats.rating} />
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Prochaines sessions */}
          <div className="lotus-card">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Prochaines sessions
              </h3>
              <Link
                to="/dashboard/professional/sessions"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                <span className="hidden sm:inline">Voir tout</span>
                <span className="sm:hidden">Tout</span>
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {stats?.upcomingSessions?.length > 0 ? (
                stats.upcomingSessions.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {session.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString('fr-FR')} à {session.time}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 ml-2 flex-shrink-0">
                      {session.participants || 0} participants
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <CalendarDaysIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                  <p className="text-sm">Aucune session prochaine</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/dashboard/professional/sessions"
                className="w-full btn-primary text-sm flex justify-center items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle session
              </Link>
            </div>
          </div>

          {/* Messages récents */}
          <div className="lotus-card">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Messages récents</h3>
              <Link
                to="/dashboard/professional/messages"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                <span className="hidden sm:inline">Voir tout</span>
                <span className="sm:hidden">Tout</span>
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <RecentMessagesSection
              messages={stats?.recentMessages || []}
              onMessageClick={message => {}}
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 sm:mt-8 lotus-card bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Optimisez votre profil professionnel
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Un profil complet attire plus de clients. Ajoutez vos photos, certifications et
              horaires.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/dashboard/professional/profile"
                className="btn-primary text-sm sm:text-base"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Voir mon profil
              </Link>
              <Link
                to="/dashboard/professional/settings"
                className="btn-secondary text-sm sm:text-base"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Paramètres
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboardPage;
