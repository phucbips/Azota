import { z } from 'zod';
import { rateLimit, schemas } from '../middleware/validation.js';
import { authenticateToken, requireAdmin, logUserActivity } from '../middleware/auth.js';
import { cacheResponse, invalidateCache } from '../middleware/caching.js';
import { securityHeaders } from '../utils/security.js';
import { 
  batchManager, 
  transactionManager, 
  FirebaseErrorHandler 
} from '../lib/firebaseOptimized.js';

// Validation schema
const CreateAccessKeySchema = z.object({
  status: z.string().optional().default('new'),
  unlocksCapability: z.string().optional(),
  cartToUnlock: z.object({
    subjects: z.array(z.string()).optional().default([]),
    courses: z.array(z.string()).optional().default([])
  }).optional(),
  orderId: z.string().optional()
}).refine((data) => {
  return data.unlocksCapability || data.cartToUnlock;
}, {
  message: "Phải cung cấp 'unlocksCapability' hoặc 'cartToUnlock'"
});

/**
 * Generate access key với improved random generation
 */
const generateAccessKey = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto for better randomness
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
    if ((i + 1) % 4 === 0 && i + 1 < length) {
      result += '-';
    }
  }
  return result;
};

export default async function handler(req, res) {
  // Apply security headers
  res.set(securityHeaders);
  
  // Apply rate limiting (100 requests per 15 minutes for admin endpoints)
  const rateLimiter = rateLimit(100, 15 * 60 * 1000);
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
    const validatedData = await CreateAccessKeySchema.parseAsync(req.body);

    // Extract data
    const { status, unlocksCapability, cartToUnlock, orderId } = validatedData;

    // Authenticate admin
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => err ? reject(err) : resolve());
    });

    // Check admin role
    await new Promise((resolve, reject) => {
      requireAdmin(req, res, (err) => err ? reject(err) : resolve());
    });

    // Log user activity
    const logActivity = logUserActivity('create_access_key');
    await new Promise((resolve, reject) => {
      logActivity(req, res, (err) => err ? reject(err) : resolve());
    });

    // Generate unique access key
    let newKey;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      newKey = generateAccessKey();
      attempts++;

      try {
        // Check if key already exists using transaction
        const keyExists = await transactionManager.execute(async (transaction) => {
          const keyRef = transaction.db.collection('accessKeys').doc(newKey);
          const keyDoc = await transaction.get(keyRef);
          return keyDoc.exists;
        });

        if (!keyExists) {
          isUnique = true;
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw new Error('Không thể tạo key duy nhất sau nhiều lần thử');
        }
      }
    }

    // Prepare key data
    const keyData = {
      status: status || 'new',
      createdAt: new Date(),
      createdBy: req.user.uid
    };

    if (unlocksCapability) {
      keyData.unlocksCapability = unlocksCapability;
    } else if (cartToUnlock) {
      keyData.cartToUnlock = cartToUnlock;
    }

    if (orderId) {
      keyData.orderId = orderId;
    }

    // Create key using batch operation for consistency
    const result = await transactionManager.execute(async (transaction) => {
      const keyRef = transaction.db.collection('accessKeys').doc(newKey);
      
      // Ensure key doesn't exist
      const existingDoc = await transaction.get(keyRef);
      if (existingDoc.exists) {
        throw new Error('Key đã tồn tại');
      }

      // Create the key
      transaction.create(keyRef, keyData);

      // If associated with order, update order status
      if (orderId) {
        const orderRef = transaction.db.collection('orders').doc(orderId);
        transaction.update(orderRef, {
          accessKeyGenerated: true,
          accessKey: newKey,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { key: newKey, data: keyData };
    });

    // Invalidate relevant caches
    await invalidateCache('GET:/api/access-keys'); // If there's a list endpoint

    // Success response
    res.status(201).json({
      success: true,
      data: {
        key: result.key,
        status: keyData.status,
        unlocksCapability: keyData.unlocksCapability,
        orderId: keyData.orderId
      },
      message: `Tạo access key ${result.key} thành công`
    });

  } catch (error) {
    console.error('Error creating access key:', error);

    const errorResponse = FirebaseErrorHandler.handleError(error, {
      endpoint: 'createAccessKey',
      method: req.method,
      userId: req.user?.uid,
      body: req.body
    });

    res.status(errorResponse.code === 'AUTH_TOKEN_INVALID' ? 401 : 400).json(errorResponse);
  }
}

// Handle OPTIONS for CORS
export async function options(req, res) {
  res.set(securityHeaders);
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  
  res.status(200).end();
}