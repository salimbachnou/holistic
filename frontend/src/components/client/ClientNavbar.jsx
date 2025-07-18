import { motion } from 'framer-motion';
import {
  Home,
  Users,
  Calendar,
  ShoppingBag,
  CalendarDays,
  GraduationCap,
  Heart,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { handleImageError } from '../../utils/imageUtils';

import ClientNotificationsPanel from './ClientNotificationsPanel';

const ClientNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Function to build profile image URL like ProfilePage.jsx
  useEffect(() => {
    if (user?.profileImage) {
      const imageUrl = user.profileImage.startsWith('http')
        ? user.profileImage
        : `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${user.profileImage}`;
      setProfileImageUrl(imageUrl);
    } else {
      setProfileImageUrl(null);
    }
  }, [user?.profileImage]);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && isAdmin()) {
      navigate('/admin/dashboard');
    }
  }, [user, isAdmin, navigate]);

  // If user is admin, don't render the client navbar
  if (user && isAdmin()) {
    return null;
  }

  const navigation = [
    {
      name: 'Accueil',
      href: '/',
      icon: Home,
      current: location.pathname === '/',
    },
    {
      name: 'Professionnels',
      href: '/professionals',
      icon: Users,
      current: location.pathname === '/professionals',
    },
    {
      name: 'Événements',
      href: '/events',
      icon: Calendar,
      current: location.pathname === '/events' || location.pathname.startsWith('/events/'),
    },
    {
      name: 'Produits',
      href: '/products',
      icon: ShoppingBag,
      current: location.pathname === '/products',
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: GraduationCap,
      current: location.pathname === '/sessions',
    },
  ];

  return (
    <header className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-600 shadow-lg border-b border-pink-200 fixed top-0 w-full z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:bg-white/30 transition-all duration-200">
                  <img src="/logo.png" alt="Holistic.ma" className="h-10 w-10 object-contain" />
                </div>
                <span className="font-serif text-xl font-bold text-white tracking-tight drop-shadow-sm">
                  Holistic.ma
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-20">
            <nav className="flex space-x-1">
              {navigation.slice(0, 5).map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all duration-200 whitespace-nowrap group ${
                    item.current
                      ? 'bg-white/20 text-white shadow-sm border border-white/30 backdrop-blur-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-4 w-4 transition-colors duration-200 ${
                      item.current ? 'text-white' : 'text-white/60 group-hover:text-white/90'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* More menu dropdown */}
            {/* <div className="relative group">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center transition-all duration-200 group">
                <MoreHorizontal className="h-4 w-4 mr-1" />
                <span>Plus</span>
                <ChevronDown className="ml-1 h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
              </button>

              <div className="absolute left-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1 rounded-lg">
                  {navigation.slice(8).map(item => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center ${
                        item.current
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div> */}

            {/* Profile and notifications */}
            <div className="flex items-center space-x-3 ml-4">
              <ClientNotificationsPanel user={user} />

              <div className="relative group">
                <button className="flex items-center text-sm focus:outline-none space-x-3 p-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                  <div className="relative flex-shrink-0">
                    {profileImageUrl ? (
                      <img
                        className="h-10 w-10 rounded-full border-2 border-white/30 shadow-sm hover:shadow-md transition-all duration-200 object-cover"
                        src={profileImageUrl}
                        alt={user?.fullName}
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-sm hover:shadow-md transition-all duration-200">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="text-left hidden xl:block">
                    <span className="block text-sm font-semibold text-white truncate max-w-[140px]">
                      {user?.fullName || user?.firstName}
                    </span>
                    <span className="block text-xs text-white/70 font-medium">Client</span>
                  </div>
                  <ChevronDown className="hidden xl:block h-4 w-4 text-white/60 group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {/* Profile dropdown menu */}
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 divide-y divide-gray-100">
                  <div className="py-2 px-4 bg-pink-50 rounded-t-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName || user?.firstName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1 rounded-lg">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors duration-200"
                    >
                      <User className="mr-3 h-5 w-5 text-gray-500" />
                      Mon profil
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors duration-200"
                    >
                      <CalendarDays className="mr-3 h-5 w-5 text-gray-500" />
                      Mes réservations
                    </Link>
                    <Link
                      to="/messages"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors duration-200"
                    >
                      <MessageCircle className="mr-3 h-5 w-5 text-gray-500" />
                      Messages
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors duration-200"
                    >
                      <Heart className="mr-3 h-5 w-5 text-gray-500" />
                      Favoris
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                    >
                      <LogOut className="mr-3 h-5 w-5 text-red-400" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden space-x-2">
            <ClientNotificationsPanel user={user} />

            <button
              className="p-2 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
          className="lg:hidden bg-white border-t border-pink-200 shadow-xl"
        >
          <div className="pt-4 pb-6 space-y-1 px-4 max-h-[80vh] overflow-y-auto">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-3 rounded-lg text-base font-medium flex items-center ${
                  item.current
                    ? 'bg-pink-50 text-pink-700 shadow-sm border border-pink-100'
                    : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                } transition-all duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${item.current ? 'text-pink-600' : 'text-gray-400'}`}
                />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile profile menu */}
          <div className="pt-4 pb-6 border-t border-gray-100 bg-pink-50">
            <div className="flex items-center px-4 py-3 bg-white rounded-lg mx-4 shadow-sm">
              <div className="flex-shrink-0">
                {profileImageUrl ? (
                  <img
                    className="h-11 w-11 rounded-full border-2 border-pink-200 object-cover shadow-sm"
                    src={profileImageUrl}
                    alt={user?.fullName}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center border-2 border-pink-200 shadow-sm">
                    <User className="h-7 w-7 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <div className="text-base font-semibold text-gray-900">
                  {user?.fullName || user?.firstName}
                </div>
                <div className="text-sm text-pink-600 font-medium">Client</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 px-4">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:bg-white hover:text-pink-600 transition-all duration-200"
              >
                <User className="mr-3 h-5 w-5 text-gray-400" />
                Mon profil
              </Link>
              <Link
                to="/bookings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:bg-white hover:text-pink-600 transition-all duration-200"
              >
                <CalendarDays className="mr-3 h-5 w-5 text-gray-400" />
                Mes réservations
              </Link>
              <Link
                to="/sessions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:bg-white hover:text-pink-600 transition-all duration-200"
              >
                <GraduationCap className="mr-3 h-5 w-5 text-gray-400" />
                Mes sessions
              </Link>
              <Link
                to="/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:bg-white hover:text-pink-600 transition-all duration-200"
              >
                <Heart className="mr-3 h-5 w-5 text-gray-400" />
                Favoris
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full text-left px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-400" />
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
