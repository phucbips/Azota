import { z } from 'zod';
import { rateLimit, schemas } from '../middleware/validation.js';
import { authenticateToken, requireAuthenticated, logUserActivity } from '../middleware/auth.js';
import { cacheResponse, invalidateUserCache } from '../middleware/caching.js';
import { securityHeaders } from '../utils/security.js';
import { redeemAccessKeyAtomic, FirebaseErrorHandler } from '../lib/firebaseOptimized.js';

// Validation schema
const RedeemAccessKeySchema = z.object({
  key: z.string().min(1, 'Access key không được để trống').max(50, 'Access key quá dài')
});

export default async function handler(req, res) {
  // Apply security headers
  res.set(securityHeaders);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.status(200).end();
  }

  // Apply rate limiting (50 requests per 15 minutes for user endpoints)
  const rateLimiter = rateLimit(50, 15 * 60 * 1000);
  await new Promise((resolve, reject) => {
    rateLimiter(req, res, (err) => err ? reject(err) : resolve());
  });

  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Phương thức không được phép. Chỉ hỗ trợ POST'
      });
    }

    // Validate request body
    const validatedData = await RedeemAccessKeySchema.parseAsync(req.body);
    const { key } = validatedData;

    // Sanitize key (remove any extra whitespace)
    const sanitizedKey = key.trim().toUpperCase();

    // Authenticate user
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => err ? reject(err) : resolve());
    });

    // Check user is authenticated (student, teacher, or admin)
    await new Promise((resolve, reject) => {
      requireAuthenticated(req, res, (err) => err ? reject(err) : resolve());
    });

    // Log user activity
    const logActivity = logUserActivity('redeem_access_key');
    await new Promise((resolve, reject) => {
      logActivity(req, res, (err) => err ? reject(err) : resolve());
    });

    // Redeem the access key using atomic transaction
    const result = await redeemAccessKeyAtomic(sanitizedKey, req.user.uid);

    // Invalidate user-related caches
    await invalidateUserCache(req.user.uid);

    // Success response
    res.status(200).json({
      success: true,
      data: {
        key: sanitizedKey,
        message: result.message,
        redeemedAt: new Date()
      },
      message: result.message || 'Đổi access key thành công!'
    });

    // Optional: Log successful redemption for analytics
    console.log(`Access key redeemed: ${sanitizedKey} by user: ${req.user.uid}`);

  } catch (error) {
    console.error('Error redeeming access key:', error);

    const errorResponse = FirebaseErrorHandler.handleError(error, {
      endpoint: 'redeemAccessKey',
      method: req.method,
      userId: req.user?.uid,
      key: req.body?.key ? req.body.key.substring(0, 8) + '...' : 'unknown'
    });

    // Determine appropriate status code
    let statusCode = 400;
    if (errorResponse.code === 'AUTH_TOKEN_INVALID') {
      statusCode = 401;
    } else if (errorResponse.code === 'INSUFFICIENT_ROLE') {
      statusCode = 403;
    } else if (error.message?.includes('không tồn tại')) {
      statusCode = 404;
    } else if (error.message?.includes('đã được sử dụng')) {
      statusCode = 409; // Conflict
    }

    res.status(statusCode).json(errorResponse);
  }
}