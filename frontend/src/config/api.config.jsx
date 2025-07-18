/**
 * API Configuration
 *
 * This file contains API related configuration for different environments.
 */

const environments = {
  development: {
    baseURL: 'https://holistic-maroc-backend.onrender.com/api',
    timeout: 10000,
  },
  staging: {
    baseURL: 'https://staging-api.holistic-wellness.com/api',
    timeout: 15000,
  },
  production: {
    baseURL: 'https://api.holistic-wellness.com/api',
    timeout: 15000,
  },
};

// Determine the current environment
const currentEnv = process.env.REACT_APP_ENV || 'development';

// Export the configuration for the current environment
export default environments[currentEnv];
