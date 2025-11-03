# API Optimization Documentation

## Tổng quan
Tài liệu này mô tả các cải tiến về API endpoints và performance đã được thực hiện cho hệ thống Azota E-Learning.

## 🚀 Các cải tiến chính

### 1. Input Validation & Sanitization

#### Features:
- **Zod Schema Validation**: Sử dụng Zod cho type-safe validation
- **Input Sanitization**: Loại bỏ ký tự nguy hiểm, XSS prevention
- **SQL Injection Prevention**: Bảo vệ Firestore queries
- **Rate Limiting**: Basic rate limiting cho tất cả endpoints

#### Files:
- `middleware/validation.js` - Validation middleware và schemas
- `utils/security.js` - Security utilities

#### Usage:
```javascript
import { validateBody, schemas } from '../middleware/validation.js';

const middleware = validateBody(schemas.createAccessKey);
```

### 2. Enhanced Authentication & Authorization

#### Features:
- **JWT Validation**: Enhanced Firebase Auth token validation
- **Role-Based Access Control (RBAC)**: Role checking với caching
- **Token Revocation**: Kiểm tra revoked tokens
- **User Activity Logging**: Log user actions cho audit
- **Role Cache**: In-memory caching cho user roles

#### Files:
- `middleware/auth.js` - Authentication middleware
- Caching với TTL 5 phút

#### Usage:
```javascript
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// Authenticate user
await authenticateToken(req, res, next);

// Check admin role
await requireAdmin(req, res, next);
```

### 3. Response Caching

#### Features:
- **LRU Cache**: In-memory cache với LRU eviction
- **ETag Support**: Conditional requests với ETag
- **Cache Invalidation**: Pattern-based cache invalidation
- **TTL Configuration**: Customizable cache expiration

#### Files:
- `middleware/caching.js` - Caching middleware

#### Usage:
```javascript
import { cacheResponse, cacheStatic } from '../middleware/caching.js';

// Cache response với custom TTL
const cacheMiddleware = cacheResponse({ ttl: 300000 }); // 5 minutes

// Cache static data
const staticCache = cacheStatic(); // 30 minutes default
```

### 4. Optimized Firebase Operations

#### Features:
- **Batch Operations**: Bulk Firestore operations (max 400)
- **Transactions**: Atomic operations với retry logic
- **Error Handling**: Structured error responses
- **Query Helpers**: Pagination và filtering utilities
- **Performance Monitoring**: Operation timing và logging

#### Files:
- `lib/firebaseOptimized.js` - Optimized Firebase operations

#### Usage:
```javascript
import { batchManager, transactionManager, FirebaseErrorHandler } from '../lib/firebaseOptimized.js';

// Batch operations
batchManager.startBatch();
batchManager.create('collection', 'docId', data);
await batchManager.commit();

// Transaction với retry
const result = await transactionManager.execute(async (transaction) => {
  // Transaction logic
  return result;
});
```

### 5. Security Improvements

#### Features:
- **Security Headers**: CSP, XSS protection, HSTS
- **Input Sanitization**: XSS và injection prevention
- **Rate Limiting**: Request throttling
- **Security Logging**: Audit trail cho security events
- **CSRF Protection**: Token validation utilities

#### Files:
- `utils/security.js` - Security utilities
- Applied headers trong tất cả endpoints

#### Headers Applied:
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## 📁 File Structure

```
/api/
├── middleware/
│   ├── validation.js      # Input validation & rate limiting
│   ├── auth.js            # JWT auth & RBAC
│   └── caching.js         # Response caching
├── utils/
│   └── security.js        # Security utilities
├── lib/
│   ├── firebaseOptimized.js # Optimized Firebase ops
│   ├── firebaseAdmin.js   # Original Firebase setup
│   └── helpers.js         # Original helpers
└── endpoints/
    ├── createAccessKeyOptimized.js
    ├── redeemAccessKeyOptimized.js
    ├── requestOrderOptimized.js
    ├── grantRoleOptimized.js
    └── testOptimized.js
```

## 🔧 API Endpoints

### 1. Create Access Key (Optimized)
- **Method**: POST
- **Path**: `/api/create-access-key-optimized`
- **Auth Required**: Admin
- **Rate Limit**: 100 requests/15 minutes
- **Features**:
  - Input validation
  - Unique key generation
  - Atomic transactions
  - Security logging
  - Cache invalidation

### 2. Redeem Access Key (Optimized)
- **Method**: POST
- **Path**: `/api/redeem-access-key-optimized`
- **Auth Required**: User (student/teacher/admin)
- **Rate Limit**: 50 requests/15 minutes
- **Features**:
  - Input validation
  - Atomic redemption
  - User activity logging
  - Cache invalidation

### 3. Request Order (Optimized)
- **Method**: POST
- **Path**: `/api/request-order-optimized`
- **Auth Required**: User
- **Rate Limit**: 30 requests/hour
- **Features**:
  - Cart validation
  - Quiz count calculation
  - Transaction safety
  - Order creation

### 4. Grant Role (Optimized)
- **Method**: POST
- **Path**: `/api/grant-role-optimized`
- **Auth Required**: Admin
- **Rate Limit**: 10 requests/hour
- **Features**:
  - Admin-only operation
  - Role change logging
  - Security event tracking
  - Transaction safety

### 5. Test Endpoint
- **Method**: GET
- **Path**: `/api/test`
- **Auth**: Optional
- **Features**:
  - Middleware status check
  - Cache statistics
  - Security headers verification

## 🛡️ Security Features

### Input Validation
```javascript
// Example validation schema
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
```

### Security Headers
```javascript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};
```

### Rate Limiting
```javascript
// Basic rate limiting
const rateLimiter = rateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes
```

## 🚀 Performance Improvements

### Batch Operations
```javascript
// Create multiple documents atomically
const batch = new BatchQueue();
batch.startBatch();
batch.create('users', 'uid1', userData1);
batch.create('users', 'uid2', userData2);
await batch.commit();
```

### Transaction with Retry
```javascript
// Atomic operation với automatic retry
const result = await transactionManager.execute(async (transaction) => {
  // Transaction logic
  return result;
}, {
  maxRetries: 3,
  baseDelay: 100
});
```

### Response Caching
```javascript
// Cache response với ETag support
const cachedResponse = cacheResponse({
  ttl: 300000, // 5 minutes
  includeUser: true, // User-specific cache
  conditional: true  // ETag support
});
```

## 📊 Monitoring & Logging

### User Activity Logging
```javascript
// Automatic activity tracking
const logActivity = logUserActivity('create_access_key');
await logActivity(req, res, next);
```

### Security Event Logging
```javascript
// Security event tracking
logSecurityEvent('ROLE_GRANTED', {
  targetUid: uid,
  newRole: role,
  adminUid: adminUid
}, req);
```

### Error Handling
```javascript
// Structured error responses
const errorResponse = FirebaseErrorHandler.handleError(error, {
  endpoint: 'createAccessKey',
  method: req.method,
  userId: req.user?.uid
});
```

## 🔄 Migration Guide

### Từ endpoints cũ sang optimized:

1. **Create Access Key**:
   - Cũ: `createAccessKey.js`
   - Mới: `createAccessKeyOptimized.js`

2. **Redeem Access Key**:
   - Cũ: `redeemAccessKey.js`
   - Mới: `redeemAccessKeyOptimized.js`

3. **Request Order**:
   - Cũ: `requestOrder.js`
   - Mới: `requestOrderOptimized.js`

4. **Grant Role**:
   - Cũ: `grantRole.js`
   - Mới: `grantRoleOptimized.js`

### Sử dụng optimized endpoints:
- Các optimized endpoints có suffix `Optimized`
- Giữ nguyên functionality nhưng thêm security và performance
- Có thể migrate dần từng endpoint

## 🧪 Testing

### Test Endpoint
```bash
GET /api/test
```
Response bao gồm:
- Middleware status
- Cache statistics
- Security headers verification
- Available endpoints

### Test Authentication
```bash
# With auth
curl -H "Authorization: Bearer <token>" /api/test

# Without auth (optional)
curl /api/test
```

## 📝 Best Practices

1. **Always validate input** trước khi xử lý
2. **Use transactions** cho atomic operations
3. **Implement rate limiting** cho sensitive endpoints
4. **Log security events** cho audit trail
5. **Cache static data** để improve performance
6. **Use proper HTTP status codes**
7. **Sanitize all inputs** để prevent XSS/SQL injection

## 🔧 Configuration

### Environment Variables
```bash
# Firebase configuration
FIREBASE_SERVICE_ACCOUNT_KEY=<service_account_json>

# Rate limiting (optional)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000  # 15 minutes
```

### Dependencies
```json
{
  "firebase-admin": "^11.0.0",
  "zod": "^3.22.4",
  "lru-cache": "^10.0.1"
}
```

---

## Kết luận

Các cải tiến này giúp:
- ✅ **Secure**: Bảo vệ chống XSS, SQL injection, rate limiting
- ✅ **Fast**: Caching, batch operations, optimized queries
- ✅ **Reliable**: Transactions, error handling, monitoring

API hiện tại đã được tối ưu hóa toàn diện và sẵn sàng cho production use.