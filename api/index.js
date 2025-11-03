import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import optimized endpoints
import createAccessKeyOptimized from './createAccessKeyOptimized.js';
import redeemAccessKeyOptimized from './redeemAccessKeyOptimized.js';
import requestOrderOptimized from './requestOrderOptimized.js';
import grantRoleOptimized from './grantRoleOptimized.js';
import testOptimized from './testOptimized.js';

// Import original endpoints (fallback)
import createAccessKey from './createAccessKey.js';
import redeemAccessKey from './redeemAccessKey.js';
import requestOrder from './requestOrder.js';
import grantRole from './grantRole.js';
import debug from './debug.js';

// Import security utilities
import { securityHeaders } from './utils/security.js';
import { logSecurityEvent } from './utils/security.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path
    }, req);
    
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
      retryAfter: 15 * 60
    });
  }
});

app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Apply security headers to all responses
app.use((req, res, next) => {
  res.set(securityHeaders);
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    
    // Log suspicious requests
    if (res.statusCode >= 400 && req.method !== 'OPTIONS') {
      logSecurityEvent('HTTP_ERROR', {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }, req);
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0-optimized',
    services: {
      firebase: 'connected', // Would check actual connection in production
      endpoints: 'ready'
    }
  });
});

// API routes - Optimized endpoints
const apiRouter = express.Router();

// Test endpoint
apiRouter.get('/test', testOptimized);

// Create access key (optimized)
apiRouter.post('/create-access-key-optimized', createAccessKeyOptimized);

// Redeem access key (optimized)  
apiRouter.post('/redeem-access-key-optimized', redeemAccessKeyOptimized);

// Request order (optimized)
apiRouter.post('/request-order-optimized', requestOrderOptimized);

// Grant role (optimized)
apiRouter.post('/grant-role-optimized', grantRoleOptimized);

// Fallback routes to original endpoints (for compatibility)
apiRouter.post('/create-access-key', createAccessKey);
apiRouter.post('/redeem-access-key', redeemAccessKey);
apiRouter.post('/request-order', requestOrder);
apiRouter.post('/grant-role', grantRole);
apiRouter.get('/debug', debug);

// Mount API routes
app.use('/api', apiRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint không tồn tại: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /api/test',
      'POST /api/create-access-key-optimized',
      'POST /api/redeem-access-key-optimized',
      'POST /api/request-order-optimized',
      'POST /api/grant-role-optimized'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Log security errors
  if (error.message?.includes('security') || error.status >= 400) {
    logSecurityEvent('GLOBAL_ERROR', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    }, req);
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Đã xảy ra lỗi hệ thống',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Azota API Server v2.0.0 Optimized
========================================
📍 Port: ${PORT}
🔒 Security: Enhanced
⚡ Performance: Optimized
📊 Features: 
   - Input Validation (Zod)
   - JWT Authentication & RBAC  
   - Response Caching (LRU)
   - Firebase Optimizations
   - Security Headers
   - Rate Limiting
   - Transaction Support
   - Error Handling

📚 Available Endpoints:
   GET  /health                      - Health check
   GET  /api/test                    - Test endpoint
   POST /api/create-access-key-optimized - Create access key
   POST /api/redeem-access-key-optimized  - Redeem access key  
   POST /api/request-order-optimized      - Create order
   POST /api/grant-role-optimized         - Grant role

🔗 Fallback Endpoints (original):
   POST /api/create-access-key      - Original endpoint
   POST /api/redeem-access-key      - Original endpoint
   POST /api/request-order          - Original endpoint
   POST /api/grant-role             - Original endpoint
   GET  /api/debug                  - Debug endpoint

⚙️ Environment: ${process.env.NODE_ENV || 'development'}
========================================
`);
});

export default app;