/**
 * Validation Utilities
 *
 * A collection of validation functions for form fields
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid
 */
export const isStrongPassword = password => {
  return password && password.length >= 8;
};

/**
 * Validate phone number format (international)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhone = phone => {
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = url => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 * @param {any} value - Value to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = value => {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Validate required fields in an object
 * @param {Object} values - Object with form values
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Object with error messages for invalid fields
 */
export const validateRequired = (values, requiredFields) => {
  const errors = {};

  requiredFields.forEach(field => {
    if (isEmpty(values[field])) {
      errors[field] = 'Ce champ est requis';
    }
  });

  return errors;
};

/**
 * Create a validator function for a specific form
 * @param {Object} schema - Validation schema with field names and validation functions
 * @returns {Function} - Validator function that takes values and returns errors
 */
export const createValidator = schema => {
  return values => {
    const errors = {};

    Object.keys(schema).forEach(field => {
      const value = values[field];
      const fieldValidations = schema[field];

      if (Array.isArray(fieldValidations)) {
        for (const validation of fieldValidations) {
          if (!validation.validator(value, values)) {
            errors[field] = validation.message;
            break;
          }
        }
      } else if (typeof fieldValidations === 'function') {
        const error = fieldValidations(value, values);
        if (error) {
          errors[field] = error;
        }
      }
    });

    return errors;
  };
};

/**
 * Pre-defined validation schema for login form
 */
export const loginValidator = createValidator({
  email: [
    {
      validator: value => !isEmpty(value),
      message: "L'adresse email est requise",
    },
    {
      validator: isValidEmail,
      message: 'Veuillez entrer une adresse email valide',
    },
  ],
  password: {
    validator: value => !isEmpty(value),
    message: 'Le mot de passe est requis',
  },
});

/**
 * Pre-defined validation schema for registration form
 */
export const registerValidator = createValidator({
  name: {
    validator: value => !isEmpty(value),
    message: 'Le nom est requis',
  },
  email: [
    {
      validator: value => !isEmpty(value),
      message: "L'adresse email est requise",
    },
    {
      validator: isValidEmail,
      message: 'Veuillez entrer une adresse email valide',
    },
  ],
  password: [
    {
      validator: value => !isEmpty(value),
      message: 'Le mot de passe est requis',
    },
    {
      validator: isStrongPassword,
      message: 'Le mot de passe doit contenir au moins 8 caractères',
    },
  ],
  confirmPassword: {
    validator: (value, values) => value === values.password,
    message: 'Les mots de passe ne correspondent pas',
  },
});

/**
 * Pre-defined validation schema for professional registration form
 */
export const professionalRegisterValidator = {
  ...registerValidator,
  profession: {
    validator: value => !isEmpty(value),
    message: 'La profession est requise',
  },
  phone: [
    {
      validator: value => !isEmpty(value),
      message: 'Le numéro de téléphone est requis',
    },
    {
      validator: isValidPhone,
      message: 'Veuillez entrer un numéro de téléphone valide',
    },
  ],
};
