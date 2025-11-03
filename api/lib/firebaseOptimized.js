import { db, auth } from '../lib/firebaseAdmin.js';
import admin from 'firebase-admin';

/**
 * Optimized Firebase Admin Operations với Batch, Transactions và Error Handling
 */

// Batch operation queue
class BatchQueue {
  constructor() {
    this.batch = null;
    this.operations = [];
    this.maxBatchSize = 400; // Firestore limit
  }

  /**
   * Initialize new batch
   */
  startBatch() {
    if (this.batch) {
      throw new Error('Batch already running');
    }
    this.batch = db.batch();
    this.operations = [];
  }

  /**
   * Add operation to batch
   */
  addOperation(operation) {
    if (!this.batch) {
      throw new Error('No active batch. Call startBatch() first.');
    }
    
    if (this.operations.length >= this.maxBatchSize) {
      throw new Error('Batch size limit exceeded');
    }
    
    this.operations.push(operation);
    return operation;
  }

  /**
   * Create document
   */
  create(collection, docId, data) {
    const ref = docId ? db.collection(collection).doc(docId) : db.collection(collection).doc();
    const op = this.batch.create(ref, {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return this.addOperation({
      type: 'create',
      ref: ref.path,
      data
    });
  }

  /**
   * Update document
   */
  update(collection, docId, data) {
    const ref = db.collection(collection).doc(docId);
    const op = this.batch.update(ref, {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return this.addOperation({
      type: 'update',
      ref: ref.path,
      data
    });
  }

  /**
   * Set document (create or overwrite)
   */
  set(collection, docId, data) {
    const ref = db.collection(collection).doc(docId);
    const op = this.batch.set(ref, {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return this.addOperation({
      type: 'set',
      ref: ref.path,
      data
    });
  }

  /**
   * Delete document
   */
  delete(collection, docId) {
    const ref = db.collection(collection).doc(docId);
    const op = this.batch.delete(ref);
    
    return this.addOperation({
      type: 'delete',
      ref: ref.path,
      data: null
    });
  }

  /**
   * Commit batch và return results
   */
  async commit() {
    if (!this.batch) {
      throw new Error('No active batch to commit');
    }

    try {
      const startTime = Date.now();
      await this.batch.commit();
      const duration = Date.now() - startTime;
      
      console.log(`Batch committed: ${this.operations.length} operations in ${duration}ms`);
      
      const result = {
        success: true,
        operations: this.operations.length,
        duration,
        timestamp: new Date()
      };
      
      // Reset batch
      this.batch = null;
      this.operations = [];
      
      return result;
    } catch (error) {
      console.error('Batch commit failed:', error);
      
      // Reset batch on error
      this.batch = null;
      this.operations = [];
      
      throw new FirebaseBatchError('Batch commit failed', error, this.operations);
    }
  }

  /**
   * Rollback (clear current batch)
   */
  rollback() {
    this.batch = null;
    this.operations = [];
  }
}

// Custom error class
class FirebaseBatchError extends Error {
  constructor(message, originalError, operations) {
    super(message);
    this.name = 'FirebaseBatchError';
    this.originalError = originalError;
    this.operations = operations;
    this.timestamp = new Date();
  }
}

/**
 * Transaction wrapper với retry logic
 */
class TransactionWrapper {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 100; // ms
  }

  /**
   * Execute transaction với retry logic
   */
  async execute(transactionFunc, options = {}) {
    const {
      maxRetries = this.maxRetries,
      baseDelay = this.baseDelay,
      onRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await db.runTransaction(async (transaction) => {
          return await transactionFunc(transaction);
        });
        
        console.log(`Transaction successful on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        const errorMessage = error.message || 'Unknown transaction error';
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error) && attempt < maxRetries;
        
        if (!isRetryable) {
          console.error(`Transaction failed permanently on attempt ${attempt}:`, errorMessage);
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        
        console.warn(`Transaction failed on attempt ${attempt}, retrying in ${delay}ms:`, errorMessage);
        
        if (onRetry) {
          await onRetry(attempt, error, delay);
        }
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      'ABORTED',
      'DEADLINE_EXCEEDED', 
      'RESOURCE_EXHAUSTED',
      'INTERNAL'
    ];
    
    if (error.code) {
      return retryableCodes.includes(error.code);
    }
    
    // Check error message for common retryable patterns
    const retryableMessages = [
      'conflict',
      'concurrent',
      'timeout',
      'deadline',
      'resource'
    ];
    
    return retryableMessages.some(pattern => 
      error.message?.toLowerCase().includes(pattern)
    );
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Batch operations manager
 */
export const batchManager = new BatchQueue();
export const transactionManager = new TransactionWrapper();

/**
 * Helper functions cho common operations
 */

// Bulk create users
export const bulkCreateUsers = async (usersData) => {
  const batch = new BatchQueue();
  batch.startBatch();
  
  try {
    for (const userData of usersData) {
      const { uid, ...data } = userData;
      batch.create('users', uid, data);
    }
    
    return await batch.commit();
  } catch (error) {
    batch.rollback();
    throw error;
  }
};

// Bulk update user roles
export const bulkUpdateUserRoles = async (roleUpdates) => {
  const batch = new BatchQueue();
  batch.startBatch();
  
  try {
    for (const { uid, role } of roleUpdates) {
      // Update Firestore
      batch.update('users', uid, { 
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update Auth custom claims
      await auth.setCustomUserClaims(uid, { role });
    }
    
    return await batch.commit();
  } catch (error) {
    batch.rollback();
    throw error;
  }
};

// Bulk create access keys
export const bulkCreateAccessKeys = async (keysData) => {
  const batch = new BatchQueue();
  batch.startBatch();
  
  try {
    for (const keyData of keysData) {
      batch.create('accessKeys', keyData.key, keyData);
    }
    
    return await batch.commit();
  } catch (error) {
    batch.rollback();
    throw error;
  }
};

/**
 * Transaction helpers
 */

// Update user và create activity log atomically
export const updateUserWithActivity = async (uid, userUpdates, activityData) => {
  return await transactionManager.execute(async (transaction) => {
    // Update user
    const userRef = db.collection('users').doc(uid);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    transaction.update(userRef, {
      ...userUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create activity log
    const activityRef = db.collection('userActivity').doc();
    transaction.set(activityRef, {
      ...activityData,
      uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, uid, activityId: activityRef.id };
  });
};

// Redeem access key với atomic operations
export const redeemAccessKeyAtomic = async (key, uid) => {
  return await transactionManager.execute(async (transaction) => {
    const keyRef = db.collection('accessKeys').doc(key);
    const keyDoc = await transaction.get(keyRef);
    
    if (!keyDoc.exists) {
      throw new Error('Access key không tồn tại');
    }
    
    const keyData = keyDoc.data();
    
    if (keyData.status !== 'new') {
      throw new Error('Key đã được sử dụng hoặc đã hết hạn');
    }
    
    // Check if user already has access
    const userRef = db.collection('users').doc(uid);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User không tồn tại');
    }
    
    const userData = userDoc.data();
    
    // Process key logic (similar to redeemAccessKey.js)
    let updates = {
      lastAccessKeyUsed: key,
      lastKeyUsedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    let message = '';
    
    if (keyData.unlocksCapability) {
      if (keyData.unlocksCapability === 'TEACHER_QUIZ_CREATION') {
        updates.canCreateQuizzes = true;
        message = 'Kích hoạt quyền tạo bài tập thành công!';
      }
    } else if (keyData.cartToUnlock) {
      // Get quiz IDs from cart (simplified version)
      const quizIdsToUnlock = []; // Would call getQuizIdsFromCart
      
      if (quizIdsToUnlock.length > 0) {
        updates.unlockedQuizzes = admin.firestore.FieldValue.arrayUnion(...quizIdsToUnlock);
        message = `Đổi key thành công! Đã unlock ${quizIdsToUnlock.length} bài tập.`;
      } else {
        message = 'Key hợp lệ nhưng không có bài tập nào để unlock.';
      }
    }
    
    // Update user
    transaction.update(userRef, updates);
    
    // Mark key as used
    transaction.update(keyRef, {
      status: 'redeemed',
      usedBy: uid,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message, uid, key };
  });
};

/**
 * Error handling helpers
 */
export class FirebaseErrorHandler {
  static handleError(error, context) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        details: error.details || null
      }
    };
    
    console.error('Firebase Error:', JSON.stringify(errorInfo, null, 2));
    
    // Return user-friendly error message
    const userMessage = this.getUserFriendlyMessage(error.code || error.message);
    
    return {
      success: false,
      message: userMessage,
      code: error.code || 'FIREBASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    };
  }

  static getUserFriendlyMessage(errorCode) {
    const errorMessages = {
      'PERMISSION_DENIED': 'Bạn không có quyền thực hiện thao tác này',
      'NOT_FOUND': 'Không tìm thấy dữ liệu',
      'ALREADY_EXISTS': 'Dữ liệu đã tồn tại',
      'RESOURCE_EXHAUSTED': 'Vượt quá giới hạn yêu cầu',
      'FAILED_PRECONDITION': 'Điều kiện không hợp lệ',
      'ABORTED': 'Thao tác bị gián đoạn',
      'OUT_OF_RANGE': 'Giá trị nằm ngoài phạm vi cho phép',
      'UNIMPLEMENTED': 'Tính năng chưa được triển khai',
      'INTERNAL': 'Lỗi hệ thống nội bộ',
      'UNAVAILABLE': 'Dịch vụ tạm thời không khả dụng',
      'DATA_LOSS': 'Mất dữ liệu',
      'UNAUTHENTICATED': 'Cần đăng nhập để thực hiện thao tác này'
    };
    
    return errorMessages[errorCode] || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
  }
}

/**
 * Query helpers
 */
export const buildQuery = (collection, filters = {}, options = {}) => {
  let query = db.collection(collection);
  
  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(field, '==', value);
    }
  });
  
  // Apply ordering
  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.order || 'desc');
  }
  
  // Apply limits
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.offset(options.offset);
  }
  
  return query;
};

/**
 * Pagination helper
 */
export const paginateQuery = async (query, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const paginatedQuery = query.limit(limit).offset(offset);
  
  const snapshot = await paginatedQuery.get();
  const docs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Get total count (in production, consider maintaining count separately)
  const countSnapshot = await query.get();
  const total = countSnapshot.size;
  
  return {
    data: docs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};