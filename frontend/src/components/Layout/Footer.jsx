import React from 'react';
import { Link } from 'react-router-dom';

import { useSettings } from '../../contexts/SettingsContext';

const Footer = () => {
  const { siteName, getContactInfo } = useSettings();
  const contactInfo = getContactInfo();

  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">{siteName?.charAt(0) || 'H'}</span>
              </div>
              <span className="text-xl font-serif font-bold text-white">{siteName}</span>
            </Link>
            <p className="mt-4 text-gray-300 max-w-md">
              Votre plateforme de bien-être holistique. Connectez-vous avec les meilleurs
              professionnels du bien-être au Maroc.
            </p>
          </div>

          {/* Navigation links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/professionals"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Professionnels
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
            <div className="mt-4 space-y-2">
              <p className="text-gray-300">Email: {contactInfo.email}</p>
              <p className="text-gray-300">Téléphone: {contactInfo.phone}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-center text-gray-400">
            © {new Date().getFullYear()} {siteName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
