import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { handleImageError } from '../../utils/imageUtils';

import NotificationsPanel from './NotificationsPanel';

const ProfessionalNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Function to build profile image URL like ProfilePage.jsx
  useEffect(() => {
    if (user?.profileImage) {
      const imageUrl = user.profileImage.startsWith('http')
        ? user.profileImage
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.profileImage}`;
      setProfileImageUrl(imageUrl);
    } else {
      setProfileImageUrl(null);
    }
  }, [user?.profileImage]);

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/dashboard/professional',
      icon: HomeIcon,
      current: location.pathname === '/dashboard/professional',
    },
    {
      name: 'Services',
      href: '/dashboard/professional/sessions',
      icon: CalendarDaysIcon,
      current: location.pathname.includes('/dashboard/professional/sessions'),
    },
    {
      name: 'Produits',
      href: '/dashboard/professional/products',
      icon: ShoppingBagIcon,
      current: location.pathname.includes('/dashboard/professional/products'),
    },
    {
      name: 'Messages',
      href: '/dashboard/professional/messages',
      icon: ChatBubbleLeftEllipsisIcon,
      current: location.pathname.includes('/dashboard/professional/messages'),
      badge: 0, // This should be updated dynamically with unread message count
    },
    {
      name: 'Notifications',
      href: '/dashboard/professional/notifications',
      icon: BellIcon,
      current: location.pathname.includes('/dashboard/professional/notifications'),
    },
    {
      name: 'Événements',
      href: '/dashboard/professional/events',
      icon: ClipboardDocumentListIcon,
      current: location.pathname.includes('/dashboard/professional/events'),
    },
    {
      name: 'Clients',
      href: '/dashboard/professional/clients',
      icon: UserIcon,
      current: location.pathname.includes('/dashboard/professional/clients'),
    },
    {
      name: 'Statistiques',
      href: '/dashboard/professional/analytics',
      icon: ChartBarIcon,
      current: location.pathname.includes('/dashboard/professional/analytics'),
    },
    {
      name: 'Paramètres',
      href: '/dashboard/professional/settings',
      icon: Cog6ToothIcon,
      current: location.pathname.includes('/dashboard/professional/settings'),
    },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-100 fixed top-0 w-full z-30 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard/professional" className="flex items-center space-x-2 lotus-logo">
                <img
                  className="h-9 w-auto"
                  src="/logo.png"
                  alt="Holistic"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = '/logo.svg';
                  }}
                />
                <span className="font-bold text-xl text-gradient-lotus tracking-tight">
                  Holistic Pro
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <nav className="flex space-x-2">
              {navigation.slice(0, 5).map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all duration-200 whitespace-nowrap ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 shadow-soft border border-primary-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-4 w-4 ${
                      item.current
                        ? 'text-primary-600'
                        : 'text-gray-400 group-hover:text-primary-500'
                    }`}
                  />
                  {item.name}
                  {item.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Menu déroulant pour les autres éléments */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center transition-all duration-200">
                <span>Plus</span>
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div className="absolute left-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block animate-fade-in z-50">
                <div className="py-1 rounded-lg overflow-hidden">
                  {navigation.slice(5).map(item => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                        item.current
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile and notifications */}
            <div className="flex items-center space-x-4">
              <NotificationsPanel user={user} />

              <div className="relative inline-block text-left group">
                <button className="flex items-center text-sm focus:outline-none space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                  <div className="relative">
                    {profileImageUrl ? (
                      <img
                        className="h-10 w-10 rounded-full border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 object-cover"
                        src={profileImageUrl}
                        alt={user?.fullName}
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-lotus flex items-center justify-center border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <UserCircleIcon className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="text-left hidden xl:block">
                    <span className="block text-sm font-semibold text-gray-900 truncate max-w-[140px]">
                      {user?.fullName}
                    </span>
                    <span className="block text-xs text-primary-600 font-medium">
                      Professionnel
                    </span>
                  </div>
                  <svg
                    className="hidden xl:block h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu - hover to show */}
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block animate-fade-in">
                  <div className="py-1 rounded-lg overflow-hidden">
                    <Link
                      to="/dashboard/professional/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      Mon profil
                    </Link>
                    <Link
                      to="/dashboard/professional/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      Paramètres
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <NotificationsPanel user={user} />

            <button
              className="ml-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white border-t border-gray-100 shadow-xl"
        >
          <div className="pt-4 pb-6 space-y-2 px-4 max-h-screen overflow-y-auto">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-base font-medium flex items-center transition-all duration-200 ${
                  item.current
                    ? 'bg-primary-50 text-primary-700 shadow-soft border border-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${item.current ? 'text-primary-600' : 'text-gray-400'}`}
                />
                {item.name}
                {item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="border-t border-gray-100 my-4"></div>

            <div className="flex items-center py-3 px-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {profileImageUrl ? (
                  <img
                    className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
                    src={profileImageUrl}
                    alt={user?.fullName}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-lotus flex items-center justify-center border-2 border-gray-200">
                    <UserCircleIcon className="h-7 w-7 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <div className="text-base font-semibold text-gray-900">{user?.fullName}</div>
                <div className="text-sm text-primary-600 font-medium">Professionnel</div>
              </div>
            </div>

            <Link
              to="/dashboard/professional/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center transition-all duration-200"
            >
              <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
              Mon profil
            </Link>

            <Link
              to="/dashboard/professional/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center transition-all duration-200"
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
              Paramètres
            </Link>

            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full mt-3 flex items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-400" />
              Déconnexion
            </button>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default ProfessionalNavbar;
