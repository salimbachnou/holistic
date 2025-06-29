import apiService from './api.service';

/**
 * Authentication Service
 *
 * Handles user authentication, registration, and profile management
 */
const authService = {
  /**
   * User login
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise} - API response
   */
  login: async (email, password, rememberMe = false) => {
    const response = await apiService.post('/auth/login', {
      email,
      password,
      rememberMe,
    });

    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response.data;
  },

  /**
   * User registration
   * @param {string} name - User's full name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - API response
   */
  register: async (name, email, password) => {
    const response = await apiService.post('/auth/register', {
      name,
      email,
      password,
    });

    return response.data;
  },

  /**
   * Professional registration
   * @param {string} name - Professional's full name
   * @param {string} email - Professional email
   * @param {string} password - Professional password
   * @param {string} profession - Professional type
   * @param {string} specializations - Professional specializations
   * @param {string} phone - Professional phone number
   * @param {string} businessName - Business name
   * @param {string} businessType - Business type
   * @param {string} address - Business address
   * @returns {Promise} - API response
   */
  registerProfessional: async (
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
    const response = await apiService.post('/auth/register/professional', {
      name,
      email,
      password,
      profession,
      specializations,
      phone,
      businessName,
      businessType,
      address,
    });

    return response.data;
  },

  /**
   * User logout
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // You could also call an API endpoint to invalidate the token on the server
    // return apiService.post('/auth/logout');
  },

  /**
   * Get the current user
   * @returns {Object|null} - User object or null if not logged in
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  },

  /**
   * Check if the user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise} - API response
   */
  sendPasswordResetEmail: async email => {
    const response = await apiService.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password
   * @param {string} email - User email
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} - API response
   */
  resetPassword: async (email, token, password) => {
    const response = await apiService.post('/auth/reset-password', {
      email,
      token,
      password,
    });

    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise} - API response
   */
  updateProfile: async userData => {
    const response = await apiService.put('/users/profile', userData);

    if (response.data && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },
};

export default authService;
