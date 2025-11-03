import crypto from 'crypto';

/**
 * Security utilities cho input sanitization và validation
 */

// SQL Injection prevention patterns (for Firestore queries)
const DANGEROUS_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(\b(UNION|JOIN|INNER|LEFT|RIGHT|FULL)\b)/gi,
  /(--|\/\*|\*\/|;|--)/g,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(\b(XOR)\b)/gi
];

/**
 * Sanitize string input - loại bỏ các ký tự nguy hiểm
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  let sanitized = input.trim();
  
  // Remove null bytes and control characters (except newline, tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Escape HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error('Input chứa nội dung không hợp lệ');
    }
  }
  
  return sanitized;
};

/**
 * Sanitize object - recursive sanitization
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Firebase UID format
 */
export const isValidUid = (uid) => {
  // Firebase UID typically 28 characters base64url
  return typeof uid === 'string' && uid.length >= 20 && uid.length <= 128;
};

/**
 * Validate access key format (A1B2-C3D4-E5F6 pattern)
 */
export const isValidAccessKey = (key) => {
  const keyPattern = /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,}$/;
  return keyPattern.test(key);
};

/**
 * Sanitize filename - chỉ cho phép các ký tự an toàn
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return 'unnamed';
  
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Chỉ giữ lại alphanumeric, dot, dash
    .replace(/_{2,}/g, '_')  // Gộp multiple underscores
    .replace(/^_+|_+$/g, '')  // Trim underscores
    .substring(0, 255);  // Giới hạn độ dài
};

/**
 * Validate MongoDB/Firestore document ID
 */
export const isValidDocumentId = (id) => {
  return typeof id === 'string' && 
         id.length >= 20 && 
         /^[a-zA-Z0-9]+$/.test(id);
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (token, sessionToken) => {
  if (!token || !sessionToken) return false;
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  } catch {
    return false;
  }
};

/**
 * Rate limiting helper functions
 */

// Simple in-memory store for rate limiting (production nên dùng Redis)
const rateLimitStore = new Map();

/**
 * Check rate limit cho IP
 */
export const checkRateLimit = (ip, maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const key = `rate_limit:${ip}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
      blockedUntil: null
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  const data = rateLimitStore.get(key);
  
  // Check if currently blocked
  if (data.blockedUntil && now < data.blockedUntil) {
    const blockedFor = Math.ceil((data.blockedUntil - now) / 1000);
    return { 
      allowed: false, 
      remaining: 0, 
      blocked: true, 
      blockedFor 
    };
  }
  
  // Reset if window expired
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    data.blockedUntil = null;
    rateLimitStore.set(key, data);
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  // Check if exceeded
  if (data.count >= maxRequests) {
    // Block for longer period if repeated violations
    const blockDuration = data.count >= maxRequests * 2 ? 60 * 60 * 1000 : 15 * 60 * 1000;
    data.blockedUntil = now + blockDuration;
    rateLimitStore.set(key, data);
    
    return { 
      allowed: false, 
      remaining: 0, 
      blocked: true, 
      blockedFor: Math.ceil(blockDuration / 1000)
    };
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  
  return { 
    allowed: true, 
    remaining: maxRequests - data.count 
  };
};

/**
 * Security headers
 */
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

/**
 * Log security event
 */
export const logSecurityEvent = (event, details, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.url
  };
  
  console.warn('🔒 Security Event:', JSON.stringify(logEntry, null, 2));
  
  // Trong production, nên gửi này đến logging service như Cloud Logging
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime && (!data.blockedUntil || now > data.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes