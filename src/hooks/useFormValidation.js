import { useState, useCallback } from 'react';

/**
 * Custom hook for form validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Validation function that returns { ok, errors }
 * @returns {Object} - Form state and handlers
 */
export function useFormValidation(initialValues = {}, validateFn = null) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update a single field
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Mark field as touched (for showing errors only after interaction)
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  // Set error for a specific field
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Clear error for a specific field
  const clearFieldError = useCallback((name) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validateFn) return { ok: true, errors: {} };
    
    const result = validateFn(values);
    setErrors(result.errors || {});
    return result;
  }, [values, validateFn]);

  // Handle field change with optional inline validation
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFieldValue(name, newValue);
    
    // Clear error when user starts typing
    if (errors[name]) {
      clearFieldError(name);
    }
  }, [setFieldValue, errors, clearFieldError]);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name, true);
  }, [setFieldTouched]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValues,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  };
}