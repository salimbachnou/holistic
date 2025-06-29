import { useState, useCallback } from 'react';

/**
 * Custom hook for form handling
 *
 * @param {Object} initialState - Initial form state
 * @param {Function} validate - Validation function (optional)
 * @param {Function} onSubmit - Submit callback function
 * @returns {Object} - Form methods and state
 */
const useForm = (initialState = {}, validate = null, onSubmit = null) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  /**
   * Handle input change
   * @param {Event} event - DOM event
   */
  const handleChange = useCallback(
    event => {
      const { name, value, type, checked } = event.target;

      // Handle different input types
      const inputValue = type === 'checkbox' ? checked : value;

      setValues(prevValues => ({
        ...prevValues,
        [name]: inputValue,
      }));

      // Mark field as touched
      if (!touched[name]) {
        setTouched(prevTouched => ({
          ...prevTouched,
          [name]: true,
        }));
      }

      // If validation exists, validate the field
      if (validate) {
        const validationErrors = validate({ ...values, [name]: inputValue });
        if (validationErrors[name]) {
          setErrors(prevErrors => ({
            ...prevErrors,
            [name]: validationErrors[name],
          }));
        } else {
          setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
          });
        }
      }
    },
    [values, touched, validate]
  );

  /**
   * Handle form submission
   * @param {Event} event - DOM event
   */
  const handleSubmit = useCallback(
    async event => {
      if (event) {
        event.preventDefault();
      }

      // If validation exists, validate all fields
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);

        // Don't submit if there are errors
        if (Object.keys(validationErrors).length > 0) {
          // Mark all fields as touched to show errors
          const allTouched = Object.keys(values).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {});
          setTouched(allTouched);
          return;
        }
      }

      setIsSubmitting(true);

      if (onSubmit) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);

          // Handle API validation errors if they exist
          if (error.response && error.response.data && error.response.data.errors) {
            setErrors(error.response.data.errors);
          } else if (error.message) {
            setErrors({ form: error.message });
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validate, onSubmit]
  );

  /**
   * Reset form to initial state or new values
   * @param {Object} newValues - New values to set (optional)
   */
  const resetForm = useCallback(
    (newValues = null) => {
      setValues(newValues || initialState);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialState]
  );

  /**
   * Set a specific field value
   * @param {string} name - Field name
   * @param {any} value - Field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value,
    }));
  }, []);

  /**
   * Set multiple field values at once
   * @param {Object} newValues - New values to set
   */
  const setMultipleFields = useCallback(newValues => {
    setValues(prevValues => ({
      ...prevValues,
      ...newValues,
    }));
  }, []);

  /**
   * Check if a field has an error and has been touched
   * @param {string} name - Field name
   * @returns {boolean} - True if field has error and has been touched
   */
  const hasError = useCallback(
    name => {
      return !!(errors[name] && touched[name]);
    },
    [errors, touched]
  );

  /**
   * Get error message for a field
   * @param {string} name - Field name
   * @returns {string|null} - Error message or null
   */
  const getErrorMessage = useCallback(
    name => {
      return hasError(name) ? errors[name] : null;
    },
    [hasError, errors]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    setMultipleFields,
    hasError,
    getErrorMessage,
  };
};

export default useForm;
