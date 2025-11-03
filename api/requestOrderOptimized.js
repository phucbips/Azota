import { z } from 'zod';
import { rateLimit, schemas } from '../middleware/validation.js';
import { authenticateToken, requireAuthenticated, logUserActivity } from '../middleware/auth.js';
import { cacheResponse, invalidateUserCache } from '../middleware/caching.js';
import { securityHeaders } from '../utils/security.js';
import { 
  batchManager, 
  transactionManager, 
  FirebaseErrorHandler,
  getQuizIdsFromCart 
} from '../lib/firebaseOptimized.js';

// Enhanced validation schema
const RequestOrderSchema = z.object({
  cart: z.object({
    subjects: z.array(z.string().min(1, 'Subject ID không được để trống')).optional().default([]),
    courses: z.array(z.string().min(1, 'Course ID không được để trống')).optional().default([])
  }).refine((cart) => {
    return cart.subjects.length > 0 || cart.courses.length > 0;
  }, {
    message: 'Giỏ hàng phải có ít nhất một môn học hoặc khóa học'
  }),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'momo', 'zalopay', 'unknown']).optional().default('unknown'),
  amount: z.number().min(0, 'Số tiền không được âm').max(10000000, 'Số tiền quá lớn').optional().default(0),
  notes: z.string().max(500, 'Ghi chú không được quá 500 ký tự').optional()
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

  // Apply rate limiting (30 requests per hour to prevent spam)
  const rateLimiter = rateLimit(30, 60 * 60 * 1000);
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
    const validatedData = await RequestOrderSchema.parseAsync(req.body);
    const { cart, paymentMethod, amount, notes } = validatedData;

    // Authenticate user
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => err ? reject(err) : resolve());
    });

    // Check user is authenticated
    await new Promise((resolve, reject) => {
      requireAuthenticated(req, res, (err) => err ? reject(err) : resolve());
    });

    // Log user activity
    const logActivity = logUserActivity('create_order');
    await new Promise((resolve, reject) => {
      logActivity(req, res, (err) => err ? reject(err) : resolve());
    });

    // Validate cart items exist and get quiz count
    const cartValidation = await validateCartItems(cart);

    if (!cartValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng chứa mục không hợp lệ',
        details: cartValidation.errors
      });
    }

    // Create order using transaction for consistency
    const orderResult = await transactionManager.execute(async (transaction) => {
      const orderData = {
        userId: req.user.uid,
        userEmail: req.user.email,
        cart: {
          subjects: cart.subjects,
          courses: cart.courses
        },
        paymentMethod,
        amount,
        notes: notes || null,
        status: 'pending',
        quizCount: cartValidation.quizCount,
        estimatedValue: cartValidation.estimatedValue,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create order document
      const orderRef = transaction.db.collection('orders').doc();
      transaction.create(orderRef, orderData);

      // Update user activity
      const activityRef = transaction.db.collection('userActivity').doc();
      transaction.set(activityRef, {
        uid: req.user.uid,
        action: 'order_created',
        orderId: orderRef.id,
        cartSummary: {
          subjectsCount: cart.subjects.length,
          coursesCount: cart.courses.length,
          quizCount: cartValidation.quizCount
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        method: req.method,
        url: req.url
      });

      return {
        orderId: orderRef.id,
        data: orderData
      };
    });

    // Invalidate user-related caches
    await invalidateUserCache(req.user.uid);

    // Success response
    res.status(201).json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        status: 'pending',
        estimatedValue: cartValidation.estimatedValue,
        quizCount: cartValidation.quizCount,
        paymentMethod,
        amount,
        createdAt: new Date()
      },
      message: 'Tạo đơn hàng thành công. Vui lòng chờ admin xử lý.'
    });

    // Log successful order creation
    console.log(`Order created: ${orderResult.orderId} by user: ${req.user.uid}`);

  } catch (error) {
    console.error('Error creating order:', error);

    const errorResponse = FirebaseErrorHandler.handleError(error, {
      endpoint: 'requestOrder',
      method: req.method,
      userId: req.user?.uid,
      cart: req.body?.cart ? {
        subjects: req.body.cart.subjects?.length || 0,
        courses: req.body.cart.courses?.length || 0
      } : null
    });

    // Determine appropriate status code
    let statusCode = 400;
    if (errorResponse.code === 'AUTH_TOKEN_INVALID') {
      statusCode = 401;
    } else if (errorResponse.code === 'INSUFFICIENT_ROLE') {
      statusCode = 403;
    }

    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Validate cart items and get summary
 */
async function validateCartItems(cart) {
  try {
    const errors = [];
    let totalQuizzes = 0;
    let estimatedValue = 0;

    // Validate subjects
    if (cart.subjects.length > 0) {
      const subjectDocs = await Promise.all(
        cart.subjects.map(async (subjectId) => {
          try {
            const doc = await db.collection('subjects').doc(subjectId).get();
            return { id: subjectId, exists: doc.exists, data: doc.data() };
          } catch (error) {
            errors.push(`Không thể kiểm tra subject: ${subjectId}`);
            return { id: subjectId, exists: false, error: error.message };
          }
        })
      );

      subjectDocs.forEach(doc => {
        if (!doc.exists) {
          errors.push(`Subject không tồn tại: ${doc.id}`);
        } else {
          const quizIds = doc.data.quizIds || [];
          totalQuizzes += quizIds.length;
          estimatedValue += quizIds.length * 50000; // Assume 50k per quiz
        }
      });
    }

    // Validate courses
    if (cart.courses.length > 0) {
      const courseDocs = await Promise.all(
        cart.courses.map(async (courseId) => {
          try {
            const doc = await db.collection('courses').doc(courseId).get();
            return { id: courseId, exists: doc.exists, data: doc.data() };
          } catch (error) {
            errors.push(`Không thể kiểm tra course: ${courseId}`);
            return { id: courseId, exists: false, error: error.message };
          }
        })
      );

      courseDocs.forEach(doc => {
        if (!doc.exists) {
          errors.push(`Course không tồn tại: ${doc.id}`);
        } else {
          const quizIds = doc.data.quizIds || [];
          totalQuizzes += quizIds.length;
          estimatedValue += quizIds.length * 100000; // Assume 100k per course quiz
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      quizCount: totalQuizzes,
      estimatedValue
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Lỗi kiểm tra giỏ hàng: ${error.message}`],
      quizCount: 0,
      estimatedValue: 0
    };
  }
}