/**
 * Application Constants
 *
 * This file contains application-wide constants.
 */

import apiConfig from './api.config';

// API URL for the application
export const API_URL = apiConfig.baseURL;

// Other application constants can be added here
export const APP_NAME = 'Holistic Wellness';
export const COPYRIGHT_YEAR = new Date().getFullYear();
export const DEFAULT_PAGINATION_LIMIT = 10;
