import { auth, db } from '../lib/firebaseAdmin.js';
import { isValidUid, logSecurityEvent } from '../utils/security.js';

/**
 * Enhanced Authentication Middleware với JWT validation và RBAC
 */

// Cache cho user roles và permissions
const userRoleCache = new Map();
const ROLE_CACHE_TTL = 5 * 60 * 1000; // 5 phút

/**
 * Verify JWT token với enhanced validation
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Extract token từ Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      logSecurityEvent('AUTH_MISSING_TOKEN', { reason: 'No authorization header' }, req);
      return res.status(401).json({
        success: false,
        message: 'Token xác thực bị thiếu',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // Verify token với Firebase Auth
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token, true); // checkRevoked = true
    } catch (error) {
      logSecurityEvent('AUTH_TOKEN_INVALID', { 
        error: error.message, 
        tokenPreview: token.substring(0, 20) + '...' 
      }, req);
      
      return res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // Kiểm tra token không bị revoked
    if (decodedToken.revoked) {
      logSecurityEvent('AUTH_TOKEN_REVOKED', { uid: decodedToken.uid }, req);
      return res.status(401).json({
        success: false,
        message: 'Token đã bị thu hồi',
        code: 'AUTH_TOKEN_REVOKED'
      });
    }

    // Kiểm tra user disabled
    if (decodedToken.disabled) {
      logSecurityEvent('AUTH_USER_DISABLED', { uid: decodedToken.uid }, req);
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
        code: 'AUTH_USER_DISABLED'
      });
    }

    // Attach user info vào request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      role: decodedToken.role || 'student', // Default role
      customClaims: decodedToken,
      tokenIssuedAt: decodedToken.iat * 1000,
      tokenExpiresAt: decodedToken.exp * 1000
    };

    next();
  } catch (error) {
    logSecurityEvent('AUTH_ERROR', { error: error.message }, req);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực hệ thống',
      code: 'AUTH_SYSTEM_ERROR'
    });
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Cần xác thực trước',
          code: 'AUTH_REQUIRED'
        });
      }

      // Lấy role từ cache hoặc database
      const userRole = await getUserRole(req.user.uid);
      
      if (!userRole || !roles.includes(userRole)) {
        logSecurityEvent('AUTH_INSUFFICIENT_ROLE', {
          uid: req.user.uid,
          userRole,
          requiredRoles: roles
        }, req);

        return res.status(403).json({
          success: false,
          message: `Không có quyền truy cập. Yêu cầu role: ${roles.join(' hoặc ')}`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      // Attach role info vào request
      req.user.role = userRole;
      req.user.roles = [userRole]; // For compatibility

      next();
    } catch (error) {
      logSecurityEvent('AUTH_ROLE_CHECK_ERROR', { 
        error: error.message, 
        uid: req.user?.uid 
      }, req);
      
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền truy cập',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Check if user is teacher or admin
 */
export const requireTeacherOrAdmin = requireRole(['teacher', 'admin']);

/**
 * Check if user is student, teacher, or admin (authenticated user)
 */
export const requireAuthenticated = requireRole(['student', 'teacher', 'admin']);

/**
 * Optional authentication - không fail nếu không có token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decodedToken = await auth.verifyIdToken(token, true);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'student',
        customClaims: decodedToken
      };
    } catch (error) {
      // Token invalid, but we continue without auth
      req.user = null;
    }

    next();
  } catch (error) {
    // Error in optional auth, continue without auth
    req.user = null;
    next();
  }
};

/**
 * Helper function để lấy user role từ cache hoặc database
 */
async function getUserRole(uid) {
  if (!isValidUid(uid)) {
    throw new Error('Invalid UID format');
  }

  const cacheKey = `role:${uid}`;
  const cached = userRoleCache.get(cacheKey);

  // Check cache first
  if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
    return cached.role;
  }

  try {
    // Get role từ Firebase Auth custom claims (primary source)
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
    } catch (error) {
      // User not found in Auth, try Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const role = userData.role || 'student';
      
      // Cache the result
      userRoleCache.set(cacheKey, {
        role,
        timestamp: Date.now()
      });
      
      return role;
    }

    const customClaims = userRecord.customClaims || {};
    const role = customClaims.role || 'student';

    // Cache the result
    userRoleCache.set(cacheKey, {
      role,
      timestamp: Date.now()
    });

    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    
    // Fallback: check Firestore if Auth failed
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const role = userData.role || 'student';
        
        userRoleCache.set(cacheKey, {
          role,
          timestamp: Date.now()
        });
        
        return role;
      }
    } catch (firestoreError) {
      console.error('Error checking Firestore for user role:', firestoreError);
    }

    throw new Error('Unable to determine user role');
  }
}

/**
 * Refresh user role cache
 */
export const refreshUserRole = async (uid) => {
  const cacheKey = `role:${uid}`;
  userRoleCache.delete(cacheKey);
  return await getUserRole(uid);
};

/**
 * Clear user cache (for testing)
 */
export const clearUserCache = (uid) => {
  const cacheKey = `role:${uid}`;
  userRoleCache.delete(cacheKey);
};

/**
 * Clear all caches (for testing/maintenance)
 */
export const clearAllCaches = () => {
  userRoleCache.clear();
};

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRoleCache.entries()) {
    if (now - data.timestamp > ROLE_CACHE_TTL) {
      userRoleCache.delete(key);
    }
  }
}, ROLE_CACHE_TTL / 2);

/**
 * Middleware để log user activity
 */
export const logUserActivity = (action) => {
  return async (req, res, next) => {
    if (req.user) {
      try {
        await db.collection('userActivity').add({
          uid: req.user.uid,
          action,
          method: req.method,
          url: req.url,
          timestamp: new Date(),
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.connection?.remoteAddress
        });
      } catch (error) {
        console.error('Error logging user activity:', error);
        // Don't fail the request if logging fails
      }
    }
    next();
  };
};