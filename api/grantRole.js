// =====================================================
// FIXED API ENDPOINT - Grant Role to User
// =====================================================

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
function initializeFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }
}

export default async function handler(req, res) {
  // Set CORS and JSON headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Initialize Firebase Admin
    initializeFirebase();
    const auth = getAuth();
    const db = getFirestore();

    // Validate input
    const { uid, role } = req.body;
    
    if (!uid || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'UID and role are required' 
      });
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be student, teacher, or admin' 
      });
    }

    // Check if user exists
    try {
      await auth.getUser(uid);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user custom claims (for authentication)
    await auth.setCustomUserClaims(uid, { role });

    // Update user document in Firestore (for data consistency)
    const userRef = db.collection('users').doc(uid);
    
    await userRef.update({
      role: role,
      updatedAt: FieldValue.serverTimestamp(),
      lastRoleUpdate: FieldValue.serverTimestamp()
    });

    // Log the action for audit trail
    await db.collection('adminActions').add({
      action: 'ROLE_UPDATE',
      targetUserId: uid,
      newRole: role,
      timestamp: FieldValue.serverTimestamp(),
      // Note: In production, get admin ID from JWT token
      adminId: 'system' 
    });

    console.log(`✅ Successfully updated user ${uid} role to ${role}`);

    return res.status(200).json({ 
      success: true, 
      message: `Đã cấp quyền ${role} thành công!`,
      data: {
        uid,
        role,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Grant role error:', error);
    
    // Return structured error response
    return res.status(500).json({ 
      success: false, 
      message: `Lỗi hệ thống: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}