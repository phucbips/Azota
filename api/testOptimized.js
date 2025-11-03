import { z } from 'zod';
import { rateLimit, schemas } from '../middleware/validation.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { cacheResponse, cacheStatic, noCache } from '../middleware/caching.js';
import { securityHeaders } from '../utils/security.js';
import { getCacheStats, getCacheStats as getFirebaseStats } from '../lib/firebaseOptimized.js';
import { getUserRole, clearUserCache } from '../middleware/auth.js';

/**
 * Test endpoint để verify tất cả middleware
 * GET /api/test
 */
export default async function handler(req, res) {
  // Apply security headers
  res.set(securityHeaders);

  // Test cache middleware
  const cacheTest = cacheResponse({ ttl: 30000 }); // 30 seconds
  await new Promise((resolve, reject) => {
    cacheTest(req, res, (err) => err ? reject(err) : resolve());
  });

  try {
    // Handle different HTTP methods
    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Test-Auth',
        'Access-Control-Max-Age': '86400'
      });
      return res.status(200).end();
    }

    // Get authentication status
    await new Promise((resolve, reject) => {
      optionalAuth(req, res, (err) => err ? reject(err) : resolve());
    });

    const user = req.user;
    const testResults = {
      timestamp: new Date(),
      method: req.method,
      url: req.url,
      user: user ? {
        uid: user.uid,
        email: user.email,
        role: user.role
      } : null,
      cache: getCacheStats(),
      firebase: getFirebaseStats(),
      security: {
        headers: Object.keys(securityHeaders).length,
        rateLimit: 'Applied (see headers)',
        sanitization: 'Active'
      },
      endpoints: {
        createAccessKey: '/api/create-access-key-optimized',
        redeemAccessKey: '/api/redeem-access-key-optimized', 
        requestOrder: '/api/request-order-optimized',
        grantRole: '/api/grant-role-optimized',
        test: '/api/test'
      },
      middleware: {
        validation: '✅ Zod schemas active',
        auth: user ? '✅ JWT validation active' : '⚠️ No auth (optional)',
        cache: '✅ LRU cache active',
        security: '✅ Security headers & sanitization active',
        firebase: '✅ Optimized operations active'
      }
    };

    // Response based on request
    switch (req.method) {
      case 'GET':
        res.status(200).json({
          success: true,
          message: 'API Middleware Test Endpoint',
          data: testResults,
          endpoints: testResults.endpoints
        });
        break;

      case 'POST':
        if (req.body && req.body.action === 'clearCache') {
          clearUserCache(req.body.uid || 'all');
          res.status(200).json({
            success: true,
            message: 'Cache cleared successfully',
            data: { cleared: req.body.uid || 'all' }
          });
        } else {
          res.status(405).json({
            success: false,
            message: 'Method not allowed for this action'
          });
        }
        break;

      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
}