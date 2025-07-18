import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';

// Set up axios defaults
axios.defaults.withCredentials = true;

// Add authorization header for all requests if token exists
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  response => response,
  error => {
    // If 401 Unauthorized, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      // Only clear token if it's not a login request
      if (!error.config.url.includes('/auth/login')) {
        console.warn('Token expired or invalid, redirecting to login');
        // Don't remove token here, let AuthContext handle it
      }
    }
    return Promise.reject(error);
  }
);

// Handle API errors
export const handleAPIError = error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const message = error.response.data?.message || 'Une erreur est survenue';
    const status = error.response.status;
    return { message, status };
  } else if (error.request) {
    // The request was made but no response was received
    return { message: 'Aucune réponse du serveur', status: 503 };
  } else {
    // Something happened in setting up the request that triggered an Error
    return { message: error.message || 'Une erreur est survenue', status: 500 };
  }
};

// Auth API
export const authAPI = {
  register: userData => axios.post(`${API_URL}/api/auth/register`, userData),
  registerProfessional: userData =>
    axios.post(`${API_URL}/api/auth/register/professional`, userData),
  login: credentials => axios.post(`${API_URL}/api/auth/login`, credentials),
  logout: () => axios.post(`${API_URL}/api/auth/logout`),
  getCurrentUser: () => axios.get(`${API_URL}/api/auth/me`),
  refreshToken: () => axios.post(`${API_URL}/api/auth/refresh-token`),
  forgotPassword: email => axios.post(`${API_URL}/api/auth/forgot-password`, { email }),
  resetPassword: (token, password) =>
    axios.post(`${API_URL}/api/auth/reset-password`, { token, password }),
  verifyEmail: token => axios.get(`${API_URL}/api/auth/verify-email/${token}`),
  getGoogleAuthUrl: (isProfessional = false) =>
    axios.get(`${API_URL}/api/auth/google/url?isProfessional=${isProfessional}`),
  handleGoogleCallback: code => axios.get(`${API_URL}/api/auth/google/callback?code=${code}`),
};

// User API
export const userAPI = {
  updateProfile: userData => axios.put(`${API_URL}/api/users/profile`, userData),
  updatePassword: passwordData => axios.put(`${API_URL}/api/users/password`, passwordData),
  uploadProfileImage: formData =>
    axios.post(`${API_URL}/api/uploads/profile-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getNotifications: () => axios.get(`${API_URL}/api/notifications`),
  markNotificationRead: notificationId =>
    axios.post(`${API_URL}/api/notifications/${notificationId}/mark-read`),
  markAllNotificationsRead: () => axios.post(`${API_URL}/api/notifications/mark-all-read`),
  deleteNotification: notificationId =>
    axios.delete(`${API_URL}/api/notifications/${notificationId}`),
  getFavorites: () => axios.get(`${API_URL}/api/users/favorites`),
  addFavorite: professionalId => axios.post(`${API_URL}/api/users/favorites`, { professionalId }),
  removeFavorite: professionalId =>
    axios.delete(`${API_URL}/api/users/favorites/${professionalId}`),
  checkFavorite: professionalId =>
    axios.get(`${API_URL}/api/users/favorites/check/${professionalId}`),
};

// Professional API
export const professionalAPI = {
  getAll: params => axios.get(`${API_URL}/api/professionals`, { params }),
  getById: id => axios.get(`${API_URL}/api/professionals/${id}`),
  updateProfile: profileData => axios.put(`${API_URL}/api/professionals/profile`, profileData),
  updateAvailability: availabilityData =>
    axios.put(`${API_URL}/api/professionals/availability`, availabilityData),
  updateServices: servicesData => axios.put(`${API_URL}/api/professionals/services`, servicesData),
  getClients: () => axios.get(`${API_URL}/api/professionals/clients`),
  getClientById: clientId => axios.get(`${API_URL}/api/professionals/clients/${clientId}`),
  uploadGalleryImage: formData =>
    axios.post(`${API_URL}/api/uploads/gallery-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteGalleryImage: imageId => axios.delete(`${API_URL}/api/professionals/gallery/${imageId}`),
  getReviews: () => axios.get(`${API_URL}/api/professionals/reviews`),
  respondToReview: (reviewId, response) =>
    axios.post(`${API_URL}/api/professionals/reviews/${reviewId}/respond`, { response }),
};

// Sessions API
export const sessionAPI = {
  getAll: () => axios.get(`${API_URL}/api/sessions`),
  getById: id => axios.get(`${API_URL}/api/sessions/${id}`),
  create: sessionData => axios.post(`${API_URL}/api/sessions`, sessionData),
  update: (id, sessionData) => axios.put(`${API_URL}/api/sessions/${id}`, sessionData),
  delete: id => axios.delete(`${API_URL}/api/sessions/${id}`),
  getSessionToken: sessionId => axios.get(`${API_URL}/api/sessions/${sessionId}/token`),
  addNote: (sessionId, noteData) =>
    axios.post(`${API_URL}/api/sessions/${sessionId}/notes`, noteData),
  updateNote: (sessionId, noteId, noteData) =>
    axios.put(`${API_URL}/api/sessions/${sessionId}/notes/${noteId}`, noteData),
  deleteNote: (sessionId, noteId) =>
    axios.delete(`${API_URL}/api/sessions/${sessionId}/notes/${noteId}`),
  getMySessions: params => axios.get(`${API_URL}/api/sessions/my-sessions`, { params }),
};

// Booking API
export const bookingAPI = {
  getAll: () => axios.get(`${API_URL}/api/bookings`),
  getById: id => axios.get(`${API_URL}/api/bookings/${id}`),
  create: bookingData => axios.post(`${API_URL}/api/bookings`, bookingData),
  update: (id, bookingData) => axios.put(`${API_URL}/api/bookings/${id}`, bookingData),
  cancel: (id, reason) => axios.put(`${API_URL}/api/bookings/${id}/cancel`, { reason }),
  getMyBookings: params => axios.get(`${API_URL}/api/bookings/my-bookings`, { params }),
  getAvailableSlots: (professionalId, date) =>
    axios.get(`${API_URL}/api/bookings/available-slots`, { params: { professionalId, date } }),
};

// Message API
export const messageAPI = {
  getConversations: () => axios.get(`${API_URL}/api/messages/conversations`),
  getConversation: userId => axios.get(`${API_URL}/api/messages/conversations/${userId}`),
  sendMessage: (receiverId, content) =>
    axios.post(`${API_URL}/api/messages`, { receiverId, content }),
  markAsRead: conversationId =>
    axios.put(`${API_URL}/api/messages/conversations/${conversationId}/read`),
};

// Product API
export const productAPI = {
  getAll: params => axios.get(`${API_URL}/api/products`, { params }),
  getById: id => axios.get(`${API_URL}/api/products/${id}`),
  create: productData => axios.post(`${API_URL}/api/products`, productData),
  update: (id, productData) => axios.put(`${API_URL}/api/products/${id}`, productData),
  delete: id => axios.delete(`${API_URL}/api/products/${id}`),
  uploadProductImage: formData =>
    axios.post(`${API_URL}/api/uploads/product-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteProductImage: (productId, imageIndex) =>
    axios.delete(`${API_URL}/api/products/${productId}/images/${imageIndex}`),
  getProfessionalProducts: () => axios.get(`${API_URL}/api/products/professional`),
};

// Event API
export const eventAPI = {
  getAll: params => axios.get(`${API_URL}/api/events`, { params }),
  getById: id => axios.get(`${API_URL}/api/events/${id}`),
  create: eventData => axios.post(`${API_URL}/api/events`, eventData),
  update: (id, eventData) => axios.put(`${API_URL}/api/events/${id}`, eventData),
  delete: id => axios.delete(`${API_URL}/api/events/${id}`),
  register: eventId => axios.post(`${API_URL}/api/events/${eventId}/register`),
  unregister: eventId => axios.delete(`${API_URL}/api/events/${eventId}/register`),
  uploadEventImage: formData =>
    axios.post(`${API_URL}/api/uploads/event-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Contact API
export const contactAPI = {
  send: contactData => axios.post(`${API_URL}/api/contact`, contactData),
  getAll: () => axios.get(`${API_URL}/api/contact`),
  getById: id => axios.get(`${API_URL}/api/contact/${id}`),
  updateStatus: (id, status) => axios.put(`${API_URL}/api/contact/${id}/status`, { status }),
  delete: id => axios.delete(`${API_URL}/api/contact/${id}`),
};
