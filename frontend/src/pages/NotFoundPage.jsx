import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">Page non trouvée</h2>
        <p className="mt-2 text-lg text-gray-600">
          Désolé, nous n'avons pas trouvé la page que vous cherchez.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
