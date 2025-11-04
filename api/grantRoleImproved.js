import { db, auth } from './lib/firebaseAdmin.js';
import admin from 'firebase-admin';

// =====================================================
// CORS và Security Configuration 
// =====================================================
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// =====================================================
// Validation Helpers
// =====================================================
const validateRoleData = (body) => {
  const { uid, role } = body;
  
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('UID không hợp lệ hoặc bị thiếu');
  }
  
  if (!role || !['admin', 'teacher', 'student'].includes(role)) {
    throw new Error('Role phải là: admin, teacher, hoặc student');
  }
  
  return {
    uid: uid.trim(),
    role: role.trim(),
    reason: body.reason?.trim() || null
  };
};

// =====================================================
// Enhanced Role Grant Function
// =====================================================
const grantRoleWithTransaction = async (targetUid, newRole, adminUid, reason = null) => {
  return await db.runTransaction(async (transaction) => {
    // 1. Kiểm tra user tồn tại
    const userRef = db.collection('users').doc(targetUid);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error(`Không tìm thấy user với UID: ${targetUid}`);
    }
    
    const userData = userDoc.data();
    const currentRole = userData.role || 'student';
    
    // 2. Kiểm tra không được thay đổi role của chính mình
    if (targetUid === adminUid) {
      throw new Error('Không thể thay đổi role của chính mình');
    }
    
    // 3. Cập nhật Firestore user document  
    const updateData = {
      role: newRole,
      previousRole: currentRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUid
    };
    
    if (reason) {
      updateData.roleChangeReason = reason;
    }
    
    transaction.update(userRef, updateData);
    
    // 4. Log role change vào collection riêng để audit
    const roleChangeRef = db.collection('roleChanges').doc();
    transaction.set(roleChangeRef, {
      targetUid,
      fromRole: currentRole,
      toRole: newRole,
      changedBy: adminUid,
      reason: reason || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: 'admin-panel',
      userAgent: 'admin-panel'
    });
    
    // 5. Cập nhật Firebase Auth custom claims
    await auth.setCustomUserClaims(targetUid, { 
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
    
    return {
      success: true,
      targetUid,
      fromRole: currentRole,
      toRole: newRole,
      changedBy: adminUid,
      reason,
      timestamp: new Date()
    };
  });
};

// =====================================================
// Main Handler Function
// =====================================================
export default async function handler(req, res) {
  // Set security headers
  res.set({ ...CORS_HEADERS, ...SECURITY_HEADERS });
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Phương thức không được phép. Chỉ hỗ trợ POST',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }
  
  try {
    // 1. Validate and extract data
    const { uid: targetUid, role: newRole, reason } = validateRoleData(req.body);
    
    // 2. Authenticate admin
    const authorization = req.headers.authorization;
    const token = authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token xác thực bị thiếu',
        code: 'AUTH_TOKEN_MISSING'
      });
    }
    
    // 3. Verify token and check admin role
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      console.error('Token verification failed:', authError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Token không hợp lệ hoặc đã hết hạn',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ admin mới có quyền thay đổi role',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    // 4. Execute role grant with transaction
    const result = await grantRoleWithTransaction(
      targetUid, 
      newRole, 
      decodedToken.uid, 
      reason
    );
    
    console.log(`✅ Role granted: ${targetUid} (${result.fromRole} → ${result.toRole}) by admin: ${decodedToken.uid}`);
    
    // 5. Success response
    res.status(200).json({
      success: true,
      data: result,
      message: `Thành công cập nhật role cho user ${targetUid}: ${result.fromRole} → ${result.toRole}`
    });
    
  } catch (error) {
    console.error('❌ Grant role error:', error.message);
    
    // Enhanced error handling
    let statusCode = 400;
    let errorCode = 'UNKNOWN_ERROR';
    let message = error.message;
    
    if (error.message.includes('Không tìm thấy user')) {
      statusCode = 404;
      errorCode = 'USER_NOT_FOUND';
    } else if (error.message.includes('Token')) {
      statusCode = 401;
      errorCode = 'AUTH_ERROR';
    } else if (error.message.includes('quyền')) {
      statusCode = 403;  
      errorCode = 'PERMISSION_DENIED';
    } else if (error.message.includes('UID không hợp lệ') || error.message.includes('Role phải là')) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
}