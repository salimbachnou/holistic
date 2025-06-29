import {
  UserIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const ProfessionalDashboardPage = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      name: 'Mon Profil',
      href: '/professional/profile',
      icon: UserIcon,
      description: 'Gérer les informations de votre profil',
      color: 'primary',
    },
    {
      name: 'Mes Sessions',
      href: '/professional/sessions',
      icon: CalendarDaysIcon,
      description: 'Créer et gérer vos sessions',
      color: 'emerald',
    },
    {
      name: 'Mes Produits',
      href: '/professional/products',
      icon: ShoppingBagIcon,
      description: 'Gérer votre catalogue de produits',
      color: 'blue',
    },
    {
      name: 'Statistiques',
      href: '/professional/analytics',
      icon: ChartBarIcon,
      description: 'Voir vos performances',
      color: 'orange',
    },
  ];

  const recentStats = [
    { label: 'Sessions cette semaine', value: '12', trend: '+2' },
    { label: 'Nouveaux clients', value: '8', trend: '+3' },
    { label: 'Revenus ce mois', value: '2,450 MAD', trend: '+15%' },
    { label: 'Note moyenne', value: '4.8', trend: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Professionnel</h1>
          <p className="mt-2 text-lg text-gray-600">
            Bienvenue {user?.firstName}, gérez votre activité Holistic
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {recentStats.map((stat, index) => (
            <div key={index} className="lotus-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-sm font-medium text-emerald-600">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="lotus-card hover:shadow-lotus-hover transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center p-2">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-lotus opacity-90 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <div className="flex items-center text-primary-600 group-hover:text-primary-700 font-medium">
                      <span className="text-sm">Accéder</span>
                      <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prochaines sessions */}
          <div className="lotus-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Prochaines sessions</h3>
              <Link
                to="/professional/sessions"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                Voir tout
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { time: '14:00', title: 'Yoga Hatha - Débutant', participants: 5 },
                { time: '16:30', title: 'Méditation guidée', participants: 8 },
                { time: '18:00', title: 'Vinyasa Flow', participants: 12 },
              ].map((session, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">{session.title}</p>
                      <p className="text-sm text-gray-600">{session.time}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{session.participants} participants</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/professional/sessions"
                className="w-full btn-primary text-sm flex justify-center items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle session
              </Link>
            </div>
          </div>

          {/* Messages récents */}
          <div className="lotus-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Messages récents</h3>
              <Link
                to="/professional/messages"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                Voir tout
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Sarah M.', message: 'Merci pour la séance de yoga...', time: '2h' },
                { name: 'Ahmed K.', message: 'Disponibilité pour demain?', time: '4h' },
                { name: 'Fatima L.', message: 'Question sur les produits...', time: '1j' },
              ].map((msg, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-lotus rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">{msg.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{msg.name}</p>
                    <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full btn-secondary text-sm">Voir tous les messages</button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 lotus-card bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Optimisez votre profil professionnel
            </h3>
            <p className="text-gray-600 mb-4">
              Un profil complet attire plus de clients. Ajoutez vos photos, certifications et
              horaires.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/professional/profile" className="btn-primary">
                <EyeIcon className="h-4 w-4 mr-2" />
                Voir mon profil
              </Link>
              <Link to="/professional/settings" className="btn-secondary">
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
