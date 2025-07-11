import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { authAPI, handleAPIError } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('AuthContext: checking auth status, token exists:', !!token);

      if (!token) {
        setLoading(false);
        return;
      }

      // Set default authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await authAPI.getCurrentUser();
      console.log('AuthContext: getCurrentUser response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setAuthError(null);
        console.log('AuthContext: user authenticated:', response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      // Only remove token if it's an authentication error (401)
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
        setAuthError('Session expirée. Veuillez vous reconnecter.');
      } else {
        // For other errors, keep the token and user state
        console.warn('Non-auth error during auth check:', error);
        // Try to keep the user logged in if possible
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      // Si l'utilisateur n'a pas fourni de nom de famille, utiliser le prénom comme nom de famille
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`,
        {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email,
          password,
        }
      );

      if (response.data && response.data.token) {
        login(response.data.token, response.data.user);
        toast.success('Inscription réussie !');
        return response.data.user;
      } else {
        throw new Error("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorInfo = handleAPIError(error);
      throw new Error(errorInfo.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Register professional user
  const registerProfessional = async (
    name,
    email,
    password,
    profession,
    specializations,
    phone,
    businessName,
    businessType,
    address
  ) => {
    try {
      setLoading(true);
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      // Si l'utilisateur n'a pas fourni de nom de famille, utiliser le prénom comme nom de famille
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register/professional`,
        {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email,
          password,
          profession,
          specializations,
          phone,
          businessName,
          businessType,
          address,
        }
      );

      if (response.data && response.data.token) {
        login(response.data.token, response.data.user);
        toast.success('Inscription professionnelle réussie !');
        return response.data.user;
      } else {
        throw new Error("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Professional registration error:', error);
      const errorInfo = handleAPIError(error);
      throw new Error(errorInfo.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData = null) => {
    localStorage.setItem('token', token);

    // Set default authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setIsAuthenticated(true);
    setAuthError(null);

    if (userData) {
      setUser(userData);
      toast.success(`Bienvenue, ${userData.fullName}!`);
    } else {
      // Fetch user data if not provided
      checkAuthStatus();
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Déconnexion réussie');
      window.location.href = '/';
    }
  };

  const updateUser = userData => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData,
    }));
  };

  const refreshUserData = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      console.error('Failed to refresh user data:', errorInfo);
      throw error;
    }
  };

  // Handle authentication callback from OAuth
  const handleAuthCallback = async token => {
    if (token) {
      // Stocker le token d'abord
      localStorage.setItem('token', token);

      // Set default authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setIsAuthenticated(true);
      setAuthError(null);

      try {
        // Récupérer les données utilisateur avec le nouveau token
        const response = await authAPI.getCurrentUser();
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          toast.success(`Bienvenue, ${userData.fullName}!`);
          return userData;
        }
      } catch (error) {
        console.error('Failed to get user data after OAuth:', error);
        throw error;
      }
    } else {
      throw new Error('No token received from OAuth provider');
    }
  };

  // Handle login with email and password
  const loginWithCredentials = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`,
        { email, password }
      );

      if (response.data && response.data.token) {
        login(response.data.token, response.data.user);
        return response.data;
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorInfo = handleAPIError(error);
      throw new Error(errorInfo.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = (isProfessional = false) => {
    try {
      authAPI.getGoogleAuthUrl(isProfessional).then(response => {
        if (response.data && response.data.url) {
          // Store the state in localStorage for CSRF protection
          if (response.data.state) {
            localStorage.setItem('googleAuthState', response.data.state);
          }
          window.location.href = response.data.url;
        } else {
          toast.error('Erreur lors de la connexion avec Google');
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Erreur lors de la connexion avec Google');
    }
  };

  // Check if user is professional
  const isProfessional = () => {
    return user && user.role === 'professional';
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        authError,
        register,
        registerProfessional,
        login,
        logout,
        loginWithCredentials,
        loginWithGoogle,
        updateUser,
        refreshUserData,
        handleAuthCallback,
        isProfessional,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
