/**
 * Application Routes
 *
 * Centralized place for all application routes
 */

// Public routes
export const HOME = '/';
export const ABOUT = '/about';
export const CONTACT = '/contact';
export const PROFESSIONALS = '/professionals';
export const PROFESSIONAL_DETAILS = '/professionals/:id';

// Authentication routes
export const LOGIN = '/login';
export const REGISTER = '/register';
export const REGISTER_PROFESSIONAL = '/register/professional';
export const FORGOT_PASSWORD = '/forgot-password';
export const RESET_PASSWORD = '/reset-password/:token';
export const VERIFY_EMAIL = '/verify-email';
export const GOOGLE_AUTH_CALLBACK = '/auth/google/callback';

// Client routes
export const DASHBOARD = '/dashboard';
export const PROFILE = '/profile';
export const BOOKINGS = '/bookings';
export const CONSULTATIONS = '/consultations';
export const ORDERS = '/orders';
export const FAVORITES = '/favorites';
export const MESSAGES = '/messages';

// Professional routes
export const PROFESSIONAL_DASHBOARD = '/dashboard/professional';
export const PROFESSIONAL_PROFILE = '/professional/profile';
export const PROFESSIONAL_SESSIONS = '/professional/sessions';
export const PROFESSIONAL_PRODUCTS = '/professional/products';
export const PROFESSIONAL_CLIENTS = '/professional/clients';
export const PROFESSIONAL_ANALYTICS = '/professional/analytics';
export const PROFESSIONAL_SCHEDULE = '/professional/schedule';
export const PROFESSIONAL_MESSAGES = '/professional/messages';

// Admin routes
export const ADMIN = '/admin';
export const ADMIN_DASHBOARD = '/admin/dashboard';
export const ADMIN_PROFESSIONALS = '/admin/professionals';
export const ADMIN_CLIENTS = '/admin/clients';
export const ADMIN_CONTACTS = '/admin/contacts';
export const ADMIN_PRODUCTS = '/admin/products';
export const ADMIN_ORDERS = '/admin/orders';
export const ADMIN_BOOKINGS = '/admin/bookings';
export const ADMIN_EVENTS = '/admin/events';
export const ADMIN_ANALYTICS = '/admin/analytics';
export const ADMIN_SETTINGS = '/admin/settings';

/**
 * Helper functions for route manipulation
 */

/**
 * Get a route with parameters replaced by values
 * @param {string} route - Route with parameters (e.g. '/professionals/:id')
 * @param {Object} params - Parameter values (e.g. { id: 123 })
 * @returns {string} - Route with parameters replaced
 */
export const getRoute = (route, params = {}) => {
  let result = route;

  Object.keys(params).forEach(key => {
    result = result.replace(`:${key}`, params[key]);
  });

  return result;
};

/**
 * Group routes by section for easier reference
 */
export const ROUTES = {
  PUBLIC: {
    HOME,
    ABOUT,
    CONTACT,
    PROFESSIONALS,
    PROFESSIONAL_DETAILS,
  },
  AUTH: {
    LOGIN,
    REGISTER,
    REGISTER_PROFESSIONAL,
    FORGOT_PASSWORD,
    RESET_PASSWORD,
    VERIFY_EMAIL,
    GOOGLE_AUTH_CALLBACK,
  },
  CLIENT: {
    DASHBOARD,
    PROFILE,
    BOOKINGS,
    CONSULTATIONS,
    ORDERS,
    FAVORITES,
    MESSAGES,
  },
  PROFESSIONAL: {
    DASHBOARD: PROFESSIONAL_DASHBOARD,
    PROFILE: PROFESSIONAL_PROFILE,
    SESSIONS: PROFESSIONAL_SESSIONS,
    PRODUCTS: PROFESSIONAL_PRODUCTS,
    CLIENTS: PROFESSIONAL_CLIENTS,
    ANALYTICS: PROFESSIONAL_ANALYTICS,
    SCHEDULE: PROFESSIONAL_SCHEDULE,
    MESSAGES: PROFESSIONAL_MESSAGES,
  },
  ADMIN: {
    ROOT: ADMIN,
    DASHBOARD: ADMIN_DASHBOARD,
    PROFESSIONALS: ADMIN_PROFESSIONALS,
    CLIENTS: ADMIN_CLIENTS,
    CONTACTS: ADMIN_CONTACTS,
    PRODUCTS: ADMIN_PRODUCTS,
    ORDERS: ADMIN_ORDERS,
    BOOKINGS: ADMIN_BOOKINGS,
    EVENTS: ADMIN_EVENTS,
    ANALYTICS: ADMIN_ANALYTICS,
    SETTINGS: ADMIN_SETTINGS,
  },
};
