import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  HeartIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { handleImageError } from '../../utils/imageUtils';
import ClientNavbar from '../client/ClientNavbar';
import ProfessionalNavbar from '../professional/ProfessionalNavbar';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const { isAuthenticated, user, _loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  // Render specific navbar based on user role
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return null; // Admin users should be redirected to admin dashboard
    } else if (user?.role === 'professional') {
      return <ProfessionalNavbar />;
    } else {
      return <ClientNavbar />;
    }
  }

  // Navigation items for non-connected users
  const publicNavigation = [
    { name: 'Accueil', href: '/', current: location.pathname === '/' },
    {
      name: 'Professionnels',
      href: '/professionals',
      current: location.pathname === '/professionals',
    },
    {
      name: 'Événements',
      href: '/events',
      current: location.pathname === '/events' || location.pathname.startsWith('/events/'),
      icon: CalendarDaysIcon,
    },
    { name: 'À propos', href: '/about', current: location.pathname === '/about' },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
  ];

  // Default header for non-authenticated users
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 w-full z-30">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-12 w-12 lotus-logo">
                <img
                  src="/logo.png"
                  alt="Logo Holistic.ma"
                  className="w-full h-full object-contain"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = '/logo.svg'; // Fallback vers le logo SVG
                  }}
                />
              </div>
              <span className="text-2xl font-serif font-bold text-gradient-lotus mr-8">
                Holistic.ma
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:flex-1 justify-center">
            <nav className="flex space-x-8">
              {publicNavigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors duration-200 flex items-center ${
                    item.current
                      ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                      : 'text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-300'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop user menu */}
          <div className="hidden lg:flex lg:items-center">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-lotus hover:shadow-lotus-hover transition-all duration-300"
            >
              Inscription
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-4 space-y-1">
              {publicNavigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    item.current
                      ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                      : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile user menu */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="mt-3 space-y-1">
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Inscription
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
