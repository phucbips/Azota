// API wrapper with comprehensive error handling and retry logic

import React, { useState } from 'react';
import { useErrorHandler } from '../hooks/useFormValidation';

// API Error Classes
export class APIError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Lỗi kết nối mạng') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Lỗi xác thực') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// API Configuration
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  }
};

// Request interceptor
const setupRequestInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      // Add timestamp for debugging
      config.metadata = { startTime: new Date() };
      
      // Add auth token if available
      const token = localStorage.getItem('sessionToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request ID for tracing
      config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );
};

// Response interceptor
const setupResponseInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => {
      // Calculate request duration
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
      
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      console.error('❌ Response Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        message: error.message
      });

      // Handle different error types
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // Unauthorized - clear auth and redirect to login
            localStorage.removeItem('sessionToken');
            window.location.href = '/login';
            throw new AuthError('Phiên đăng nhập đã hết hạn');
            
          case 403:
            throw new APIError('Bạn không có quyền thực hiện hành động này', status, 'FORBIDDEN', data);
            
          case 404:
            throw new APIError('Không tìm thấy tài nguyên yêu cầu', status, 'NOT_FOUND', data);
            
          case 422:
            // Validation error
            throw new ValidationError(data.message || 'Dữ liệu không hợp lệ', data.errors || {});
            
          case 429:
            throw new APIError('Quá nhiều yêu cầu, vui lòng thử lại sau', status, 'TOO_MANY_REQUESTS', data);
            
          case 500:
            throw new APIError('Lỗi server nội bộ', status, 'INTERNAL_SERVER_ERROR', data);
            
          default:
            throw new APIError(
              data.message || error.message || 'Đã xảy ra lỗi không xác định',
              status,
              data.code || 'API_ERROR',
              data
            );
        }
      } else if (error.request) {
        // Network error
        throw new NetworkError('Không thể kết nối đến server');
      } else {
        // Request setup error
        throw new Error('Lỗi cấu hình yêu cầu: ' + error.message);
      }
    }
  );
};

// Retry logic
const retryRequest = async (axiosInstance, originalRequest, retriesLeft = API_CONFIG.retries) => {
  if (retriesLeft <= 0) {
    throw new Error('Đã thử lại quá nhiều lần');
  }
  
  // Wait before retrying
  await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
  
  try {
    return await axiosInstance(originalRequest);
  } catch (error) {
    // Only retry on network errors or 5xx server errors
    if (error instanceof NetworkError || 
        (error.response && error.response.status >= 500 && error.response.status < 600)) {
      return retryRequest(axiosInstance, originalRequest, retriesLeft - 1);
    }
    throw error;
  }
};

// Create axios instance
const createApiInstance = () => {
  const axios = require('axios');
  const instance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
  });
  
  setupRequestInterceptors(instance);
  setupResponseInterceptors(instance);
  
  return instance;
};

const api = createApiInstance();

// Enhanced API methods with error handling
export const apiClient = {
  // GET request
  get: async (url, config = {}) => {
    try {
      return await api.get(url, config);
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      return await api.post(url, data, config);
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      return await api.put(url, data, config);
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      return await api.patch(url, data, config);
    } catch (error) {
      console.error(`PATCH ${url} failed:`, error);
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      return await api.delete(url, config);
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }
};

// Specific API methods for Azota
export const azotaAPI = {
  // Authentication
  login: async (email, password) => {
    const response = await apiClient.post('/api/login', { email, password });
    return response.data;
  },

  register: async (email, password) => {
    const response = await apiClient.post('/api/register', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/logout');
    return response.data;
  },

  // User management
  getProfile: async () => {
    const response = await apiClient.get('/api/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/api/profile', profileData);
    return response.data;
  },

  // Orders and payments
  createOrder: async (orderData) => {
    const response = await apiClient.post('/api/requestOrder', orderData);
    return response.data;
  },

  getOrders: async () => {
    const response = await apiClient.get('/api/orders');
    return response.data;
  },

  // Access keys
  redeemKey: async (key) => {
    const response = await apiClient.post('/api/redeemAccessKey', { key });
    return response.data;
  },

  // Admin operations
  grantRole: async (uid, role) => {
    const response = await apiClient.post('/api/grantRole', { uid, role });
    return response.data;
  },

  createAccessKey: async (keyData) => {
    const response = await apiClient.post('/api/createAccessKey', keyData);
    return response.data;
  },

  // Data fetching
  getSubjects: async () => {
    const response = await apiClient.get('/api/subjects');
    return response.data;
  },

  getCourses: async () => {
    const response = await apiClient.get('/api/courses');
    return response.data;
  },

  getQuizzes: async () => {
    const response = await apiClient.get('/api/quizzes');
    return response.data;
  },

  // Quiz management (for teachers)
  createQuiz: async (quizData) => {
    const response = await apiClient.post('/api/quizzes', quizData);
    return response.data;
  },

  updateQuiz: async (quizId, quizData) => {
    const response = await apiClient.put(`/api/quizzes/${quizId}`, quizData);
    return response.data;
  },

  deleteQuiz: async (quizId) => {
    const response = await apiClient.delete(`/api/quizzes/${quizId}`);
    return response.data;
  }
};

// Hook for using API with loading and error states
export const useApi = () => {
  const { error, isError, processError, clearError, handleApiCall } = useErrorHandler();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = async (apiCall, options = {}) => {
    const {
      onSuccess,
      onError,
      showSuccessMessage = false,
      successMessage = 'Thành công!'
    } = options;

    try {
      setLoading(true);
      clearError();
      
      const result = await handleApiCall(apiCall, {
        showSuccessMessage,
        successMessage,
        onError: (error) => {
          if (onError) onError(error);
          setData(null);
        },
        onSuccess: (result) => {
          setData(result);
          if (onSuccess) onSuccess(result);
        }
      });
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    clearError();
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    isError,
    execute,
    reset,
    clearError
  };
};

// Export everything
export default apiClient;