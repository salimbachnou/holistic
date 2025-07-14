import axios from 'axios';

// Create an instance of axios with a base URL for API calls
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  config => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // You can handle specific error status codes here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      switch (error.response.status) {
        case 401:
          // Handle unauthorized (e.g., redirect to login)
          // Optional: Redirect to login or clear tokens
          break;
        case 404:
          // Resource not found
          break;
        case 500:
          // Server error
          break;
        default:
          break;
      }
    }

    return Promise.reject(error);
  }
);

// Helper methods for common API operations
const apiService = {
  // Get request
  get: async (endpoint, params = {}) => {
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // Post request
  post: async (endpoint, data = {}) => {
    const response = await api.post(endpoint, data);
    return response.data;
  },

  // Put request
  put: async (endpoint, data = {}) => {
    const response = await api.put(endpoint, data);
    return response.data;
  },
  // Delete request
  delete: async endpoint => {
    const response = await api.delete(endpoint);
    return response.data;
  },

  // Professional dashboard statistics
  getDashboardStats: async () => {
    console.log('📡 API Service - getDashboardStats called');
    try {
      const response = await api.get('/professionals/dashboard-stats');
      console.log('✅ API Service - Dashboard stats response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ API Service - Error in getDashboardStats:', error);
      throw error;
    }
  },

  // Professional analytics data
  getAnalyticsData: async (period = 'month') => {
    const response = await api.get('/professionals/analytics', { params: { period } });
    return response.data;
  },

  // Professional basic stats
  getProfessionalStats: async () => {
    const response = await api.get('/professionals/me/stats');
    return response.data;
  },

  // Health check to verify API connectivity
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return {
        status: response.data.status,
        message: response.data.message,
        isConnected: true,
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: error.message,
        isConnected: false,
      };
    }
  },
  // Debugging helper to test a specific endpoint
  testEndpoint: async endpoint => {
    try {
      // Try direct fetch first
      const fetchResponse = await fetch(`/api${endpoint}`);
      const fetchData = await fetchResponse.json();

      // Try axios next
      const axiosResponse = await axios.get(`/api${endpoint}`);

      return {
        fetch: {
          status: fetchResponse.status,
          data: fetchData,
          success: fetchResponse.ok,
        },
        axios: {
          status: axiosResponse.status,
          data: axiosResponse.data,
          success: axiosResponse.status >= 200 && axiosResponse.status < 300,
        },
        isConnected: true,
      };
    } catch (error) {
      return {
        error: error.message,
        isConnected: false,
      };
    }
  },
};

export default apiService;
