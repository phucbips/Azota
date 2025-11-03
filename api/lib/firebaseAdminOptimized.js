import admin from 'firebase-admin';

let db, auth;
let firebaseInitialized = false;

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_TTL: 30 * 60 * 1000,   // 30 minutes for user data
  ADMIN_DATA_TTL: 10 * 60 * 1000, // 10 minutes for admin data
  MAX_CACHE_SIZE: 100, // Maximum cache entries
  ENABLE_COMPRESSION: true
};

// Memory cache store
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    // Check cache size limit
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = this.timestamps.keys().next().value;
      this.delete(oldestKey);
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + ttl);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) {
      this.delete(key);
      return null;
    }

    if (Date.now() > timestamp) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
      hitRate: this.hitRate || 0
    };
  }
}

// Global cache instances
const userCache = new MemoryCache();
const dataCache = new MemoryCache();

// Request counter for performance monitoring
let requestCount = 0;
let cacheHitCount = 0;

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    // Kiểm tra xem có service account key không
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        ),
        // Add performance optimizations
        projectId: process.env.FIREBASE_PROJECT_ID,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully with optimizations');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found. Using fallback mode.');
    }
  } else {
    firebaseInitialized = true;
  }
  
  if (firebaseInitialized) {
    db = admin.firestore();
    auth = admin.auth();
    
    // Enable offline persistence (for supported databases)
    try {
      db.settings({
        cacheSizeBytes: 400 * 1024 * 1024, // 400MB cache
        ignoreUndefinedProperties: true
      });
      console.log('📋 Firestore settings optimized');
    } catch (err) {
      console.warn('⚠️ Firestore settings not supported:', err.message);
    }
  }
} catch (e) {
  console.error("❌ Firebase Admin initialization failed:", e.message);
  firebaseInitialized = false;
}

// Helper function để kiểm tra Firebase status
export const isFirebaseReady = () => firebaseInitialized;

// =====================================================
// CACHE UTILITIES
// =====================================================

/**
 * Generate cache key for queries
 */
const generateCacheKey = (collection, params = {}) => {
  return `${collection}_${JSON.stringify(params)}`;
};

/**
 * Check if operation should use cache
 */
const shouldUseCache = (operation, params = {}) => {
  const cacheableOperations = ['get', 'list', 'search'];
  return cacheableOperations.includes(operation) && 
         !params.bypassCache && 
         firebaseInitialized;
};

// =====================================================
// OPTIMIZED DATABASE OPERATIONS
// =====================================================

/**
 * Optimized get user document with caching
 */
export const getUserOptimized = async (uid, options = {}) => {
  const cacheKey = generateCacheKey('user', { uid, ...options });
  
  // Check cache first
  if (shouldUseCache('get', options)) {
    const cached = userCache.get(cacheKey);
    if (cached) {
      cacheHitCount++;
      return cached;
    }
  }

  if (!firebaseInitialized) throw new Error('Firebase not initialized');

  try {
    requestCount++;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) return null;
    
    const userData = { uid: userDoc.id, ...userDoc.data() };
    
    // Cache the result
    if (shouldUseCache('get', options)) {
      userCache.set(cacheKey, userData, CACHE_CONFIG.USER_TTL);
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Get multiple users with pagination and caching
 */
export const getUsersOptimized = async (options = {}) => {
  const { 
    page = 1, 
    limit = 50, 
    orderBy = 'hoTen',
    direction = 'asc',
    search = '',
    filters = {},
    bypassCache = false 
  } = options;

  const cacheKey = generateCacheKey('users', options);
  
  // Check cache
  if (shouldUseCache('list', options) && !bypassCache) {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      cacheHitCount++;
      return cached;
    }
  }

  if (!firebaseInitialized) throw new Error('Firebase not initialized');

  try {
    requestCount++;
    let query = db.collection('users');
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });
    
    // Apply search (for name field)
    if (search) {
      query = query.where('hoTen', '>=', search)
                   .where('hoTen', '<=', search + '\uf8ff');
    }
    
    // Apply ordering
    query = query.orderBy(orderBy, direction);
    
    // Apply pagination
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    if (page > 1) {
      const offset = (page - 1) * limit;
      query = query.offset(offset);
    }
    
    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    // Get total count for pagination
    let totalCount;
    if (search || Object.keys(filters).length > 0) {
      // For filtered queries, count manually (less efficient but necessary)
      totalCount = users.length;
    } else {
      // For simple queries, use collection count
      const countSnapshot = await db.collection('users').get();
      totalCount = countSnapshot.size;
    }
    
    const result = {
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
    
    // Cache the result
    if (shouldUseCache('list', options) && !bypassCache) {
      dataCache.set(cacheKey, result, CACHE_CONFIG.ADMIN_DATA_TTL);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Optimized get public data with caching (subjects, courses, quizzes)
 */
export const getPublicDataOptimized = async (collectionName, options = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    orderBy = 'name',
    direction = 'asc',
    filters = {},
    bypassCache = false 
  } = options;

  const cacheKey = generateCacheKey(collectionName, options);
  
  // Check cache
  if (shouldUseCache('list', options) && !bypassCache) {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      cacheHitCount++;
      return cached;
    }
  }

  if (!firebaseInitialized) throw new Error('Firebase not initialized');

  try {
    requestCount++;
    let query = db.collection(collectionName);
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });
    
    // Apply ordering
    query = query.orderBy(orderBy, direction);
    
    // Apply pagination
    query = query.limit(limit * page); // Get enough documents for pagination
    
    const snapshot = await query.get();
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Manual pagination for better control
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    items = items.slice(startIndex, endIndex);
    
    // Get total count
    const countSnapshot = await db.collection(collectionName).get();
    const totalCount = countSnapshot.size;
    
    const result = {
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: endIndex < totalCount,
        hasPrev: page > 1
      }
    };
    
    // Cache the result
    if (shouldUseCache('list', options) && !bypassCache) {
      dataCache.set(cacheKey, result, CACHE_CONFIG.DEFAULT_TTL);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Batch operations for better performance
 */
export const batchOperations = async (operations = []) => {
  if (!firebaseInitialized) throw new Error('Firebase not initialized');
  
  if (operations.length === 0) return { success: true, writtenCount: 0 };
  
  try {
    requestCount++;
    const batch = db.batch();
    let writtenCount = 0;
    
    operations.forEach(op => {
      const { type, collection, docId, data } = op;
      
      const docRef = docId ? 
        db.collection(collection).doc(docId) : 
        db.collection(collection).doc();
      
      switch (type) {
        case 'create':
          batch.set(docRef, data);
          break;
        case 'update':
          batch.update(docRef, data);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
      writtenCount++;
    });
    
    await batch.commit();
    
    // Clear relevant cache entries
    operations.forEach(op => {
      if (op.collection) {
        const cacheKey = generateCacheKey(op.collection);
        dataCache.delete(cacheKey);
      }
    });
    
    return { success: true, writtenCount };
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
};

/**
 * Search with full-text capabilities
 */
export const searchOptimized = async (collection, searchTerm, options = {}) => {
  const { fields = ['name', 'title'], limit = 20, bypassCache = false } = options;
  
  if (!firebaseInitialized) throw new Error('Firebase not initialized');
  if (!searchTerm || searchTerm.trim().length === 0) return [];
  
  try {
    requestCount++;
    
    // Use compound queries for better performance
    const promises = fields.map(field => 
      db.collection(collection)
        .where(field, '>=', searchTerm)
        .where(field, '<=', searchTerm + '\uf8ff')
        .limit(limit)
        .get()
    );
    
    const snapshots = await Promise.all(promises);
    const results = new Map();
    
    // Combine and deduplicate results
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        if (!results.has(doc.id)) {
          results.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    });
    
    return Array.from(results.values()).slice(0, limit);
  } catch (error) {
    console.error(`Search error in ${collection}:`, error);
    throw error;
  }
};

// =====================================================
// AUTHENTICATION UTILITIES
// =====================================================

/**
 * Verify ID token with caching
 */
export const verifyTokenOptimized = async (idToken, options = {}) => {
  const cacheKey = generateCacheKey('token', { token: idToken.substring(0, 20), ...options });
  
  // Check cache for short-lived token verification (5 minutes)
  if (shouldUseCache('get', options)) {
    const cached = dataCache.get(cacheKey);
    if (cached) return cached;
  }

  if (!firebaseInitialized) throw new Error('Firebase not initialized');

  try {
    requestCount++;
    const decodedToken = await auth.verifyIdToken(idToken, true); // Force refresh
    const userData = await getUserOptimized(decodedToken.uid);
    
    const result = {
      ...decodedToken,
      userData
    };
    
    // Cache for 5 minutes
    if (shouldUseCache('get', options)) {
      dataCache.set(cacheKey, result, 5 * 60 * 1000);
    }
    
    return result;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

/**
 * Create custom token with session data
 */
export const createCustomTokenOptimized = async (uid, additionalClaims = {}) => {
  if (!firebaseInitialized) throw new Error('Firebase not initialized');

  try {
    requestCount++;
    
    // Get user data to include in token
    const userData = await getUserOptimized(uid);
    if (!userData) throw new Error('User not found');
    
    // Add custom claims
    const claims = {
      ...additionalClaims,
      hoTen: userData.hoTen,
      lop: userData.lop,
      role: userData.role || 'student'
    };
    
    return await auth.createCustomToken(uid, claims);
  } catch (error) {
    console.error('Custom token creation failed:', error);
    throw error;
  }
};

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  return {
    totalRequests: requestCount,
    cacheHits: cacheHitCount,
    cacheHitRate: requestCount > 0 ? (cacheHitCount / requestCount * 100).toFixed(2) + '%' : '0%',
    firebaseReady: firebaseInitialized,
    cacheStats: {
      userCache: userCache.getStats(),
      dataCache: dataCache.getStats()
    },
    uptime: process.uptime()
  };
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  userCache.clear();
  dataCache.clear();
  console.log('🧹 All caches cleared');
};

/**
 * Warm up cache with common queries
 */
export const warmupCache = async () => {
  if (!firebaseInitialized) return;
  
  try {
    console.log('🔥 Warming up cache...');
    
    // Pre-load common data
    await Promise.allSettled([
      getPublicDataOptimized('subjects', { limit: 10, bypassCache: true }),
      getPublicDataOptimized('courses', { limit: 10, bypassCache: true }),
      getUsersOptimized({ limit: 20, bypassCache: true })
    ]);
    
    console.log('✅ Cache warmed up');
  } catch (error) {
    console.warn('⚠️ Cache warmup failed:', error.message);
  }
};

export { db, auth };