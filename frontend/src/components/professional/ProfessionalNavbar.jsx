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
    <header className="bg-white shadow-md border-b border-gray-200 fixed top-0 w-full z-30">
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
                <span className="font-semibold text-lg text-gradient-lotus">Holistic Pro</span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <nav className="flex space-x-4">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200 ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 shadow-soft'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-5 w-5 ${
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

            {/* Profile and notifications */}
            <div className="flex items-center space-x-4">
              <NotificationsPanel user={user} />

              <div className="relative inline-block text-left group">
                <button className="flex items-center text-sm focus:outline-none space-x-2 focus-visible">
                  <div className="relative">
                    {profileImageUrl ? (
                      <img
                        className="h-9 w-9 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                        src={profileImageUrl}
                        alt={user?.fullName}
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-lotus flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <UserCircleIcon className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border border-white animate-pulse-lotus"></div>
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="block text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {user?.fullName}
                    </span>
                    <span className="block text-xs text-primary-600">Professionnel</span>
                  </div>
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
          className="lg:hidden bg-white border-t border-gray-200 shadow-inner"
        >
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2.5 rounded-md text-base font-medium flex items-center ${
                  item.current
                    ? 'bg-primary-50 text-primary-700 shadow-soft'
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

            <div className="border-t border-gray-200 my-3"></div>

            <div className="flex items-center py-2">
              <div className="flex-shrink-0">
                {profileImageUrl ? (
                  <img
                    className="h-10 w-10 rounded-full border border-gray-200"
                    src={profileImageUrl}
                    alt={user?.fullName}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-lotus flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.fullName}</div>
                <div className="text-sm text-primary-600">Professionnel</div>
              </div>
            </div>

            <Link
              to="/dashboard/professional/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center"
            >
              <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
              Mon profil
            </Link>

            <Link
              to="/dashboard/professional/settings"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center"
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
              Paramètres
            </Link>

            <button
              onClick={logout}
              className="w-full mt-2 flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
              Déconnexion
            </button>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default ProfessionalNavbar;
