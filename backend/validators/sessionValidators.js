const { body, param, query } = require('express-validator');

/**
 * Validation rules for session creation
 */
const createSessionValidation = [
  body('title')
    .notEmpty()
    .trim()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .notEmpty()
    .trim()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),

  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('maxParticipants')
    .notEmpty()
    .withMessage('Max participants is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Max participants must be between 1 and 100'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['individual', 'group', 'online', 'workshop', 'retreat'])
    .withMessage('Invalid category'),

  // Conditional validation for location
  body('location')
    .custom((value, { req }) => {
      if (req.body.category !== 'online' && (!value || value.trim() === '')) {
        throw new Error('Location is required for non-online sessions');
      }
      return true;
    }),

  // Conditional validation for meeting link
  body('meetingLink')
    .custom((value, { req }) => {
      if (req.body.category === 'online' && (!value || value.trim() === '')) {
        throw new Error('Meeting link is required for online sessions');
      }
      if (value && !isValidUrl(value)) {
        throw new Error('Meeting link must be a valid URL');
      }
      return true;
    }),

  // Optional fields validation
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),

  body('materials')
    .optional()
    .isArray()
    .withMessage('Materials must be an array'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('sessionCategories')
    .optional()
    .isArray()
    .withMessage('Session categories must be an array')
];

/**
 * Validation rules for session update
 */
const updateSessionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      // Only validate future time for new sessions or when explicitly changing startTime
      if (value) {
        const startTime = new Date(value);
        const now = new Date();
        // Allow some buffer time (5 minutes) for editing sessions that are about to start
        const bufferTime = new Date(now.getTime() - 5 * 60000);
        if (startTime <= bufferTime) {
          throw new Error('Start time must be in the future');
        }
      }
      return true;
    }),

  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max participants must be between 1 and 100'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .optional()
    .isIn(['individual', 'group', 'online', 'workshop', 'retreat'])
    .withMessage('Invalid category'),

  body('location')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (req.body.category && req.body.category !== 'online' && (!value || value.trim() === '')) {
        throw new Error('Location is required for non-online sessions');
      }
      return true;
    }),

  body('meetingLink')
    .optional()
    .custom((value, { req }) => {
      if (req.body.category === 'online' && (!value || value.trim() === '')) {
        throw new Error('Meeting link is required for online sessions');
      }
      if (value && !isValidUrl(value)) {
        throw new Error('Meeting link must be a valid URL');
      }
      return true;
    }),

  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),

  body('materials')
    .optional()
    .isArray()
    .withMessage('Materials must be an array'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('sessionCategories')
    .optional()
    .isArray()
    .withMessage('Session categories must be an array')
];

/**
 * Validation rules for session queries
 */
const getSessionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['startTime', 'title', 'price', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  query('category')
    .optional()
    .isIn(['individual', 'group', 'online', 'workshop', 'retreat'])
    .withMessage('Invalid category'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

/**
 * Validation rules for session ID parameter
 */
const sessionIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID')
];

/**
 * Validation rules for booking ID parameter
 */
const bookingIdValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Invalid booking ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['confirmed', 'cancelled'])
    .withMessage('Status must be either confirmed or cancelled'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

/**
 * Helper function to validate URLs
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  createSessionValidation,
  updateSessionValidation,
  getSessionsValidation,
  sessionIdValidation,
  bookingIdValidation
};
