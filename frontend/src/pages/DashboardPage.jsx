import React from 'react';

import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bonjour {user?.firstName}!</h1>
          <p className="mt-4 text-lg text-gray-600">Bienvenue sur votre tableau de bord</p>
          <p className="mt-4 text-gray-500">Dashboard client en cours de développement...</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
