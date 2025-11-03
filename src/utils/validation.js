// Validation utilities and hooks for forms

// Validation rules
export const validationRules = {
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} là bắt buộc`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null; // Allow empty, handle required separately
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email không hợp lệ';
    }
    return null;
  },

  minLength: (value, minLength, fieldName = 'Field') => {
    if (!value) return null;
    if (value.length < minLength) {
      return `${fieldName} phải có ít nhất ${minLength} ký tự`;
    }
    return null;
  },

  maxLength: (value, maxLength, fieldName = 'Field') => {
    if (!value) return null;
    if (value.length > maxLength) {
      return `${fieldName} không được quá ${maxLength} ký tự`;
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    const errors = [];
    
    if (value.length < 6) {
      errors.push('ít nhất 6 ký tự');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('1 chữ hoa');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('1 chữ thường');
    }
    if (!/\d/.test(value)) {
      errors.push('1 số');
    }
    
    if (errors.length > 0) {
      return `Mật khẩu cần có: ${errors.join(', ')}`;
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ';
    }
    return null;
  },

  numeric: (value, fieldName = 'Field') => {
    if (!value) return null;
    if (isNaN(value) || isNaN(parseFloat(value))) {
      return `${fieldName} phải là số`;
    }
    return null;
  },

  positiveNumber: (value, fieldName = 'Field') => {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} phải là số dương`;
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL không hợp lệ';
    }
  },

  iframe: (value) => {
    if (!value) return null;
    if (!value.includes('<iframe')) {
      return 'Phải là mã iframe hợp lệ';
    }
    return null;
  },

  match: (value1, value2, fieldName = 'Fields') => {
    if (value1 !== value2) {
      return `${fieldName} không khớp`;
    }
    return null;
  },

  arrayMinLength: (array, minLength, fieldName = 'Field') => {
    if (!Array.isArray(array) || array.length < minLength) {
      return `${fieldName} phải có ít nhất ${minLength} mục`;
    }
    return null;
  }
};

// Comprehensive form validation
export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(fieldName => {
    const fieldConfig = schema[fieldName];
    const value = data[fieldName];
    
    // Skip validation if field is not required and empty
    if (!fieldConfig.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return;
    }
    
    // Run each validation rule
    for (const rule of fieldConfig.rules || []) {
      let error = null;
      
      if (typeof rule === 'string') {
        // Predefined rule
        error = validationRules[rule]?.(value, fieldConfig.label || fieldName);
      } else if (typeof rule === 'function') {
        // Custom rule
        error = rule(value, data);
      }
      
      if (error) {
        errors[fieldName] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation schema templates
export const validationSchemas = {
  login: {
    email: {
      required: true,
      rules: ['email']
    },
    password: {
      required: true,
      rules: ['minLength']
    }
  },

  register: {
    email: {
      required: true,
      rules: ['email']
    },
    password: {
      required: true,
      rules: ['password']
    },
    confirmPassword: {
      required: true,
      rules: [{ validator: (value, data) => validationRules.match(value, data.password, 'Mật khẩu') }]
    }
  },

  onboarding: {
    hoTen: {
      required: true,
      rules: [
        'minLength',
        { validator: (value) => {
          if (value && value.trim().split(' ').length < 2) {
            return 'Vui lòng nhập đầy đủ họ và tên';
          }
          return null;
        }}
      ]
    },
    lop: {
      required: true,
      rules: []
    }
  },

  quiz: {
    title: {
      required: true,
      rules: ['minLength']
    },
    embedCode: {
      required: true,
      rules: ['iframe']
    }
  },

  subject: {
    name: {
      required: true,
      rules: ['minLength']
    },
    price: {
      required: true,
      rules: ['positiveNumber']
    }
  },

  course: {
    name: {
      required: true,
      rules: ['minLength']
    },
    price: {
      required: true,
      rules: ['positiveNumber']
    }
  }
};

// Input sanitization functions
export const sanitizeInput = {
  text: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, '');
  },

  email: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  },

  number: (value) => {
    if (typeof value !== 'string') return value;
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toString();
  },

  iframe: (value) => {
    if (typeof value !== 'string') return value;
    // Basic iframe sanitization - remove potentially dangerous attributes
    return value
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/on\w+=\w+/gi, '');
  },

  password: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim();
  }
};

// Format utilities
export const formatInput = {
  phone: (value) => {
    if (typeof value !== 'string') return value;
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Vietnamese phone number
    if (digits.startsWith('84')) {
      return '+84 ' + digits.slice(2, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
    } else if (digits.startsWith('0')) {
      return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
    }
    
    return digits;
  },

  currency: (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    
    // Remove all non-digits and dots except first decimal
    const cleanValue = value.replace(/[^\d.]/g, '');
    const num = parseFloat(cleanValue);
    
    return isNaN(num) ? 0 : num;
  }
};