import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const RegisterProfessionalPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    profession: '',
    specializations: '',
    phone: '',
    businessName: '',
    businessType: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { registerProfessional, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = password => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate form data
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerProfessional(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.password,
        formData.profession,
        formData.specializations,
        formData.phone,
        formData.businessName,
        formData.businessType,
        formData.address
      );

      // Redirection directe vers le tableau de bord professionnel
      navigate('/dashboard/professional');
    } catch (err) {
      setError(err.message || "Échec de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      // Utiliser une redirection plus sécurisée avec des paramètres d'état
      const state = Math.random().toString(36).substring(7);
      // Stocker l'état dans localStorage pour vérification ultérieure
      localStorage.setItem('googleAuthState', state);
      const redirectUrl = `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/auth/google?role=professional&state=${state}`;
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err.message || "Échec de l'inscription avec Google.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* Logo Section */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img src="/logo.png" alt="Logo" className="h-16 w-16 lotus-logo" />
              <div className="absolute inset-0 rounded-full bg-gradient-lotus opacity-20 blur-md"></div>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gradient-lotus">
            Inscription Professionnelle
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              connectez-vous à votre compte existant
            </Link>
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

        <div className="bg-white rounded-xl shadow-lotus p-8 border border-gray-100 auth-form-container">
          <div className="flex flex-col space-y-4 mb-6">
            <button
              onClick={handleGoogleSignup}
              type="button"
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" width="24" height="24">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  />
                </g>
              </svg>
              {loading ? 'Inscription...' : "S'inscrire avec Google"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Ou avec email</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Section Informations personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nom
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="Numéro de téléphone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mot de passe
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="Mot de passe"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-full rounded-full transition-colors duration-200 ${
                                i < passwordStrength
                                  ? passwordStrength <= 2
                                    ? 'bg-red-500'
                                    : passwordStrength <= 3
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Force du mot de passe:{' '}
                          <span
                            className={
                              passwordStrength <= 2
                                ? 'text-red-600'
                                : passwordStrength <= 3
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }
                          >
                            {passwordStrength <= 2
                              ? 'Faible'
                              : passwordStrength <= 3
                                ? 'Moyenne'
                                : 'Forte'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`auth-input appearance-none relative block w-full px-4 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Confirmer le mot de passe"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Informations professionnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Informations professionnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="businessName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nom de l&apos;entreprise
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="Nom de votre entreprise"
                      value={formData.businessName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="businessType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Type d&apos;entreprise
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      className="auth-input block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                      value={formData.businessType}
                      onChange={handleChange}
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="coach">Coach</option>
                      <option value="therapist">Thérapeute</option>
                      <option value="nutritionist">Nutritionniste</option>
                      <option value="psychologist">Psychologue</option>
                      <option value="fitness">Fitness</option>
                      <option value="yoga">Yoga</option>
                      <option value="meditation">Méditation</option>
                      <option value="massage">Massage</option>
                      <option value="acupuncture">Acupuncture</option>
                      <option value="naturopathy">Naturopathie</option>
                      <option value="osteopathy">Ostéopathie</option>
                      <option value="beauty">Beauté</option>
                      <option value="wellness">Bien-être</option>
                      <option value="reiki">Reiki</option>
                      <option value="hypnotherapy">Hypnothérapie</option>
                      <option value="aromatherapy">Aromathérapie</option>
                      <option value="reflexology">Réflexologie</option>
                      <option value="sophrology">Sophrologie</option>
                      <option value="spa">Spa</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="profession"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Profession
                    </label>
                    <select
                      id="profession"
                      name="profession"
                      required
                      className="auth-input block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                      value={formData.profession}
                      onChange={handleChange}
                    >
                      <option value="">Sélectionnez une profession</option>
                      <option value="naturopathe">Naturopathe</option>
                      <option value="nutritionniste">Nutritionniste</option>
                      <option value="coach">Coach bien-être</option>
                      <option value="yoga">Professeur de yoga</option>
                      <option value="meditation">Instructeur de méditation</option>
                      <option value="psychologue">Psychologue</option>
                      <option value="masseur">Massothérapeute</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="specializations"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Spécialisations
                    </label>
                    <input
                      id="specializations"
                      name="specializations"
                      type="text"
                      className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                      placeholder="Séparées par des virgules"
                      value={formData.specializations}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse professionnelle
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="auth-input appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors duration-200"
                    placeholder="Adresse complète"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="auth-button group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-lotus hover:shadow-lotus-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? <LoadingSpinner size="small" /> : "S'inscrire en tant que professionnel"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Vous êtes un client ?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              Inscrivez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterProfessionalPage;
