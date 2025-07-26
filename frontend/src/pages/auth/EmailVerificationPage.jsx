import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const EmailVerificationPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or URL params
  const email = location.state?.email || new URLSearchParams(location.search).get('email');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerificationCodeChange = e => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setError('Le code de vérification doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-email`,
        {
          email,
          code: verificationCode,
        }
      );

      if (response.data.success) {
        setSuccess(true);

        // Auto-login the user
        if (response.data.token) {
          login(response.data.token, response.data.user);

          // Redirect based on user role
          setTimeout(() => {
            if (response.data.user.role === 'professional') {
              navigate('/dashboard/professional');
            } else if (response.data.user.role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              navigate('/');
            }
          }, 2000);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Erreur lors de la vérification. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/resend-verification`,
        { email }
      );

      if (response.data.success) {
        setCountdown(60); // 60 seconds cooldown
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'envoi du code. Veuillez réessayer."
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo Section */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img src="/logo.png" alt="Logo" className="h-16 w-16 lotus-logo" />
              <div className="absolute inset-0 rounded-full bg-gradient-lotus opacity-20 blur-md"></div>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gradient-lotus">
            {success ? 'Vérification réussie !' : 'Vérification de votre email'}
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            {success
              ? 'Votre compte a été vérifié avec succès. Vous allez être redirigé...'
              : `Nous avons envoyé un code de vérification à ${email}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
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
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">
                  Votre email a été vérifié avec succès !
                </p>
              </div>
            </div>
          </div>
        )}

        {!success && (
          <div className="bg-white rounded-xl shadow-lotus p-8 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Code de vérification
                </label>
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  maxLength={6}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-600 text-center">
                  Entrez le code à 6 chiffres envoyé à votre email
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-lotus hover:shadow-lotus-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? <LoadingSpinner size="small" /> : 'Vérifier le code'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Vous n'avez pas reçu le code ?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading || countdown > 0}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {resendLoading ? (
                  <LoadingSpinner size="small" />
                ) : countdown > 0 ? (
                  `Renvoyer le code (${countdown}s)`
                ) : (
                  'Renvoyer le code'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              Retour à la connexion
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
