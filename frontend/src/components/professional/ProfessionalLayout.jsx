import React from 'react';
import { Outlet } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import ProfessionalNavbar from './ProfessionalNavbar';

const ProfessionalLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 shadow-lotus"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-red-500 mb-4 font-medium">
          Veuillez vous connecter pour accéder à cette page
        </div>
        <a
          href="/login"
          className="bg-gradient-lotus text-white px-6 py-2.5 rounded-lg hover:shadow-lotus-hover transition-all duration-300 font-medium"
        >
          Se connecter
        </a>
      </div>
    );
  }

  if (user.role !== 'professional') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-red-500 mb-4 font-medium">
          Vous n'avez pas les droits pour accéder à l'espace professionnel
        </div>
        <a
          href="/"
          className="bg-gradient-lotus text-white px-6 py-2.5 rounded-lg hover:shadow-lotus-hover transition-all duration-300 font-medium"
        >
          Retour à l'accueil
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Fixed navbar */}
      <ProfessionalNavbar />

      {/* Main content with padding for the fixed navbar */}
      <main className="pt-20 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 font-medium">
              &copy; {new Date().getFullYear()} Holistic.ma - Espace Professionnel
            </div>
            <div className="flex space-x-6 mt-3 md:mt-0">
              <a
                href="/terms"
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                Conditions d'utilisation
              </a>
              <a
                href="/privacy"
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                Politique de confidentialité
              </a>
              <a
                href="/contact"
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalLayout;
