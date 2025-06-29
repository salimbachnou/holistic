import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const AuthCallbackPage = () => {
  const { handleAuthCallback } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      window.location.href = '/login?error=' + error;
      return;
    }

    if (token) {
      handleAuthCallback(token)
        .then(() => {
          // Redirect to home page after successful authentication
          window.location.href = '/';
        })
        .catch(error => {
          console.error('Auth callback error:', error);
          window.location.href = '/login?error=authentication_failed';
        });
    } else {
      window.location.href = '/login';
    }
  }, [searchParams, handleAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
