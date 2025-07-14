import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import AdminNotificationsPanel from './AdminNotificationsPanel';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/admin/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/admin/dashboard',
    },
    {
      name: 'Professionnels',
      href: '/admin/professionals',
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/admin/professionals'),
      count: 0, // Can be populated with actual counts
    },
    {
      name: 'Clients',
      href: '/admin/clients',
      icon: UsersIcon,
      current: location.pathname.startsWith('/admin/clients'),
    },
    {
      name: 'Contacts',
      href: '/admin/contacts',
      icon: EnvelopeIcon,
      current: location.pathname.startsWith('/admin/contacts'),
      count: 0, // Can show pending contacts
    },
    {
      name: 'Produits',
      href: '/admin/products',
      icon: ShoppingBagIcon,
      current: location.pathname.startsWith('/admin/products'),
    },
    {
      name: 'Commandes',
      href: '/admin/orders',
      icon: ClipboardDocumentListIcon,
      current: location.pathname.startsWith('/admin/orders'),
    },
    {
      name: 'Réservations',
      href: '/admin/bookings',
      icon: CalendarDaysIcon,
      current: location.pathname.startsWith('/admin/bookings'),
    },
    {
      name: 'Événements',
      href: '/admin/events',
      icon: Squares2X2Icon,
      current: location.pathname.startsWith('/admin/events'),
    },
    {
      name: 'Sessions',
      href: '/admin/sessions',
      icon: CalendarDaysIcon,
      current: location.pathname.startsWith('/admin/sessions'),
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: BellIcon,
      current: location.pathname.startsWith('/admin/notifications'),
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      current: location.pathname.startsWith('/admin/analytics'),
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      current: location.pathname.startsWith('/admin/settings'),
    },
  ];

  // Filter navigation based on search term
  const filteredNavigation = navigation.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white shadow-2xl">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-lotus relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>

            <div className="flex items-center space-x-3 relative z-10">
              <div className="relative">
                <ShieldCheckIcon className="h-8 w-8 text-white drop-shadow-sm" />
                <div className="absolute inset-0 h-8 w-8 bg-white/20 rounded-full blur-md"></div>
              </div>
              <span className="text-xl font-bold text-white drop-shadow-sm">Admin Holistic</span>
            </div>
          </div>

          {/* Admin info */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-lotus flex items-center justify-center shadow-md">
                  <span className="text-lg font-semibold text-white">
                    {user.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mt-1">
                  Administrateur
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                    item.current
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  {item.current && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-lotus rounded-r-full"></div>
                  )}
                  <Icon
                    className={`mr-3 h-5 w-5 transition-colors duration-200 flex-shrink-0 ${
                      item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.count > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs rounded-full px-2 py-1 font-medium shadow-sm flex-shrink-0">
                      {item.count}
                    </span>
                  )}
                  {item.current && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full shadow-sm flex-shrink-0"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 border border-transparent hover:border-red-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200 flex-shrink-0" />
              <span className="truncate">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform lg:hidden"
      >
        <div className="flex h-full flex-col">
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-lotus relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>

            <div className="flex items-center space-x-3 relative z-10">
              <div className="relative">
                <ShieldCheckIcon className="h-8 w-8 text-white drop-shadow-sm" />
                <div className="absolute inset-0 h-8 w-8 bg-white/20 rounded-full blur-md"></div>
              </div>
              <span className="text-xl font-bold text-white drop-shadow-sm">Admin Holistic</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 relative z-10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile admin info */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-lotus flex items-center justify-center shadow-md">
                  <span className="text-lg font-semibold text-white">
                    {user.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mt-1">
                  Administrateur
                </span>
              </div>
            </div>
          </div>

          {/* Mobile search */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all duration-200 bg-white"
              />
            </div>
          </div>

          {/* Mobile navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                    item.current
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.current && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-lotus rounded-r-full"></div>
                  )}
                  <Icon
                    className={`mr-3 h-5 w-5 transition-colors duration-200 flex-shrink-0 ${
                      item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.count > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs rounded-full px-2 py-1 font-medium shadow-sm flex-shrink-0">
                      {item.count}
                    </span>
                  )}
                  {item.current && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full shadow-sm flex-shrink-0"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile logout button */}
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 border border-transparent hover:border-red-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200 flex-shrink-0" />
              <span className="truncate">Déconnexion</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Desktop search */}
              <div className="hidden md:block">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2.5 w-80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all duration-200 bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <AdminNotificationsPanel user={user} />

              <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

              <div className="hidden sm:flex items-center text-sm">
                <span className="text-gray-500">Connecté en tant qu'</span>
                <span className="font-semibold text-primary-700 ml-1">Administrateur</span>
              </div>

              <div className="w-8 h-8 rounded-lg bg-gradient-lotus flex items-center justify-center shadow-sm">
                <span className="text-xs font-semibold text-white">
                  {user.fullName?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-gray-200/60 bg-white/90 backdrop-blur-sm"
              >
                <div className="px-4 py-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
