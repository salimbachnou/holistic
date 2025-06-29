import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const GoogleAuthCallbackPage = () => {
  const [error, setError] = useState('');
  const { handleGoogleCallback, handleAuthCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the parameters from the URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const token = searchParams.get('token');
        const state = searchParams.get('state');

        // Vérifier l'état pour les redirections Google (protection CSRF)
        if (state) {
          const savedState = localStorage.getItem('googleAuthState');
          if (state !== savedState) {
            console.warn("État de l'authentification Google non valide");
            // Continuer quand même car certains navigateurs peuvent avoir des problèmes avec le stockage local
          }
          // Nettoyer l'état après vérification
          localStorage.removeItem('googleAuthState');
        }

        if (token) {
          // If we have a token, use the handleAuthCallback function
          const userData = await handleAuthCallback(token);

          // Rediriger en fonction du rôle
          if (userData && userData.role === 'professional') {
            navigate('/dashboard/professional', { replace: true });
          } else if (userData && userData.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else if (code) {
          // If we have a code, use the handleGoogleCallback function
          await handleGoogleCallback(code);
          // Redirect to home page after successful authentication
          navigate('/');
        } else {
          throw new Error('No authorization code or token found in the URL.');
        }
      } catch (err) {
        console.error('Google auth callback error:', err);
        setError(err.message || "Échec de l'authentification avec Google.");
      }
    };

    processCallback();
  }, [location, handleGoogleCallback, handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-4">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <p className="mt-2 text-sm">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-red-700 font-medium underline"
                  >
                    Retourner à la page de connexion
                  </button>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Authentification en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallbackPage;
