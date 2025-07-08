import axios from 'axios';

import apiConfig from '../config/api.config';

/**
 * API Service
 *
 * This service handles all API calls using axios
 */

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      // You could trigger a notification here
    }

    return Promise.reject(error);
  }
);

/**
 * General API methods
 */
const apiService = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} params - URL parameters
   * @returns {Promise} - Axios promise
   */
  get: (url, params = {}) => {
    return apiClient.get(url, { params });
  },

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - Axios promise
   */
  post: (url, data = {}) => {
    return apiClient.post(url, data);
  },

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - Axios promise
   */
  put: (url, data = {}) => {
    return apiClient.put(url, data);
  },

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @returns {Promise} - Axios promise
   */
  delete: url => {
    return apiClient.delete(url);
  },

  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - Axios promise
   */
  patch: (url, data = {}) => {
    return apiClient.patch(url, data);
  },

  /**
   * Upload file(s)
   * @param {string} url - API endpoint
   * @param {FormData} formData - Form data with files
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} - Axios promise
   */
  upload: (url, formData, onProgress = () => {}) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      },
    });
  },
};

export const getGlobalStats = async () => {
  try {
    const response = await axios.get('/api/stats/global');
    return response.data;
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
};

export default apiService;
