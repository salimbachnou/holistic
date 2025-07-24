import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { handleImageError } from '../../utils/imageUtils';
import ClientNavbar from '../client/ClientNavbar';
import ProfessionalNavbar from '../professional/ProfessionalNavbar';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const { isAuthenticated, user, _loginWithGoogle, logout } = useAuth();
  const { siteName, logoUrl } = useSettings();
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
    },
    { name: 'À propos', href: '/about', current: location.pathname === '/about' },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
  ];

  // Default header for non-authenticated users
  return (
    <header className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-600 shadow-lg border-b border-pink-200 fixed top-0 w-full z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:bg-white/30 transition-all duration-200">
                <img src={logoUrl} alt={siteName} className="h-10 w-10 object-contain" />
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-tight drop-shadow-sm">
                {siteName}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-40">
            <nav className="flex space-x-1">
              {publicNavigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all duration-200 whitespace-nowrap group ${
                    item.current
                      ? 'bg-white/20 text-white shadow-sm border border-white/30 backdrop-blur-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-all duration-200 flex items-center"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white text-purple-600 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
              >
                Inscription
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-pink-200 shadow-xl">
            <div className="pt-4 pb-6 space-y-1 px-4">
              {publicNavigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-3 rounded-lg text-base font-medium flex items-center ${
                    item.current
                      ? 'bg-pink-50 text-pink-700 shadow-sm border border-pink-100'
                      : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                  } transition-all duration-200`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-4"></div>

              {/* Mobile auth buttons */}
              <Link
                to="/login"
                className="block px-4 py-3.5 rounded-lg text-base font-medium bg-pink-50/50 text-pink-700 hover:bg-pink-50 transition-all duration-200 text-center"
                onClick={() => setIsOpen(false)}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="block px-4 py-3.5 rounded-lg text-base font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-all duration-200 text-center shadow-sm hover:shadow-md"
                onClick={() => setIsOpen(false)}
              >
                Inscription
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
