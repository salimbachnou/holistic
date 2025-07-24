/**
 * API Constants
 * Centralized API configuration
 */

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const API_BASE_URL = `${API_URL}/api`;

// Helper function to get full image URL
export const getImageUrl = imagePath => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default {
  API_URL,
  API_BASE_URL,
  getImageUrl,
};
