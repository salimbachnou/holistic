import {
  Bars3Icon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  HomeIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
  AcademicCapIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { handleImageError } from '../../utils/imageUtils';

import ClientNotificationsPanel from './ClientNotificationsPanel';

const ClientNavbar = () => {
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
      name: 'Accueil',
      href: '/',
      icon: HomeIcon,
      current: location.pathname === '/',
    },
    {
      name: 'Professionnels',
      href: '/professionals',
      icon: UserCircleIcon,
      current: location.pathname === '/professionals',
    },
    {
      name: 'Événements',
      href: '/events',
      icon: CalendarDaysIcon,
      current: location.pathname === '/events' || location.pathname.startsWith('/events/'),
    },
    {
      name: 'Produits',
      href: '/products',
      icon: ShoppingBagIcon,
      current: location.pathname === '/products',
    },
    {
      name: 'Mes réservations',
      href: '/bookings',
      icon: CalendarDaysIcon,
      current: location.pathname === '/bookings',
    },
    {
      name: 'Mes sessions',
      href: '/sessions',
      icon: AcademicCapIcon,
      current: location.pathname === '/sessions',
    },
    {
      name: 'Favoris',
      href: '/favorites',
      icon: HeartIcon,
      current: location.pathname === '/favorites',
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: ChatBubbleLeftEllipsisIcon,
      current: location.pathname.includes('/messages'),
    },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 w-full z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2 lotus-logo">
                <img
                  className="h-10 w-auto"
                  src="/logo.png"
                  alt="Holistic"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = '/logo.svg';
                  }}
                />
                <span className="font-serif text-xl font-bold text-gradient-lotus">
                  Holistic.ma
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <nav className="flex space-x-2">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-300 ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600 hover:shadow-sm'
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-5 w-5 ${
                      item.current
                        ? 'text-primary-600'
                        : 'text-gray-500 group-hover:text-primary-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Profile and notifications */}
            <div className="flex items-center space-x-4 ml-4">
              <ClientNotificationsPanel user={user} />

              <div className="relative inline-block text-left group">
                <button className="flex items-center text-sm focus:outline-none space-x-2 focus-visible bg-gray-50 rounded-full pl-2 pr-4 py-1.5 hover:bg-gray-100 transition-all duration-300">
                  <div className="relative">
                    {profileImageUrl ? (
                      <img
                        className="h-9 w-9 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 object-cover"
                        src={profileImageUrl}
                        alt={user?.fullName}
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-lotus flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <UserCircleIcon className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border border-white animate-pulse"></div>
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="block text-sm font-medium text-gray-800 truncate max-w-[120px]">
                      {user?.fullName || user?.firstName}
                    </span>
                    <span className="block text-xs text-primary-600 font-medium">Client</span>
                  </div>
                </button>

                {/* Dropdown menu - hover to show */}
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block animate-fade-in divide-y divide-gray-100">
                  <div className="py-2 px-4 bg-gray-50 rounded-t-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName || user?.firstName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1 rounded-lg overflow-hidden">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      <UserCircleIcon className="mr-3 h-5 w-5 text-gray-500" />
                      Mon profil
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      <CalendarDaysIcon className="mr-3 h-5 w-5 text-gray-500" />
                      Mes réservations
                    </Link>
                    <Link
                      to="/sessions"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      <AcademicCapIcon className="mr-3 h-5 w-5 text-gray-500" />
                      Mes sessions
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                    >
                      <HeartIcon className="mr-3 h-5 w-5 text-gray-500" />
                      Favoris
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-3 h-5 w-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <ClientNotificationsPanel user={user} />

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
          className="lg:hidden bg-white border-t border-gray-200 shadow-inner overflow-hidden"
        >
          <div className="pt-3 pb-4 space-y-1 px-4">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-4 py-3 rounded-lg text-base font-medium flex items-center ${
                  item.current
                    ? 'bg-primary-50 text-primary-700 shadow-inner'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                } transition-all duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`mr-4 h-5 w-5 ${item.current ? 'text-primary-600' : 'text-gray-500'}`}
                />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile profile menu */}
          <div className="pt-4 pb-5 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center px-4 py-2">
              <div className="flex-shrink-0">
                {profileImageUrl ? (
                  <img
                    className="h-11 w-11 rounded-full border-2 border-white shadow-md"
                    src={profileImageUrl}
                    alt={user?.fullName}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-gradient-lotus flex items-center justify-center border-2 border-white shadow-md">
                    <UserCircleIcon className="h-7 w-7 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.fullName || user?.firstName}
                </div>
                <div className="text-sm font-medium text-primary-600">Client</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <Link
                to="/profile"
                className="flex items-center px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-white hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserCircleIcon className="mr-4 h-5 w-5 text-gray-500" />
                Mon profil
              </Link>
              <Link
                to="/bookings"
                className="flex items-center px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-white hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CalendarDaysIcon className="mr-4 h-5 w-5 text-gray-500" />
                Mes réservations
              </Link>
              <Link
                to="/sessions"
                className="flex items-center px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-white hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AcademicCapIcon className="mr-4 h-5 w-5 text-gray-500" />
                Mes sessions
              </Link>
              <Link
                to="/favorites"
                className="flex items-center px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-white hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HeartIcon className="mr-4 h-5 w-5 text-gray-500" />
                Favoris
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full text-left px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-white hover:text-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-4 h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default ClientNavbar;
