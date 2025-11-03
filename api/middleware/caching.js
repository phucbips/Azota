import LRU from 'lru-cache';

/**
 * Response Caching Middleware với LRU cache và ETag support
 */

// Setup LRU cache
const cache = new LRU({
  max: 1000, // Maximum number of entries
  ttl: 5 * 60 * 1000, // 5 minutes default TTL
  updateAgeOnGet: true, // Update age when getting from cache
  updateAgeOnHas: true, // Update age when checking exists
  allowStale: false, // Don't return stale entries
  dispose: (value, key) => {
    // Cleanup function when item is evicted
    if (value && typeof value === 'object' && value.cleanup) {
      value.cleanup();
    }
  }
});

/**
 * Generate ETag từ response data
 */
const generateETag = (data) => {
  if (typeof data === 'string') {
    return `"${Buffer.from(data).toString('base64').slice(0, 16)}"`;
  }
  
  const json = JSON.stringify(data);
  const hash = require('crypto')
    .createHash('md5')
    .update(json)
    .digest('base64')
    .slice(0, 16);
    
  return `"${hash}"`;
};

/**
 * Cache middleware với flexible options
 */
export const cacheResponse = (options = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    maxSize = 1000, // Maximum cache entries
    includeUser = false, // Include user ID in cache key
    generateCustomKey, // Custom cache key generator
    conditional = true, // Support conditional requests với ETag
  } = options;

  return async (req, res, next) => {
    // Generate cache key
    let cacheKey;
    
    if (generateCustomKey) {
      cacheKey = generateCustomKey(req);
    } else {
      // Default cache key: method + path + user (if includeUser)
      const baseKey = `${req.method}:${req.path}`;
      const userKey = includeUser && req.user ? `:${req.user.uid}` : '';
      cacheKey = `${baseKey}${userKey}`;
    }

    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if we have a cached response
    const cached = cache.get(cacheKey);
    
    if (cached) {
      // Check conditional request support
      if (conditional) {
        const clientETag = req.headers['if-none-match'];
        
        if (clientETag && clientETag === cached.etag) {
          // Client has fresh version
          res.status(304).end();
          return;
        }
      }

      // Return cached response
      res.set({
        'Cache-Control': `public, max-age=${Math.floor(cached.ttl / 1000)}`,
        'ETag': cached.etag,
        'X-Cache': 'HIT'
      });
      
      res.status(cached.status).json(cached.data);
      return;
    }

    // Cache the response
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    
    // Override response methods
    res.json = (data) => {
      try {
        // Generate ETag
        const etag = generateETag(data);
        
        // Store in cache
        const cacheEntry = {
          data,
          status: res.statusCode,
          etag,
          ttl,
          timestamp: Date.now(),
          cleanup: () => {
            // Cleanup function
          }
        };
        
        cache.set(cacheKey, cacheEntry, { ttl });
        
        // Set cache headers
        res.set({
          'Cache-Control': `public, max-age=${Math.floor(ttl / 1000)}`,
          'ETag': etag,
          'X-Cache': 'MISS'
        });
        
        // Call original json method
        return originalJson(data);
      } catch (error) {
        console.error('Cache response error:', error);
        return originalJson(data);
      }
    };

    res.status = (statusCode) => {
      res.locals.statusCode = statusCode;
      return originalStatus(statusCode);
    };

    next();
  };
};

/**
 * Cache middleware cho static data (không phụ thuộc user)
 */
export const cacheStatic = (ttl = 30 * 60 * 1000) => { // 30 minutes
  return cacheResponse({
    ttl,
    includeUser: false,
    conditional: true
  });
};

/**
 * Cache middleware cho user-specific data
 */
export const cacheUserData = (ttl = 5 * 60 * 1000) => { // 5 minutes
  return cacheResponse({
    ttl,
    includeUser: true,
    conditional: true
  });
};

/**
 * No cache middleware - cho sensitive data
 */
export const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Cache': 'BYPASS'
  });
  next();
};

/**
 * Invalidate cache patterns
 */
export const invalidateCache = (pattern) => {
  const regex = new RegExp(pattern);
  let deleted = 0;
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      deleted++;
    }
  }
  
  console.log(`Cache invalidated: ${deleted} entries matched pattern ${pattern}`);
  return deleted;
};

/**
 * Invalidate cache by user
 */
export const invalidateUserCache = (uid) => {
  return invalidateCache(`:GET:.*:${uid}$`);
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    maxSize: cache.max,
    ttl: cache.ttl,
    entries: Array.from(cache.keys()).map(key => {
      const value = cache.get(key);
      return {
        key,
        age: Date.now() - value.timestamp,
        ttl: value.ttl,
        status: value.status
      };
    })
  };
};

/**
 * Cache key generator cho specific patterns
 */
export const generateCacheKey = {
  // Key cho user profile data
  userProfile: (req) => `GET:/api/user/profile:${req.user.uid}`,
  
  // Key cho quiz data
  quiz: (quizId) => `GET:/api/quiz/${quizId}`,
  
  // Key cho subjects list
  subjects: (req) => `GET:/api/subjects:${req.user?.uid || 'anonymous'}`,
  
  // Key cho courses list
  courses: (req) => `GET:/api/courses:${req.user?.uid || 'anonymous'}`,
  
  // Key cho orders
  orders: (req) => `GET:/api/orders:${req.user.uid}`
};

/**
 * Middleware để set custom cache headers
 */
export const setCacheHeaders = (headers) => {
  return (req, res, next) => {
    Object.entries(headers).forEach(([key, value]) => {
      res.set(key, value);
    });
    next();
  };
};

/**
 * Conditional request middleware
 */
export const handleConditionalRequests = async (req, res, next) => {
  // Generate ETag từ request data nếu cần
  if (req.method === 'GET' && !req.headers['if-none-match']) {
    // Client doesn't have ETag, we'll provide one
    req.generateETag = true;
  }
  
  next();
};

// Periodic cache cleanup
setInterval(() => {
  const stats = cache.getStats();
  console.log(`Cache stats: ${stats.size}/${stats.maxSize} entries`);
  
  // Clean up expired entries
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Every minute

// Health check endpoint data can be cached for longer
export const cacheHealthData = (ttl = 60 * 1000) => { // 1 minute
  return cacheResponse({
    ttl,
    includeUser: false,
    conditional: true,
    generateCustomKey: () => 'GET:/health'
  });
};