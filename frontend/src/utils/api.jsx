import axios from 'axios';

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Skip refresh token for delete account request
    if (originalRequest.url === '/users/me' && originalRequest.method === 'delete') {
      return Promise.reject(error);
    }

    // If token is expired, try to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.post('/auth/refresh');
          const newToken = response.data.token;
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Get current user
  getCurrentUser: () => api.get('/auth/me/jwt'),

  // Logout
  logout: () => api.post('/auth/logout'),

  // Refresh token
  refreshToken: () => api.post('/auth/refresh'),

  // Check auth status
  checkAuthStatus: () => api.get('/auth/status'),

  // Resend verification email
  resendVerificationEmail: () => api.post('/auth/verify/resend'),

  // Verify email with token or code
  verifyEmail: data => api.post('/auth/verify/email', data),
};

// Contact API functions
export const contactAPI = {
  // Submit professional account request
  submitProfessionalRequest: data => api.post('/contact/professional-request', data),

  // Submit information request
  submitInformationRequest: data => api.post('/contact/information-request', data),

  // Get activity types
  getActivityTypes: () => api.get('/contact/activity-types'),

  // Get subscription plans
  getPlans: () => api.get('/contact/plans'),
};

// User API functions
export const userAPI = {
  // Get user profile
  getProfile: () => api.get('/users/profile'),

  // Update user profile
  updateProfile: data => api.put('/users/profile', data),

  // Update preferences
  updatePreferences: data => api.put('/users/preferences', data),

  // Delete account
  deleteAccount: () => api.delete('/users/me'),

  // Get user statistics
  getStats: () => api.get('/users/stats'),
};

// Professional API functions
export const professionalAPI = {
  // Get all professionals (public)
  getProfessionals: params => api.get('/professionals', { params }),

  // Get professional by ID (public)
  getProfessional: id => api.get(`/professionals/${id}`),

  // Get current professional profile
  getMyProfile: () => api.get('/professionals/me/profile'),

  // Create professional profile
  createProfile: data => api.post('/professionals/profile', data),

  // Update professional profile
  updateProfile: data => api.put('/professionals/profile', data),

  // Add service
  addService: data => api.post('/professionals/services', data),

  // Update service
  updateService: (serviceId, data) => api.put(`/professionals/services/${serviceId}`, data),

  // Delete service
  deleteService: serviceId => api.delete(`/professionals/services/${serviceId}`),

  // Get professional statistics
  getStats: () => api.get('/professionals/me/stats'),
};

// General API functions
export const generalAPI = {
  // Health check
  healthCheck: () => api.get('/health'),
};

// Error handling utility
export const handleAPIError = error => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Une erreur est survenue';
    return {
      message,
      status: error.response.status,
      errors: error.response.data?.errors || [],
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Problème de connexion au serveur',
      status: 0,
      errors: [],
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'Une erreur inattendue est survenue',
      status: 0,
      errors: [],
    };
  }
};

// Upload utility (if needed for file uploads)
export const uploadAPI = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
};

export default api;
