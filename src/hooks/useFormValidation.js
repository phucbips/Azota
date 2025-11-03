import { useState, useCallback, useEffect } from 'react';
import { validateForm, sanitizeInput, formatInput, validationRules } from '../utils/validation';

// Custom hook for form validation
export const useFormValidation = (initialData, validationSchema) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validate entire form
  const validateAll = useCallback(() => {
    setIsValidating(true);
    try {
      const result = validateForm(formData, validationSchema);
      setErrors(result.errors);
      setIsValidating(false);
      return result.isValid;
    } catch (error) {
      console.error('Validation error:', error);
      setIsValidating(false);
      return false;
    }
  }, [formData, validationSchema]);

  // Validate single field
  const validateField = useCallback((fieldName) => {
    const fieldConfig = validationSchema[fieldName];
    if (!fieldConfig) return null;

    const value = formData[fieldName];
    
    // Check required first
    if (fieldConfig.required) {
      const requiredError = validationRules.required?.(value, fieldConfig.label || fieldName);
      if (requiredError) {
        setErrors(prev => ({ ...prev, [fieldName]: requiredError }));
        return requiredError;
      }
    }

    // Run other validation rules
    for (const rule of fieldConfig.rules || []) {
      let error = null;
      
      if (typeof rule === 'string') {
        error = validationRules[rule]?.(value, fieldConfig.label || fieldName);
      } else if (typeof rule === 'function') {
        error = rule(value, formData);
      }
      
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return error;
      }
    }

    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    
    return null;
  }, [formData, validationSchema]);

  // Handle input change
  const handleChange = useCallback((fieldName, options = {}) => {
    const { 
      sanitize = false, 
      format = false, 
      validate = true 
    } = options;

    return (e) => {
      const value = e?.target?.value ?? e;
      let processedValue = value;

      // Apply sanitization
      if (sanitize && sanitizeInput[fieldName]) {
        processedValue = sanitizeInput[fieldName](value);
      }

      // Apply formatting
      if (format && formatInput[fieldName]) {
        processedValue = formatInput[fieldName](value);
      }

      // Update form data
      setFormData(prev => ({ ...prev, [fieldName]: processedValue }));

      // Mark as touched
      setTouched(prev => ({ ...prev, [fieldName]: true }));

      // Validate if needed
      if (validate) {
        setTimeout(() => validateField(fieldName), 0);
      }
    };
  }, [validateField]);

  // Handle blur (mark as touched and validate)
  const handleBlur = useCallback((fieldName) => {
    return () => {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
      validateField(fieldName);
    };
  }, [validateField]);

  // Set field value programmatically
  const setFieldValue = useCallback((fieldName, value, options = {}) => {
    const { 
      sanitize = false, 
      format = false, 
      validate = true 
    } = options;

    let processedValue = value;

    if (sanitize && sanitizeInput[fieldName]) {
      processedValue = sanitizeInput[fieldName](value);
    }

    if (format && formatInput[fieldName]) {
      processedValue = formatInput[fieldName](value);
    }

    setFormData(prev => ({ ...prev, [fieldName]: processedValue }));

    if (validate) {
      setTimeout(() => validateField(fieldName), 0);
    }
  }, [validateField]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, [initialData]);

  // Get field error
  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [errors, touched]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName) => {
    return !getFieldError(fieldName);
  }, [getFieldError]);

  // Get all field values
  const getValues = useCallback(() => ({ ...formData }), [formData]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const totalFields = Object.keys(validationSchema).length;
    const validFields = Object.keys(validationSchema).filter(fieldName => isFieldValid(fieldName)).length;
    const invalidFields = totalFields - validFields;

    return {
      totalFields,
      validFields,
      invalidFields,
      completionPercentage: (validFields / totalFields) * 100
    };
  }, [validationSchema, isFieldValid]);

  return {
    // State
    formData,
    errors,
    touched,
    isValidating,
    
    // Actions
    handleChange,
    handleBlur,
    setFieldValue,
    validateField,
    validateAll,
    resetForm,
    
    // Getters
    getFieldError,
    isFieldValid,
    isFormValid,
    getValues,
    getValidationSummary
  };
};

// Error handler hook for API calls
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  const processError = useCallback((error) => {
    console.error('Error occurred:', error);

    let errorMessage = 'Đã xảy ra lỗi không xác định';
    let errorCode = 'UNKNOWN_ERROR';

    if (error?.response) {
      // API response error
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      errorCode = error.response.data?.code || errorCode;
    } else if (error?.message) {
      // Standard error
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      // String error
      errorMessage = error;
    }

    const errorData = {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      originalError: error
    };

    setError(errorData);
    setIsError(true);

    return errorData;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const handleApiCall = useCallback(async (apiCall, options = {}) => {
    const {
      showSuccessMessage = false,
      successMessage = 'Thành công!',
      onSuccess,
      onError,
      logError = true
    } = options;

    try {
      clearError();
      const result = await apiCall();
      
      if (showSuccessMessage && successMessage) {
        // You can integrate with toast notification here
        console.log('✅ Success:', successMessage);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result, error: null };
    } catch (err) {
      const errorData = processError(err);
      
      if (logError) {
        console.error('🔴 API Call Failed:', {
          error: errorData,
          timestamp: new Date().toISOString()
        });
      }

      if (onError) {
        onError(errorData);
      }

      return { success: false, data: null, error: errorData };
    }
  }, [clearError, processError]);

  return {
    error,
    isError,
    processError,
    clearError,
    handleApiCall
  };
};

// Loading state hook
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((message = '') => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const withLoading = useCallback(async (asyncFunction, message = 'Đang xử lý...') => {
    try {
      startLoading(message);
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
};

// Toast notification hook (simple implementation)
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, duration) => addToast(message, 'success', duration);
  const error = useCallback((message, duration) => addToast(message, 'error', duration);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration);
  const info = useCallback((message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

// Async operation hook with state management
export const useAsyncOperation = (asyncFunction, dependencies = []) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Đã xảy ra lỗi' 
      }));
      throw error;
    }
  }, dependencies);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};