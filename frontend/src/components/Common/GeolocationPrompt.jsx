import React from 'react';
import { FaMapMarkerAlt, FaTimes, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const GeolocationPrompt = ({ onRetry, onDismiss }) => {
  const handleRetryClick = () => {
    if (onRetry && typeof onRetry === 'function') {
      onRetry();
    }
  };

  const handleDismissClick = () => {
    if (onDismiss && typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      <button
        type="button"
        onClick={handleDismissClick}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
        aria-label="Fermer"
      >
        <FaTimes />
      </button>

      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <FaExclamationTriangle className="h-5 w-5 text-orange-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">Localisation non disponible</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              Pour voir les professionnels proches de vous, veuillez activer la localisation dans
              votre navigateur:
            </p>
            <div className="mt-4 border-l-4 border-blue-300 pl-3 py-2">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Cliquez sur l&apos;icône</strong> de cadenas ou de localisation
                  <span className="inline-block mx-1 px-1 bg-gray-100 rounded">
                    <FaMapMarkerAlt className="inline text-gray-600 mr-1" />
                  </span>
                  dans la barre d&apos;adresse
                </li>
                <li>
                  <strong>Sélectionnez &quot;Autoriser&quot;</strong> ou &quot;Toujours
                  autoriser&quot; pour ce site
                </li>
                <li>
                  <strong>Rechargez la page</strong> après avoir modifié les paramètres
                </li>
              </ol>
            </div>

            <div className="mt-4 bg-green-50 p-3 rounded border border-green-200">
              <div className="flex items-center">
                <FaCheck className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">
                  Après activation, vous verrez les professionnels les plus proches de votre
                  emplacement
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              onClick={handleRetryClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Réessayer avec la localisation
            </button>
            <button
              type="button"
              onClick={handleDismissClick}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continuer sans localisation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationPrompt;
