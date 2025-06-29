import React from 'react';
import {
  FaLock,
  FaTimes,
  FaExclamationTriangle,
  FaChrome,
  FaEdge,
  FaFirefox,
  FaSafari,
  FaUndo,
} from 'react-icons/fa';

const GeolocationBlockedPrompt = ({ onDismiss }) => {
  const handleDismissClick = () => {
    if (onDismiss && typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  const handleResetLocationSettings = () => {
    try {
      // Supprimer le statut bloqué du localStorage
      localStorage.removeItem('locationBlocked');

      // Recharger la page pour demander à nouveau la permission
      window.location.reload();
    } catch (e) {
      console.error('Error resetting location settings:', e);
    }
  };

  // Detect browser
  const isBrowser = browserName => {
    const userAgent = navigator.userAgent.toLowerCase();
    switch (browserName) {
      case 'chrome':
        return userAgent.indexOf('chrome') > -1 && userAgent.indexOf('edg') === -1;
      case 'edge':
        return userAgent.indexOf('edg') > -1;
      case 'firefox':
        return userAgent.indexOf('firefox') > -1;
      case 'safari':
        return userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1;
      default:
        return false;
    }
  };

  // Get browser-specific instructions
  const getBrowserInstructions = () => {
    if (isBrowser('chrome')) {
      return (
        <div className="mt-4 border-l-4 border-yellow-300 pl-3 py-2">
          <h4 className="font-medium flex items-center">
            <FaChrome className="mr-2 text-blue-600" /> Pour Google Chrome :
          </h4>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              Cliquez sur l&apos;icône <strong>cadenas</strong> <FaLock className="inline" /> dans
              la barre d&apos;adresse
            </li>
            <li>
              Sélectionnez <strong>Paramètres du site</strong>
            </li>
            <li>
              Sous <strong>Permissions</strong>, trouvez <strong>Localisation</strong>
            </li>
            <li>
              Changez le paramètre de <strong>Bloquer</strong> à <strong>Demander</strong> ou{' '}
              <strong>Autoriser</strong>
            </li>
            <li>Rafraîchissez la page</li>
          </ol>
        </div>
      );
    } else if (isBrowser('edge')) {
      return (
        <div className="mt-4 border-l-4 border-blue-300 pl-3 py-2">
          <h4 className="font-medium flex items-center">
            <FaEdge className="mr-2 text-blue-600" /> Pour Microsoft Edge :
          </h4>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              Cliquez sur l&apos;icône <strong>cadenas</strong> <FaLock className="inline" /> dans
              la barre d&apos;adresse
            </li>
            <li>
              Sélectionnez <strong>Autorisations du site</strong>
            </li>
            <li>
              Trouvez <strong>Localisation</strong> et modifiez le paramètre
            </li>
            <li>Rafraîchissez la page</li>
          </ol>
        </div>
      );
    } else if (isBrowser('firefox')) {
      return (
        <div className="mt-4 border-l-4 border-orange-300 pl-3 py-2">
          <h4 className="font-medium flex items-center">
            <FaFirefox className="mr-2 text-orange-500" /> Pour Firefox :
          </h4>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              Cliquez sur l&apos;icône <strong>i</strong> dans la barre d&apos;adresse
            </li>
            <li>
              Cliquez sur <strong>Plus d&apos;informations</strong>
            </li>
            <li>
              Allez dans l&apos;onglet <strong>Permissions</strong>
            </li>
            <li>
              Trouvez <strong>Accéder à votre localisation</strong> et modifiez le paramètre
            </li>
            <li>Rafraîchissez la page</li>
          </ol>
        </div>
      );
    } else if (isBrowser('safari')) {
      return (
        <div className="mt-4 border-l-4 border-blue-300 pl-3 py-2">
          <h4 className="font-medium flex items-center">
            <FaSafari className="mr-2 text-blue-500" /> Pour Safari :
          </h4>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              Ouvrez <strong>Préférences</strong> &gt; <strong>Sites web</strong>
            </li>
            <li>
              Sélectionnez <strong>Localisation</strong> dans le menu de gauche
            </li>
            <li>Trouvez ce site et modifiez le paramètre</li>
            <li>Rafraîchissez la page</li>
          </ol>
        </div>
      );
    } else {
      return (
        <div className="mt-4 border-l-4 border-gray-300 pl-3 py-2">
          <h4 className="font-medium">Pour votre navigateur :</h4>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>Accédez aux paramètres de votre navigateur</li>
            <li>Recherchez les paramètres de confidentialité ou de localisation</li>
            <li>Autorisez ce site à accéder à votre localisation</li>
            <li>Rafraîchissez la page</li>
          </ol>
        </div>
      );
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 relative">
      <button
        type="button"
        onClick={handleDismissClick}
        className="absolute top-2 right-2 text-yellow-400 hover:text-yellow-600"
        aria-label="Fermer"
      >
        <FaTimes />
      </button>

      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Localisation bloquée par le navigateur
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Votre navigateur a bloqué les demandes de localisation pour ce site. Pour activer la
              localisation, vous devez modifier les paramètres de votre navigateur :
            </p>

            {getBrowserInstructions()}

            <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-blue-700">
                Après avoir modifié ces paramètres, actualisez la page et essayez à nouveau la
                géolocalisation.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Rafraîchir la page
            </button>
            <button
              type="button"
              onClick={handleResetLocationSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaUndo className="mr-2" /> Réinitialiser le statut de localisation
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

export default GeolocationBlockedPrompt;
