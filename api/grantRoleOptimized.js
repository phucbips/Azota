import { z } from 'zod';
import { rateLimit } from '../middleware/validation.js';
import { authenticateToken, requireAdmin, logUserActivity } from '../middleware/auth.js';
import { securityHeaders, logSecurityEvent } from '../utils/security.js';
import { 
  batchManager, 
  transactionManager, 
  FirebaseErrorHandler,
  auth
} from '../lib/firebaseOptimized.js';

// Enhanced validation schema
const GrantRoleSchema = z.object({
  uid: z.string().min(1, 'UID không được để trống').max(128, 'UID quá dài'),
  role: z.enum(['admin', 'teacher', 'student'], {
    errorMap: () => ({ message: 'Role phải là: admin, teacher, hoặc student' })
  }),
  reason: z.string().max(200, 'Lý do không được quá 200 ký tự').optional(),
  expiresAt: z.string().datetime().optional() // For temporary roles
});

// Rate limit for role changes (admin sensitive operation)
const ROLE_CHANGE_RATE_LIMIT = 10; // 10 changes per hour

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

  // Apply strict rate limiting for admin operations
  const rateLimiter = rateLimit(ROLE_CHANGE_RATE_LIMIT, 60 * 60 * 1000);
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
    const validatedData = await GrantRoleSchema.parseAsync(req.body);
    const { uid, role, reason, expiresAt } = validatedData;

    // Sanitize inputs
    const sanitizedUid = uid.trim();
    const sanitizedReason = reason ? reason.trim() : null;

    // Authenticate admin
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => err ? reject(err) : resolve());
    });

    // Check admin role
    await new Promise((resolve, reject) => {
      requireAdmin(req, res, (err) => err ? reject(err) : resolve());
    });

    // Prevent admin from changing their own role (security)
    if (sanitizedUid === req.user.uid) {
      logSecurityEvent('ADMIN_SELF_ROLE_CHANGE_ATTEMPT', {
        adminUid: req.user.uid,
        attemptedRole: role
      }, req);
      
      return res.status(403).json({
        success: false,
        message: 'Không thể thay đổi role của chính mình'
      });
    }

    // Log user activity
    const logActivity = logUserActivity('grant_role');
    await new Promise((resolve, reject) => {
      logActivity(req, res, (err) => err ? reject(err) : resolve());
    });

    // Grant role using transaction
    const result = await grantRoleAtomic(sanitizedUid, role, {
      adminUid: req.user.uid,
      reason: sanitizedReason,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // Log security event
    logSecurityEvent('ROLE_GRANTED', {
      targetUid: sanitizedUid,
      newRole: role,
      adminUid: req.user.uid,
      reason: sanitizedReason,
      expiresAt
    }, req);

    // Success response
    res.status(200).json({
      success: true,
      data: {
        uid: sanitizedUid,
        role,
        grantedBy: req.user.uid,
        reason: sanitizedReason,
        expiresAt,
        grantedAt: new Date()
      },
      message: `Cập nhật role thành công cho user ${sanitizedUid}`
    });

    console.log(`Role granted: ${sanitizedUid} -> ${role} by admin: ${req.user.uid}`);

  } catch (error) {
    console.error('Error granting role:', error);

    // Log failed attempt
    logSecurityEvent('ROLE_GRANT_FAILED', {
      error: error.message,
      adminUid: req.user?.uid,
      targetUid: req.body?.uid,
      attemptedRole: req.body?.role
    }, req);

    const errorResponse = FirebaseErrorHandler.handleError(error, {
      endpoint: 'grantRole',
      method: req.method,
      adminUid: req.user?.uid,
      targetUid: req.body?.uid,
      role: req.body?.role
    });

    // Determine appropriate status code
    let statusCode = 400;
    if (errorResponse.code === 'AUTH_TOKEN_INVALID') {
      statusCode = 401;
    } else if (errorResponse.code === 'INSUFFICIENT_ROLE') {
      statusCode = 403;
    } else if (error.message?.includes('User not found')) {
      statusCode = 404;
    }

    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Grant role using atomic transaction
 */
async function grantRoleAtomic(uid, role, options) {
  const { adminUid, reason, expiresAt } = options;

  return await transactionManager.execute(async (transaction) => {
    const userRef = transaction.db.collection('users').doc(uid);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentRole = userData.role || 'student';

    // Prepare role update data
    const roleUpdate = {
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUid
    };

    if (reason) {
      roleUpdate.roleReason = reason;
    }

    if (expiresAt) {
      roleUpdate.roleExpiresAt = expiresAt;
    } else {
      // Clear any existing expiration
      roleUpdate.roleExpiresAt = admin.firestore.FieldValue.delete();
    }

    // Update Firestore user document
    transaction.update(userRef, roleUpdate);

    // Create role change log
    const roleChangeRef = transaction.db.collection('roleChanges').doc();
    transaction.create(roleChangeRef, {
      uid,
      fromRole: currentRole,
      toRole: role,
      grantedBy: adminUid,
      reason: reason || null,
      expiresAt: expiresAt || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: 'admin-panel', // Would be set from request in real implementation
      userAgent: 'admin-panel'
    });

    // Create activity log
    const activityRef = transaction.db.collection('userActivity').doc();
    transaction.set(activityRef, {
      uid,
      action: 'role_changed',
      fromRole: currentRole,
      toRole: role,
      grantedBy: adminUid,
      reason: reason || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      uid,
      role,
      fromRole: currentRole,
      adminUid,
      reason,
      expiresAt
    };
  }, {
    maxRetries: 3,
    onRetry: async (attempt, error, delay) => {
      console.warn(`Role grant retry ${attempt}/${3} after ${delay}ms:`, error.message);
    }
  });
}