import { z } from 'zod';

// Import sanitization utilities
import { sanitizeString, sanitizeObject } from '../utils/security.js';

// Rate limiting basic structure
const rateLimitMap = new Map();

/**
 * Rate limiting middleware đơn giản
 */
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const clientData = rateLimitMap.get(clientId);
    
    if (now > clientData.resetTime) {
      // Reset window
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
};

/**
 * Validate request body against Zod schema
 */
export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      // Sanitize input trước khi validate
      const sanitizedBody = sanitizeObject(req.body);
      const validatedData = await schema.parseAsync(sanitizedBody);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Lỗi validate dữ liệu',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      });
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const sanitizedQuery = sanitizeObject(req.query);
      const validatedQuery = await schema.parseAsync(sanitizedQuery);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Tham số truy vấn không hợp lệ',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Lỗi validate tham số',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      });
    }
  };
};

/**
 * Validate path parameters
 */
export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const sanitizedParams = sanitizeObject(req.params);
      const validatedParams = await schema.parseAsync(sanitizedParams);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Tham số đường dẫn không hợp lệ',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Lỗi validate tham số',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      });
    }
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  // Access key schemas
  createAccessKey: z.object({
    status: z.string().optional().default('new'),
    unlocksCapability: z.string().optional(),
    cartToUnlock: z.object({
      subjects: z.array(z.string()).optional().default([]),
      courses: z.array(z.string()).optional().default([])
    }).optional(),
    orderId: z.string().optional()
  }).refine((data) => {
    // Must have either unlocksCapability or cartToUnlock
    return data.unlocksCapability || data.cartToUnlock;
  }, {
    message: "Phải cung cấp 'unlocksCapability' hoặc 'cartToUnlock'"
  }),

  redeemAccessKey: z.object({
    key: z.string().min(1, 'Access key không được để trống')
  }),

  requestOrder: z.object({
    cart: z.object({
      subjects: z.array(z.string()).optional().default([]),
      courses: z.array(z.string()).optional().default([])
    }).refine((cart) => {
      return cart.subjects.length > 0 || cart.courses.length > 0;
    }, {
      message: 'Giỏ hàng phải có ít nhất một môn học hoặc khóa học'
    }),
    paymentMethod: z.string().optional().default('unknown'),
    amount: z.number().min(0).optional().default(0)
  }),

  grantRole: z.object({
    uid: z.string().min(1, 'UID không được để trống'),
    role: z.enum(['admin', 'teacher', 'student'], {
      errorMap: () => ({ message: 'Role phải là: admin, teacher, hoặc student' })
    })
  }),

  // Pagination schema
  pagination: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  }),

  // MongoDB/Firestore ID validation
  mongoId: z.string().regex(/^[a-zA-Z0-9]{20,}$/, 'ID không hợp lệ')
};

/**
 * Middleware tổng hợp cho validation
 */
export const createValidationMiddleware = (type, schema) => {
  const middlewares = [];
  
  // Always apply rate limiting
  middlewares.push(rateLimit());
  
  // Add specific validation based on type
  switch (type) {
    case 'body':
      middlewares.push(validateBody(schema));
      break;
    case 'query':
      middlewares.push(validateQuery(schema));
      break;
    case 'params':
      middlewares.push(validateParams(schema));
      break;
    case 'all':
      middlewares.push(validateBody(schema));
      break;
  }
  
  return middlewares;
};