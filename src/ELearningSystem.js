import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, useRef } from 'react';
import { Sparkles, BookOpen, Users, BarChart3, LogOut, ShoppingCart, Plus, Trash2, AlertCircle, CheckCircle2, XCircle, Trophy, Clock, Eye, Play, Home, Key, CreditCard, Package, GraduationCap, Settings, Shield, Edit, Save, X, MoreVertical, ChevronDown, UserPlus, Lock, Mail, Server, Loader2, BrainCircuit, Send, Ticket } from 'lucide-react';

// Import Error Boundary and Loading Components
import ErrorBoundary from './components/ErrorBoundary';
import { 
  GlobalLoader, 
  InlineLoader, 
  CardSkeleton, 
  TableSkeleton, 
  FormSkeleton,
  QuizCardSkeleton,
  UserDashboardSkeleton,
  ProgressBar,
  StepProgress,
  DotsLoader
} from './components/LoadingComponents';

import KickedModal from './components/KickedModal';

// Import validation hooks
import { useFormValidation, useErrorHandler, useLoadingState, useAsyncOperation } from './hooks/useFormValidation';
import { validationSchemas } from './utils/validation';

// ✨ Import Enhanced Components
import EnhancedToastManager, { useEnhancedToast } from './components/EnhancedToast';
import EnhancedButton, { 
  SuccessButton, 
  DangerButton, 
  MagicalButton, 
  ActionButton,
  RainbowButton 
} from './components/EnhancedButton';
import EnhancedModal, { 
  SuccessModal, 
  ErrorModal, 
  ConfirmModal, 
  MagicalModal,
  AchievementModal,
  LoadingModal 
} from './components/EnhancedModal';
import EnhancedLoginPage from './components/EnhancedLoginPage';

// Import Toast Manager (Legacy fallback)
import ToastManager from './components/Toast';

// =====================================================
// Firebase SDK Imports
// =====================================================
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  getIdTokenResult
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp,
  limit,
  orderBy,
  startAfter,
  endBefore,
  enableNetwork,
  disableNetwork,
  getDocs
} from "firebase/firestore";
// ⚡️ ĐÃ XÓA: import { getFunctions, httpsCallable } from 'firebase/functions';

// =====================================================
// Firebase Configuration with Environment Variables
// =====================================================

// Validate required environment variables
const validateFirebaseConfig = () => {
  const required = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN', 
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing Firebase environment variables:', missing);
    return false;
  }
  return true;
};

// Environment-based Firebase config with fallback
const getFirebaseConfig = () => {
  // Try to get from environment variables first
  const envConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  // Check if all required environment variables are present
  const hasEnvConfig = validateFirebaseConfig();
  
  if (hasEnvConfig) {
    console.log('✅ Using Firebase config from environment variables');
    return envConfig;
  } else {
    // Fallback to hardcoded config for development
    console.warn('⚠️ Using hardcoded Firebase config (development fallback). Please configure environment variables for production.');
    return {
      apiKey: "AIzaSyBLeBmdJ85IhfeJ7sGBHOlSjUmYJ6V_YIY",
      authDomain: "thpt-chi-linh.firebaseapp.com",
      projectId: "thpt-chi-linh",
      storageBucket: "thpt-chi-linh.firebasestorage.app",
      messagingSenderId: "59436766218",
      appId: "1:59436766218:web:8621e33cc12f6129e6fbf3",
      measurementId: "G-442TZLSK9J"
    };
  }
};

const firebaseConfig = getFirebaseConfig();

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================================
// FIREBASE OPTIMIZATION CONSTANTS
// =====================================================

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_TTL: 30 * 60 * 1000,   // 30 minutes for user data
  PUBLIC_DATA_TTL: 10 * 60 * 1000, // 10 minutes for public data
  MAX_CACHE_SIZE: 50, // Maximum cache entries
  OFFLINE_TIMEOUT: 30000, // 30 seconds for offline detection
};

// Session configuration
const SESSION_CONFIG = {
  TOKEN_REFRESH_INTERVAL: 45 * 60 * 1000, // 45 minutes
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  MIN_ACTIVITY_INTERVAL: 30 * 1000, // 30 seconds
};

// Pagination defaults
const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  ADMIN_PAGE_SIZE: 50,
};

// Debounce configuration
const DEBOUNCE_CONFIG = {
  SEARCH_DELAY: 300,
  UPDATE_DELAY: 500,
  RESIZE_DELAY: 250,
};

// Performance monitoring
let firebaseCallCount = 0;
let cacheHitCount = 0;

// ⚡️ MỚI: Thêm URL API Vercel của bạn - Sử dụng environment variable với fallback
const VERCEL_API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:3000');

console.log('🔗 Using API URL:', VERCEL_API_URL); 

// =====================================================
// Utility Functions
// =====================================================

const generateSessionToken = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return "0 đ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// =====================================================
// FIREBASE OPTIMIZATION UTILITIES
// =====================================================

// Cache utilities
class FirebaseCache {
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

  generateKey(collection, params = {}) {
    return `${collection}_${JSON.stringify(params)}`;
  }
}

// Global cache instances
const firebaseCache = new FirebaseCache();

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle utility
const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
};

// Network status tracking
const isOnline = () => navigator.onLine;
let isFirebaseOnline = true;

// Offline queue for batch operations
const offlineQueue = [];
let isProcessingQueue = false;

// Firebase call tracking
const trackFirebaseCall = (operation) => {
  firebaseCallCount++;
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔥 Firebase call #${firebaseCallCount}: ${operation}`);
  }
};

// Cache hit tracking
const trackCacheHit = () => {
  cacheHitCount++;
};

// Performance monitoring
const getPerformanceStats = () => {
  return {
    totalCalls: firebaseCallCount,
    cacheHits: cacheHitCount,
    cacheHitRate: firebaseCallCount > 0 ? (cacheHitCount / firebaseCallCount * 100).toFixed(2) + '%' : '0%',
    cacheSize: firebaseCache.cache.size,
    isOnline: isOnline(),
    isFirebaseOnline,
    offlineQueueLength: offlineQueue.length
  };
};

// =====================================================
// OFFLINE SUPPORT UTILITIES
// =====================================================

// Enable/disable Firebase network
const enableFirebaseNetwork = async () => {
  try {
    await enableNetwork(db);
    isFirebaseOnline = true;
    console.log('📡 Firebase network enabled');
  } catch (error) {
    console.error('Failed to enable Firebase network:', error);
  }
};

const disableFirebaseNetwork = async () => {
  try {
    await disableNetwork(db);
    isFirebaseOnline = false;
    console.log('📴 Firebase network disabled');
  } catch (error) {
    console.error('Failed to disable Firebase network:', error);
  }
};

// Queue operations for offline processing
const queueOfflineOperation = (operation) => {
  offlineQueue.push({
    ...operation,
    timestamp: Date.now()
  });
  
  if (!isProcessingQueue) {
    processOfflineQueue();
  }
};

// Process queued operations when back online
const processOfflineQueue = async () => {
  if (isProcessingQueue || offlineQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (offlineQueue.length > 0 && isOnline()) {
    const operation = offlineQueue.shift();
    
    try {
      switch (operation.type) {
        case 'create':
          await addDoc(collection(db, operation.collection), operation.data);
          break;
        case 'update':
          await updateDoc(doc(db, operation.collection, operation.id), operation.data);
          break;
        case 'delete':
          await deleteDoc(doc(db, operation.collection, operation.id));
          break;
      }
      console.log(`✅ Processed offline operation: ${operation.type}`);
    } catch (error) {
      console.error('Failed to process offline operation:', error);
      // Re-queue failed operations
      offlineQueue.unshift(operation);
      break;
    }
  }
  
  isProcessingQueue = false;
};

// Listen for online/offline events
window.addEventListener('online', async () => {
  console.log('🌐 Back online - processing offline queue');
  await enableFirebaseNetwork();
  await processOfflineQueue();
});

window.addEventListener('offline', async () => {
  console.log('📴 Gone offline - queuing operations');
  await disableFirebaseNetwork();
});

// =====================================================
// OPTIMIZED FIREBASE OPERATIONS
// =====================================================

// Optimized document fetch with caching
const getCachedDocument = async (collection, id, cacheTTL = CACHE_CONFIG.DEFAULT_TTL, bypassCache = false) => {
  const cacheKey = firebaseCache.generateKey(collection, { id });
  
  // Check cache first
  if (!bypassCache) {
    const cached = firebaseCache.get(cacheKey);
    if (cached) {
      trackCacheHit();
      return cached;
    }
  }

  try {
    trackFirebaseCall(`getDoc:${collection}:${id}`);
    const docRef = doc(db, collection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      firebaseCache.set(cacheKey, data, cacheTTL);
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${collection}/${id}:`, error);
    throw error;
  }
};

// Optimized collection query with pagination
const getCachedCollection = async (collection, options = {}) => {
  const {
    page = 1,
    limit = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    orderBy = 'name',
    direction = 'asc',
    filters = {},
    search = '',
    cacheTTL = CACHE_CONFIG.PUBLIC_DATA_TTL,
    bypassCache = false
  } = options;

  const cacheKey = firebaseCache.generateKey(collection, options);
  
  // Check cache for simple queries (no pagination, no complex filters)
  const isCacheable = page === 1 && limit === PAGINATION_CONFIG.DEFAULT_PAGE_SIZE && 
                     Object.keys(filters).length === 0 && !search;
  
  if (isCacheable && !bypassCache) {
    const cached = firebaseCache.get(cacheKey);
    if (cached) {
      trackCacheHit();
      return cached;
    }
  }

  try {
    trackFirebaseCall(`query:${collection}:${JSON.stringify(options)}`);
    
    let q = collection(db, collection);
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });
    
    // Apply search
    if (search) {
      q = query(q, where('name', '>=', search), where('name', '<=', search + '\uf8ff'));
    }
    
    // Apply ordering and pagination
    q = query(q, orderBy(orderBy, direction));
    
    if (limit > 0) {
      q = query(q, limit(limit));
    }
    
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Get total count for pagination info
    let totalCount = items.length;
    if (page === 1 && !search && Object.keys(filters).length === 0) {
      // For simple queries, we can get a more accurate count
      const countSnapshot = await getDocs(collection(db, collection));
      totalCount = countSnapshot.size;
    }
    
    const result = {
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
    
    // Cache the result for simple queries
    if (isCacheable && !bypassCache) {
      firebaseCache.set(cacheKey, result, cacheTTL);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    throw error;
  }
};

// Batch operations
const executeBatchOperation = async (operations = []) => {
  if (operations.length === 0) return { success: true, writtenCount: 0 };
  
  // Queue offline if not online
  if (!isOnline() || !isFirebaseOnline) {
    operations.forEach(op => queueOfflineOperation(op));
    return { success: true, writtenCount: operations.length, offline: true };
  }
  
  try {
    trackFirebaseCall(`batch:${operations.length} operations`);
    const batch = writeBatch(db);
    let writtenCount = 0;
    
    operations.forEach(op => {
      const { type, collection, id, data } = op;
      const docRef = id ? doc(db, collection, id) : doc(db, collection);
      
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
    
    // Clear related cache entries
    operations.forEach(op => {
      if (op.collection) {
        const cacheKey = firebaseCache.generateKey(op.collection);
        firebaseCache.delete(cacheKey);
      }
    });
    
    return { success: true, writtenCount };
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
};

// =====================================================
// ENHANCED AUTHENTICATION UTILITIES
// =====================================================

// Session management
class SessionManager {
  constructor() {
    this.sessionData = this.loadSessionData();
    this.activityTimer = null;
    this.refreshTimer = null;
    this.isActive = false;
  }

  loadSessionData() {
    try {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const token = rememberMe ? localStorage.getItem('authToken') : sessionStorage.getItem('authToken');
      const expiresAt = rememberMe ? 
        localStorage.getItem('tokenExpiresAt') : 
        sessionStorage.getItem('tokenExpiresAt');
      
      return {
        token,
        expiresAt: expiresAt ? parseInt(expiresAt) : null,
        rememberMe,
        lastActivity: Date.now()
      };
    } catch (error) {
      console.error('Error loading session data:', error);
      return {};
    }
  }

  saveSessionData(token, expiresIn, rememberMe = false) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    const storage = rememberMe ? localStorage : sessionStorage;
    const nonPersistentStorage = rememberMe ? sessionStorage : localStorage;
    
    try {
      storage.setItem('authToken', token);
      storage.setItem('tokenExpiresAt', expiresAt.toString());
      storage.setItem('rememberMe', rememberMe.toString());
      
      // Clean non-persistent storage
      nonPersistentStorage.removeItem('authToken');
      nonPersistentStorage.removeItem('tokenExpiresAt');
      
      this.sessionData = {
        token,
        expiresAt,
        rememberMe,
        lastActivity: Date.now()
      };
      
      return true;
    } catch (error) {
      console.error('Error saving session data:', error);
      return false;
    }
  }

  clearSession() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('tokenExpiresAt');
      sessionStorage.removeItem('tokenExpiresAt');
      
      this.sessionData = {};
      this.stopTimers();
      
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  isTokenValid() {
    if (!this.sessionData.token || !this.sessionData.expiresAt) {
      return false;
    }
    return Date.now() < this.sessionData.expiresAt;
  }

  shouldRefreshToken() {
    if (!this.isTokenValid()) return false;
    
    const timeUntilExpiry = this.sessionData.expiresAt - Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
    
    return timeUntilExpiry <= refreshThreshold;
  }

  updateActivity() {
    this.sessionData.lastActivity = Date.now();
    
    // Only reset timers if session is active
    if (this.isActive) {
      this.startActivityTimer();
    }
  }

  startActivityTimer() {
    this.stopActivityTimer();
    
    this.activityTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.sessionData.lastActivity;
      
      // Auto logout after inactivity
      if (inactiveTime > SESSION_CONFIG.SESSION_TIMEOUT) {
        console.log('🔒 Auto logout due to inactivity');
        this.clearSession();
        window.location.reload();
      }
    }, SESSION_CONFIG.MIN_ACTIVITY_INTERVAL);
  }

  stopActivityTimer() {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  startRefreshTimer() {
    this.stopRefreshTimer();
    
    this.refreshTimer = setInterval(async () => {
      if (this.shouldRefreshToken()) {
        console.log('🔄 Auto refreshing token...');
        try {
          const user = auth.currentUser;
          if (user) {
            await user.getIdToken(true);
            console.log('✅ Token refreshed automatically');
          }
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
        }
      }
    }, SESSION_CONFIG.TOKEN_REFRESH_INTERVAL);
  }

  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  start(rememberMe = false) {
    this.isActive = true;
    this.startActivityTimer();
    this.startRefreshTimer();
    
    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    this.activityListener = () => this.updateActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, this.activityListener, true);
    });
  }

  stop() {
    this.isActive = false;
    this.stopTimers();
    
    if (this.activityListener) {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => {
        document.removeEventListener(event, this.activityListener, true);
      });
      this.activityListener = null;
    }
  }

  stopTimers() {
    this.stopActivityTimer();
    this.stopRefreshTimer();
  }
}

// Global session manager instance
const sessionManager = new SessionManager();

// ⚡️ MỚI: Tách hàm tính tổng ra ngoài để dùng chung
const calculateCartTotal = (cart, subjects, courses) => {
  const subjectsTotal = cart.subjects.reduce((sum, subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return sum + (subject ? subject.price : 0);
  }, 0);

  const coursesTotal = cart.courses.reduce((sum, courseId) => {
    const course = courses.find(c => c.id === courseId);
    return sum + (course ? course.price : 0);
  }, 0);

  return subjectsTotal + coursesTotal;
};

// Hàm gọi Gemini API
const callGeminiAPI = async (prompt) => {
  const apiKey = ""; // API key sẽ được cung cấp bởi môi trường
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      return candidate.content.parts[0].text;
    } else {
      return "Không thể nhận được gợi ý vào lúc này.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Đã xảy ra lỗi khi kết nối với AI.";
  }
};


// =====================================================
// React Context
// =====================================================
const AppContext = createContext(null);
const DataContext = createContext(null);

// =====================================================
// HOOK: useAuth (Quản lý Xác thực & Trạng thái) - OPTIMIZED
// =====================================================
const useAuth = () => {
  const [authState, setAuthState] = useState({
    authUser: null, // User object từ Firebase Auth
    currentUser: null, // User data từ Firestore
    role: 'student', // Vai trò (student, teacher, admin)
    isAuthReady: false, // Auth đã sẵn sàng (đã check xong)
    isLoading: true, // Đang tải data người dùng từ Firestore
    needsOnboarding: false, // Cần điền thông tin
    kicked: false, // Bị đá do đăng nhập nơi khác
    sessionConflict: null, // Phát hiện xung đột phiên
    rememberMe: false, // Remember me preference
    lastActivity: null, // Last user activity
    performanceStats: null, // Performance monitoring
  });

  const [localToken, setLocalToken] = useState(() => sessionManager.sessionData.token);
  const userDocUnsubscribe = useRef(null);
  const authStateUnsubscribe = useRef(null);

  // Debounced performance stats update
  const updatePerformanceStats = useCallback(
    debounce(() => {
      setAuthState(prev => ({
        ...prev,
        performanceStats: getPerformanceStats()
      }));
    }, 2000), // Update every 2 seconds max
    []
  );

  const handleSignOut = useCallback(async () => {
    try {
      // Clean up session
      sessionManager.stop();
      sessionManager.clearSession();
      
      // Clean up listeners
      if (authStateUnsubscribe.current) {
        authStateUnsubscribe.current();
        authStateUnsubscribe.current = null;
      }
      
      if (userDocUnsubscribe.current) {
        userDocUnsubscribe.current();
        userDocUnsubscribe.current = null;
      }
      
      // Clear caches
      firebaseCache.clear();
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Reset state
      setLocalToken(null);
      setAuthState({
        authUser: null,
        currentUser: null,
        role: 'student',
        isAuthReady: true,
        isLoading: false,
        needsOnboarding: false,
        kicked: false,
        sessionConflict: null,
        rememberMe: false,
        lastActivity: null,
        performanceStats: getPerformanceStats(),
      });
      
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  // 1. Lắng nghe thay đổi trạng thái Auth (Đăng nhập/Đăng xuất) - OPTIMIZED
  useEffect(() => {
    // Clean up existing listener
    if (authStateUnsubscribe.current) {
      authStateUnsubscribe.current();
      authStateUnsubscribe.current = null;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Người dùng đã đăng nhập
          console.log('👤 User authenticated:', user.uid);
          
          // Get fresh token with caching
          const tokenResult = await user.getIdTokenResult(true);
          const role = tokenResult.claims.role || 'student';
          
          // Get cached user data first for faster login
          let currentUser = null;
          try {
            currentUser = await getCachedDocument('users', user.uid, CACHE_CONFIG.USER_TTL);
          } catch (error) {
            console.warn('Failed to get cached user data:', error);
          }
          
          // Check session conflict (optimized)
          if (currentUser?.activeLoginToken) {
            const currentLocalToken = sessionManager.sessionData.token;
            
            if (currentUser.activeLoginToken !== currentLocalToken) {
              console.log('⚠️ Session conflict detected');
              setAuthState(prev => ({
                ...prev,
                isAuthReady: true,
                isLoading: false,
                sessionConflict: { authUser: user, role: role }
              }));
              return;
            }
          }
          
          // Check remember me preference
          const rememberMe = localStorage.getItem('rememberMe') === 'true';
          
          // Setup session
          if (rememberMe) {
            sessionManager.start(true);
          } else {
            sessionManager.start(false);
          }
          
          // Continue with login
          proceedToLogin(user, role, rememberMe);

        } else {
          // Người dùng đã đăng xuất
          console.log('👋 User signed out');
          
          sessionManager.stop();
          handleSignOut();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    authStateUnsubscribe.current = unsubscribe;
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleSignOut]);

  // 2. Hàm tiếp tục đăng nhập (sau khi check conflict) - OPTIMIZED
  const proceedToLogin = useCallback(async (user, role, rememberMe = false) => {
    const newSessionToken = generateSessionToken();
    
    // Save session data with proper storage
    sessionManager.saveSessionData(newSessionToken, 3600, rememberMe); // 1 hour default
    setLocalToken(newSessionToken);

    setAuthState(prev => ({
      ...prev,
      authUser: user,
      role: role,
      isAuthReady: true,
      isLoading: true, // Bắt đầu tải data Firestore
      sessionConflict: null,
      rememberMe,
      lastActivity: Date.now(),
    }));

    // Update performance stats
    updatePerformanceStats();

    // Update session token in DB (non-blocking)
    try {
      const operations = [{
        type: 'update',
        collection: 'users',
        id: user.uid,
        data: { 
          activeLoginToken: newSessionToken,
          lastLoginAt: serverTimestamp(),
          loginCount: (user.reloadUserInfo?.loginCount || 0) + 1
        }
      }];
      
      executeBatchOperation(operations);
    } catch (error) {
      console.warn("Lỗi cập nhật session token:", error);
      // Don't fail login for this error
    }
  }, [updatePerformanceStats]);

  // 3. Lắng nghe thay đổi tài liệu người dùng (Firestore) - OPTIMIZED
  useEffect(() => {
    // Clean up existing listener
    if (userDocUnsubscribe.current) {
      userDocUnsubscribe.current();
      userDocUnsubscribe.current = null;
    }

    if (authState.isAuthReady && authState.authUser) {
      const userDocRef = doc(db, 'users', authState.authUser.uid);
      
      const unsubscribeUserDoc = onSnapshot(userDocRef, 
        // Success callback with optimization
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = { uid: docSnap.id, ...docSnap.data() };
            
            // Cache user data
            const cacheKey = firebaseCache.generateKey('users', { uid: authState.authUser.uid });
            firebaseCache.set(cacheKey, userData, CACHE_CONFIG.USER_TTL);
            
            // Kiểm tra bị đá (session management)
            const dbToken = userData.activeLoginToken;
            if (localToken && dbToken && dbToken !== localToken) {
              console.log('👢 User kicked from other device');
              handleSignOut();
              setAuthState(prev => ({ ...prev, kicked: true }));
              return;
            }

            // Check if user needs onboarding
            const needsOnboarding = !userData.hoTen || !userData.lop;
            
            setAuthState(prev => ({
              ...prev,
              currentUser: userData,
              isLoading: false,
              needsOnboarding,
              lastActivity: Date.now(),
            }));
            
            updatePerformanceStats();
          } else {
            // Người dùng mới, cần onboarding
            setAuthState(prev => ({
              ...prev,
              currentUser: null,
              isLoading: false,
              needsOnboarding: true,
              lastActivity: Date.now(),
            }));
          }
        },
        // Error callback
        (error) => {
          console.error("Lỗi lắng nghe user document:", error);
          
          // Try to get cached data on error
          if (authState.authUser) {
            getCachedDocument('users', authState.authUser.uid)
              .then(userData => {
                if (userData) {
                  setAuthState(prev => ({
                    ...prev,
                    currentUser: userData,
                    isLoading: false,
                    needsOnboarding: !userData.hoTen || !userData.lop,
                  }));
                } else {
                  setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    needsOnboarding: true,
                  }));
                }
              })
              .catch(() => {
                setAuthState(prev => ({ 
                  ...prev, 
                  isLoading: false,
                  needsOnboarding: true 
                }));
              });
          }
        }
      );
      
      userDocUnsubscribe.current = unsubscribeUserDoc;
      
    } else if (authState.isAuthReady && !authState.authUser) {
      // Đã sẵn sàng nhưng chưa đăng nhập
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        lastActivity: Date.now(),
      }));
    }

    return () => {
      if (userDocUnsubscribe.current) {
        userDocUnsubscribe.current();
        userDocUnsubscribe.current = null;
      }
    };
  }, [authState.isAuthReady, authState.authUser, localToken, handleSignOut, updatePerformanceStats]);
  
  // Hàm cập nhật needsOnboarding (cho OnboardingForm)
  const setOnboardingCompleted = () => {
    setAuthState(prev => ({ ...prev, needsOnboarding: false }));
  };

  return { 
    ...authState, 
    handleSignOut, 
    proceedToLogin,
    setOnboardingCompleted 
  };
};

// =====================================================
// =====================================================
// HOOK: usePublicData (Tải dữ liệu chung) - OPTIMIZED
// =====================================================
const usePublicData = (options = {}) => {
  const { isAuthReady, authUser } = useContext(AppContext);
  const [data, setData] = useState({
    subjects: [],
    courses: [],
    quizzes: [],
    loading: true,
    error: null,
    pagination: {
      subjects: { page: 1, hasNext: false, totalPages: 1 },
      courses: { page: 1, hasNext: false, totalPages: 1 },
      quizzes: { page: 1, hasNext: false, totalPages: 1 },
    },
    lastUpdated: null,
  });

  const { 
    enableRealTime = true,
    useCache = true,
    batchSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    filters = {}
  } = options;

  const unsubscribes = useRef([]);

  // Debounced data update to prevent excessive re-renders
  const updateData = useCallback(
    debounce((updates) => {
      setData(prev => ({
        ...prev,
        ...updates,
        lastUpdated: Date.now(),
      }));
    }, 100), // Batch updates every 100ms
    []
  );

  // Optimized collection listener with conditional updates
  const createOptimizedListener = useCallback((collectionName, filterOptions = {}) => {
    if (!enableRealTime) return null;

    // Use simple queries for better performance
    let q = collection(db, collectionName);
    
    // Apply filters if provided
    Object.entries(filterOptions).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });
    
    // Add ordering for consistent results
    const orderField = collectionName === 'subjects' || collectionName === 'courses' ? 'name' : 'title';
    q = query(q, orderBy(orderField, 'asc'));
    
    // Limit initial load for better performance
    if (enableRealTime) {
      q = query(q, limit(batchSize * 2)); // Load a bit more for smooth scrolling
    }

    return onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cache the data
        if (useCache) {
          const cacheKey = firebaseCache.generateKey(collectionName, filterOptions);
          firebaseCache.set(cacheKey, items, CACHE_CONFIG.PUBLIC_DATA_TTL);
        }

        updateData({
          [collectionName]: items,
          error: null,
          loading: false,
        });

      },
      (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        
        // Try to get cached data on error
        if (useCache) {
          const cacheKey = firebaseCache.generateKey(collectionName, filterOptions);
          const cached = firebaseCache.get(cacheKey);
          
          if (cached) {
            updateData({
              [collectionName]: cached,
              error: null,
              loading: false,
            });
            return;
          }
        }
        
        updateData({
          error: `Lỗi tải ${collectionName}: ${error.message}`,
          loading: false,
        });
      }
    );
  }, [enableRealTime, useCache, batchSize, updateData]);

  // Load data with optimized fetching
  const loadData = useCallback(async () => {
    if (!isAuthReady || !authUser) {
      updateData({ loading: false });
      return;
    }

    try {
      updateData({ loading: true, error: null });

      // Try to get cached data first for immediate display
      const cachePromises = ['subjects', 'courses', 'quizzes'].map(async (collection) => {
        if (useCache) {
          const cacheKey = firebaseCache.generateKey(collection, filters);
          const cached = firebaseCache.get(cacheKey);
          if (cached) {
            return { [collection]: cached };
          }
        }
        return null;
      });

      const cachedResults = await Promise.allSettled(cachePromises);
      const immediateData = {};
      
      cachedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const collection = ['subjects', 'courses', 'quizzes'][index];
          immediateData[collection] = result.value[collection];
        }
      });

      if (Object.keys(immediateData).length > 0) {
        updateData({
          ...immediateData,
          loading: false,
        });
      }

      // Set up real-time listeners
      if (enableRealTime) {
        // Clean up existing listeners
        unsubscribes.current.forEach(unsub => unsub && unsub());
        unsubscribes.current = [];

        // Create new listeners
        ['subjects', 'courses', 'quizzes'].forEach(collection => {
          const unsub = createOptimizedListener(collection, filters);
          if (unsub) {
            unsubscribes.current.push(unsub);
          }
        });
      }

      updateData({ loading: false });

    } catch (error) {
      console.error('Error loading public data:', error);
      updateData({
        error: 'Lỗi khi tải dữ liệu: ' + error.message,
        loading: false,
      });
    }
  }, [isAuthReady, authUser, enableRealTime, useCache, filters, createOptimizedListener, updateData]);

  // Pagination function
  const loadPage = useCallback(async (collection, page = 1, limit = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE) => {
    try {
      trackFirebaseCall(`paginate:${collection}:${page}:${limit}`);
      
      const result = await getCachedCollection(collection, {
        page,
        limit,
        orderBy: collection === 'quizzes' ? 'title' : 'name',
        filters,
        bypassCache: !useCache,
        cacheTTL: CACHE_CONFIG.PUBLIC_DATA_TTL
      });

      setData(prev => ({
        ...prev,
        [collection]: result.items,
        pagination: {
          ...prev.pagination,
          [collection]: result.pagination,
        },
        lastUpdated: Date.now(),
      }));

      return result;
    } catch (error) {
      console.error(`Error loading page ${page} of ${collection}:`, error);
      setData(prev => ({
        ...prev,
        error: `Lỗi tải trang ${page} của ${collection}: ${error.message}`,
      }));
      return null;
    }
  }, [filters, useCache]);

  // Initial load effect
  useEffect(() => {
    loadData();
    
    return () => {
      // Clean up listeners
      unsubscribes.current.forEach(unsub => unsub && unsub());
      unsubscribes.current = [];
    };
  }, [loadData]);

  // Expose pagination methods
  const paginationMethods = useMemo(() => ({
    loadSubjectsPage: (page = 1) => loadPage('subjects', page),
    loadCoursesPage: (page = 1) => loadPage('courses', page),
    loadQuizzesPage: (page = 1) => loadPage('quizzes', page),
  }), [loadPage]);

  return {
    ...data,
    ...paginationMethods,
    refresh: loadData,
  };
};

// =====================================================
// =====================================================
// HOOK: useAdminData (Tải dữ liệu cho Admin) - OPTIMIZED
// =====================================================
const useAdminData = (role, options = {}) => {
  const [adminData, setAdminData] = useState({
    users: [],
    transactions: [],
    orders: [],
    loading: true,
    error: null,
    pagination: {
      users: { page: 1, hasNext: false, totalPages: 1 },
      transactions: { page: 1, hasNext: false, totalPages: 1 },
      orders: { page: 1, hasNext: false, totalPages: 1 },
    },
    lastUpdated: null,
    stats: null,
  });

  const {
    enableRealTime = true,
    useCache = true,
    pageSize = PAGINATION_CONFIG.ADMIN_PAGE_SIZE,
    enableStats = true,
  } = options;

  const unsubscribes = useRef([]);

  // Debounced admin data update
  const updateAdminData = useCallback(
    debounce((updates) => {
      setAdminData(prev => ({
        ...prev,
        ...updates,
        lastUpdated: Date.now(),
      }));
    }, 150), // Slightly longer delay for admin data
    []
  );

  // Create optimized admin listener
  const createAdminListener = useCallback((collectionName, filterOptions = {}) => {
    if (!enableRealTime || role !== 'admin') return null;

    let q = collection(db, collectionName);
    
    // Apply filters for admin data
    Object.entries(filterOptions).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });
    
    // Order by creation date for admin views (most recent first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Limit for better performance
    q = query(q, limit(pageSize));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cache admin data with longer TTL
        if (useCache) {
          const cacheKey = firebaseCache.generateKey(`admin_${collectionName}`, filterOptions);
          firebaseCache.set(cacheKey, items, CACHE_CONFIG.ADMIN_DATA_TTL || CACHE_CONFIG.PUBLIC_DATA_TTL);
        }

        updateAdminData({
          [collectionName]: items,
          error: null,
        });

      },
      (error) => {
        console.error(`Error fetching admin ${collectionName}:`, error);
        
        // Try cached data for admin queries
        if (useCache) {
          const cacheKey = firebaseCache.generateKey(`admin_${collectionName}`, filterOptions);
          const cached = firebaseCache.get(cacheKey);
          
          if (cached) {
            updateAdminData({
              [collectionName]: cached,
              error: null,
            });
            return;
          }
        }
        
        updateAdminData({
          error: `Lỗi tải ${collectionName}: ${error.message}`,
        });
      }
    );
  }, [enableRealTime, role, pageSize, useCache, updateAdminData]);

  // Load admin data with performance optimization
  const loadAdminData = useCallback(async () => {
    if (role !== 'admin') {
      updateAdminData({ loading: false });
      return;
    }

    try {
      updateAdminData({ loading: true, error: null });

      // Load cached data first for immediate display
      const adminCollections = ['users', 'transactions', 'orders'];
      const cachePromises = adminCollections.map(async (collection) => {
        if (useCache) {
          const cacheKey = firebaseCache.generateKey(`admin_${collection}`);
          const cached = firebaseCache.get(cacheKey);
          if (cached) {
            return { [collection]: cached };
          }
        }
        return null;
      });

      const cachedResults = await Promise.allSettled(cachePromises);
      const immediateData = {};
      
      cachedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const collection = adminCollections[index];
          immediateData[collection] = result.value[collection];
        }
      });

      if (Object.keys(immediateData).length > 0) {
        updateAdminData({
          ...immediateData,
          loading: false,
        });
      }

      // Set up real-time listeners for admin
      if (enableRealTime) {
        // Clean up existing listeners
        unsubscribes.current.forEach(unsub => unsub && unsub());
        unsubscribes.current = [];

        // Create optimized listeners
        adminCollections.forEach(collection => {
          const unsub = createAdminListener(collection);
          if (unsub) {
            unsubscribes.current.push(unsub);
          }
        });
      }

      // Load admin stats if enabled
      if (enableStats) {
        loadAdminStats();
      }

      updateAdminData({ loading: false });

    } catch (error) {
      console.error('Error loading admin data:', error);
      updateAdminData({
        error: 'Lỗi khi tải dữ liệu admin: ' + error.message,
        loading: false,
      });
    }
  }, [role, enableRealTime, useCache, createAdminListener, enableStats]);

  // Load admin statistics
  const loadAdminStats = useCallback(async () => {
    try {
      trackFirebaseCall('admin_stats');
      
      // Get basic counts from cached data first
      const users = await getCachedDocument('admin_stats', 'users_count') || { count: 0 };
      const transactions = await getCachedDocument('admin_stats', 'transactions_count') || { count: 0 };
      const orders = await getCachedDocument('admin_stats', 'orders_count') || { count: 0 };
      
      // Try to get real counts if cache is stale
      const currentTime = Date.now();
      const cached = firebaseCache.get('admin_stats');
      const isCacheStale = !cached || (currentTime - cached.timestamp) > CACHE_CONFIG.PUBLIC_DATA_TTL;
      
      if (isCacheStale && isFirebaseOnline) {
        // Get real counts (this is expensive, so we do it less frequently)
        const [userSnap, transSnap, orderSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'transactions')),
          getDocs(collection(db, 'orders'))
        ]);
        
        const stats = {
          totalUsers: userSnap.size,
          totalTransactions: transSnap.size,
          totalOrders: orderSnap.size,
          timestamp: currentTime,
        };
        
        // Cache the stats
        firebaseCache.set('admin_stats', stats, CACHE_CONFIG.PUBLIC_DATA_TTL);
        
        updateAdminData({ stats });
      } else if (cached) {
        updateAdminData({ stats: cached });
      }
      
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  }, []);

  // Pagination functions for admin data
  const loadAdminPage = useCallback(async (collection, page = 1, limit = pageSize) => {
    try {
      trackFirebaseCall(`admin_paginate:${collection}:${page}:${limit}`);
      
      // For admin data, we might want different ordering
      const orderByField = collection === 'transactions' || collection === 'orders' ? 'createdAt' : 'hoTen';
      
      const result = await getCachedCollection(collection, {
        page,
        limit,
        orderBy: orderByField,
        direction: 'desc',
        bypassCache: !useCache,
        cacheTTL: CACHE_CONFIG.ADMIN_DATA_TTL || CACHE_CONFIG.PUBLIC_DATA_TTL
      });

      setAdminData(prev => ({
        ...prev,
        [collection]: result.items,
        pagination: {
          ...prev.pagination,
          [collection]: result.pagination,
        },
        lastUpdated: Date.now(),
      }));

      return result;
    } catch (error) {
      console.error(`Error loading admin page ${page} of ${collection}:`, error);
      setAdminData(prev => ({
        ...prev,
        error: `Lỗi tải trang ${page} của ${collection}: ${error.message}`,
      }));
      return null;
    }
  }, [pageSize, useCache]);

  // Initial load effect
  useEffect(() => {
    loadAdminData();
    
    return () => {
      // Clean up listeners
      unsubscribes.current.forEach(unsub => unsub && unsub());
      unsubscribes.current = [];
    };
  }, [loadAdminData]);

  // Expose admin pagination methods
  const adminPaginationMethods = useMemo(() => ({
    loadUsersPage: (page = 1) => loadAdminPage('users', page),
    loadTransactionsPage: (page = 1) => loadAdminPage('transactions', page),
    loadOrdersPage: (page = 1) => loadAdminPage('orders', page),
    refreshStats: loadAdminStats,
  }), [loadAdminPage, loadAdminStats]);

  return {
    ...adminData,
    ...adminPaginationMethods,
    refresh: loadAdminData,
  };
};

// =====================================================
// MODAL: ConfirmLoginModal (Xác nhận Đăng nhập)
// =====================================================
const ConfirmLoginModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-500" size={64} />
          <h2 className="text-2xl font-bold mt-6 mb-4">Phát hiện phiên đăng nhập</h2>
          <p className="text-gray-600 mb-8">
            Tài khoản này đã được đăng nhập trên một thiết bị khác. Bạn có muốn tiếp tục và đăng xuất thiết bị kia không?
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};


// =====================================================
// PAGE: LoginPage (Đăng nhập / Đăng ký)
// =====================================================
const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Load saved email if remember me was previously checked
  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('savedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, [rememberMe]);

  // Optimized authentication handler with remember me
  const handleAuthAction = useCallback(async (action) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged sẽ tự động xử lý với remember me preference
        
      } else if (action === 'register') {
        if (password.length < 6) {
          throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        
      } else if (action === 'login') {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('savedEmail');
        }
        
        // Store remember me preference
        localStorage.setItem('rememberMe', rememberMe.toString());
        
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Get fresh token and save session
        const token = await userCredential.user.getIdToken();
        sessionManager.saveSessionData(token, 3600, rememberMe); // 1 hour default
        
        console.log(`✅ Login successful${rememberMe ? ' (remembered)' : ''}`);
        
      } else if (action === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Đã gửi email reset mật khẩu! Vui lòng kiểm tra hòm thư.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      // Enhanced error handling
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản với email này.');
          break;
        case 'auth/wrong-password':
          setError('Sai mật khẩu. Vui lòng thử lại.');
          break;
        case 'auth/email-already-in-use':
          setError('Email này đã được sử dụng.');
          break;
        case 'auth/weak-password':
          setError('Mật khẩu quá yếu.');
          break;
        case 'auth/invalid-email':
          setError('Email không hợp lệ.');
          break;
        case 'auth/popup-closed-by-user':
          setError('Bạn đã đóng cửa sổ đăng nhập Google.');
          break;
        case 'auth/network-request-failed':
          setError('Lỗi mạng. Vui lòng kiểm tra kết nối internet.');
          break;
        case 'auth/too-many-requests':
          setError('Quá nhiều lần thử. Vui lòng thử lại sau.');
          break;
        default:
          setError('Đã xảy ra lỗi: ' + err.message);
      }
      
      // Clear remember me on error to prevent infinite loops
      if (action === 'login') {
        localStorage.removeItem('rememberMe');
        setRememberMe(false);
      }
      
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe]);

  // Performance monitoring for login page
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Login page performance stats:', getPerformanceStats());
    }
  }, []);
  
  const AuthButton = ({ action, children, className }) => (
    <button
      onClick={() => handleAuthAction(action)}
      disabled={loading}
      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:transform hover:scale-[1.02] ${className}`}
    >
      {loading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            E-Learning System
          </h1>
          <p className="text-gray-600">Nền tảng học tập trực tuyến</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Lỗi</p>
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Thành công</p>
            <p>{message}</p>
          </div>
        )}

        <div className="mb-6 flex border-b">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 font-semibold ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Đăng nhập</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 font-semibold ${mode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Đăng ký</button>
        </div>

        {mode === 'reset' ? (
          <div className="space-y-6">
            <p className="text-gray-600 text-center">Nhập email để nhận link reset mật khẩu.</p>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <AuthButton action="reset" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:from-purple-700 hover:to-blue-700">
              Gửi link Reset
            </AuthButton>
            <button onClick={() => setMode('login')} className="w-full text-blue-600 font-semibold">
              Quay lại Đăng nhập
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            {/* Remember Me and Forgot Password */}
            {mode === 'login' && (
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Ghi nhớ đăng nhập</span>
                </label>
                <button 
                  onClick={() => setMode('reset')} 
                  className="text-sm text-blue-600 hover:text-blue-800 transition"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
            
            {mode === 'login' && (
              <AuthButton action="login" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:from-blue-700 hover:to-cyan-600">
                Đăng nhập
              </AuthButton>
            )}
            
            {mode === 'register' && (
              <AuthButton action="register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:from-purple-700 hover:to-blue-700">
                Đăng ký
              </AuthButton>
            )}

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">hoặc</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <AuthButton action="google" className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </AuthButton>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// PAGE: OnboardingForm (Hoàn tất thông tin)
// =====================================================
const OnboardingForm = ({ user, onComplete }) => {
  const [hoTen, setHoTen] = useState('');
  const [lop, setLop] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hoTen.trim()) {
      setError('⚠️ Vui lòng nhập họ và tên!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Lấy session token hiện tại từ localStorage
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) {
        throw new Error("Không tìm thấy session token, vui lòng đăng nhập lại.");
      }

      const userData = {
        hoTen: hoTen.trim(),
        lop,
        email: user.email,
        unlockedQuizzes: [],
        activeLoginToken: sessionToken, // Dùng token đã được tạo khi đăng nhập
        createdAt: serverTimestamp() // Dùng timestamp của server
      };

      // Tạo document mới (sẽ khớp với 'allow create' rule)
      await setDoc(doc(db, 'users', user.uid), userData);
      
      onComplete(); // Báo cho AppRouter biết là đã xong

    } catch (err) {
      console.error(err);
      setError('Lỗi khi lưu thông tin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Users size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng bạn!</h2>
          <p className="text-gray-600">Vui lòng hoàn tất thông tin cá nhân</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              👤 Họ và tên
            </label>
            <input
              type="text"
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🎓 Lớp
            </label>
            <select
              value={lop}
              onChange={(e) => setLop(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </form>
      </div>
    </div>
  );
};


// =====================================================
// COMPONENT: ShoppingCartComponent (Giỏ hàng)
// =====================================================
const ShoppingCartComponent = ({ cart, onRemoveItem, onCheckout, loading }) => {
  const { subjects, courses } = useContext(DataContext);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (!subjects.length || !courses.length) return;
    
    const detectCartConflicts = () => {
      const detected = [];
      
      const courseSubjectIds = cart.courses
        .flatMap(courseId => {
          const course = courses.find(c => c.id === courseId);
          return course ? course.subjectIds : [];
        });

      const selectedSubjectIds = cart.subjects;

      selectedSubjectIds.forEach(subjectId => {
        if (courseSubjectIds.includes(subjectId)) {
          const subject = subjects.find(s => s.id === subjectId);
          const conflictCourse = courses.find(c => c.subjectIds.includes(subjectId) && cart.courses.includes(c.id));
          
          if (subject && conflictCourse) {
            detected.push({
              type: 'subject_in_course',
              subjectName: subject.name,
              courseName: conflictCourse.name
            });
          }
        }
      });
      return detected;
    };

    setConflicts(detectCartConflicts());
  }, [cart, subjects, courses]);

  // ⚡️ ĐÃ DI CHUYỂN HÀM calculateTotal ra ngoài

  const isEmpty = cart.subjects.length === 0 && cart.courses.length === 0;
  const total = calculateCartTotal(cart, subjects, courses); // ⚡️ Dùng hàm mới

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <ShoppingCart size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Giỏ hàng</h2>
        <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">
          {cart.subjects.length + cart.courses.length}
        </span>
      </div>

      {isEmpty ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingCart size={64} className="mx-auto mb-4 opacity-30" />
          <p>Giỏ hàng trống</p>
        </div>
      ) : (
        <>
          {conflicts.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold text-yellow-800 mb-2">⚠️ Phát hiện trùng lặp!</p>
                  {conflicts.map((conflict, i) => (
                    <p key={i} className="text-sm text-yellow-700">
                      • Môn <strong>{conflict.subjectName}</strong> đã có trong <strong>{conflict.courseName}</strong>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
            {cart.subjects.map(subjectId => {
              const subject = subjects.find(s => s.id === subjectId);
              if (!subject) return null;

              return (
                <div key={subjectId} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200 hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <BookOpen className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{subject.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(subject.price)}</p>
                    </div>
                  </div>
                  <DangerButton
                    onClick={() => onRemoveItem('subject', subjectId)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 size={16} />
                  </DangerButton>
                </div>
              );
            })}

            {cart.courses.map(courseId => {
              const course = courses.find(c => c.id === courseId);
              if (!course) return null;

              return (
                <div key={courseId} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-xl border-2 border-purple-200 hover:shadow-md transition-all duration-200 hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                      <Package className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{course.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(course.price)}</p>
                    </div>
                  </div>
                  <DangerButton
                    onClick={() => onRemoveItem('course', courseId)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 size={16} />
                  </DangerButton>
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-gradient bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-700">Tổng cộng:</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(total)}
              </span>
            </div>

            <SuccessButton
              onClick={onCheckout}
              disabled={conflicts.length > 0 || loading}
              loading={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              size="lg"
            >
              <Send size={24} />
              {conflicts.length > 0 ? 'Vui lòng xóa môn trùng lặp' : 'Gửi yêu cầu duyệt'}
            </SuccessButton>
          </div>
        </>
      )}
    </div>
  );
};

// =====================================================
// COMPONENT: GeminiStudyHelper (Trợ lý AI Học tập)
// =====================================================
const GeminiStudyHelper = ({ quizTitle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [concepts, setConcepts] = useState('');

  const getConcepts = async () => {
    setLoading(true);
    setError('');
    setConcepts('');

    const prompt = `Bạn là một trợ lý gia sư. Một học sinh đang chuẩn bị làm bài tập về chủ đề: "${quizTitle}". 
Hãy liệt kê 3-5 khái niệm hoặc định lý cốt lõi quan trọng nhất mà học sinh cần ôn lại để làm tốt bài tập này. 
Trình bày dưới dạng gạch đầu dòng ngắn gọn.`;

    try {
      const result = await callGeminiAPI(prompt);
      setConcepts(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <BrainCircuit className="text-blue-600" size={28} />
        <h3 className="text-xl font-bold text-gray-800">Trợ lý AI: Gợi ý kiến thức</h3>
      </div>
      
      {!concepts && !loading && (
        <button
          onClick={getConcepts}
          className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Sparkles size={16} className="inline mr-2" />
          Lấy gợi ý
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" />
          <p>AI đang phân tích, vui lòng chờ...</p>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {concepts && (
        <div className="prose prose-sm max-w-none text-gray-700">
          <p>Để làm tốt chủ đề này, bạn nên ôn lại:</p>
          <pre className="whitespace-pre-wrap font-sans bg-white/50 p-4 rounded-lg">{concepts}</pre>
        </div>
      )}
    </div>
  );
};


// =====================================================
// PAGE: StudentDashboard (Trang của Học sinh)
// =====================================================
const StudentDashboard = ({ user, onLogout }) => {
  const { authUser } = useContext(AppContext); // ⚡️ MỚI: Lấy authUser để có uid
  const [view, setView] = useState('my-quizzes'); // 'shop', 'my-quizzes', 'redeem-key'
  const [shopTab, setShopTab] = useState('subjects'); // 'subjects', 'courses'
  const [cart, setCart] = useState({ subjects: [], courses: [] });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null); // {id, title, embedCode}
  
  const { subjects, courses, quizzes } = useContext(DataContext);
  
  const unlockedQuizzes = useMemo(() => {
    return (user.unlockedQuizzes || [])
      .map(quizId => quizzes.find(q => q.id === quizId))
      .filter(Boolean); // Lọc bỏ các quiz không tìm thấy
  }, [user.unlockedQuizzes, quizzes]);

  const addToCart = (type, id) => {
    if (type === 'subject') {
      if (!cart.subjects.includes(id)) {
        setCart({ ...cart, subjects: [...cart.subjects, id] });
      }
    } else if (type === 'course') {
      if (!cart.courses.includes(id)) {
        setCart({ ...cart, courses: [...cart.courses, id] });
      }
    }
  };

  const removeFromCart = (type, id) => {
    if (type === 'subject') {
      setCart({ ...cart, subjects: cart.subjects.filter(s => s !== id) });
    } else if (type === 'course') {
      setCart({ ...cart, courses: cart.courses.filter(c => c !== id) });
    }
  };

  // ⚡️ ĐÃ CẬP NHẬT: handleRequestOrder (dùng fetch)
  const handleRequestOrder = async () => {
    setPaymentLoading(true);
    try {
      // 1. Lấy token xác thực của người dùng
      if (!authUser) throw new Error("Người dùng chưa đăng nhập");
      const token = await authUser.getIdToken();
      
      // Lấy tổng số tiền
      const totalAmount = calculateCartTotal(cart, subjects, courses);

      // 2. Gọi API Vercel bằng fetch
      const response = await fetch(`${VERCEL_API_URL}/api/requestOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart: cart,
          userName: user.hoTen,
          amount: totalAmount, // Gửi thêm tổng tiền
          paymentMethod: 'Chờ duyệt' // Gửi thêm phương thức
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }

      // 3. Xử lý kết quả
      alert(result.message); // Hiển thị thông báo từ API
      setCart({ subjects: [], courses: [] }); // Xóa giỏ hàng

    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu:", err);
      alert("Lỗi khi gửi yêu cầu: " + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };
  
  // Xử lý mã nhúng (vô hiệu hóa chuột phải)
  const safeEmbedCode = useMemo(() => {
    if (!selectedQuiz?.embedCode) return '';
    
    let code = selectedQuiz.embedCode;
    // Thêm oncontextmenu="return false;"
    if (code.includes('<iframe')) {
      if (!code.includes('oncontextmenu')) {
        code = code.replace('<iframe', '<iframe oncontextmenu="return false;"');
      }
    }
    return code;
  }, [selectedQuiz]);
  
  // === Views ===
  
  const renderQuizViewer = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button 
        onClick={() => setSelectedQuiz(null)}
        className="flex items-center gap-2 text-blue-600 font-semibold mb-6"
      >
        <ChevronDown size={20} className="-rotate-90" />
        Quay lại
      </button>
      
      <h2 className="text-3xl font-bold mb-6">{selectedQuiz.title}</h2>
      
      <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden shadow-lg border">
        <div 
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: safeEmbedCode }} 
        />
      </div>
      
      <GeminiStudyHelper quizTitle={selectedQuiz.title} />
    </div>
  );

  const renderShop = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          
          <div className="flex gap-2 mb-6">
            <EnhancedButton
              onClick={() => setShopTab('subjects')}
              variant={shopTab === 'subjects' ? 'primary' : 'secondary'}
              className={shopTab === 'subjects' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }
              size="lg"
            >
              <BookOpen size={20} /> Môn học
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setShopTab('courses')}
              variant={shopTab === 'courses' ? 'primary' : 'secondary'}
              className={shopTab === 'courses' 
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }
              size="lg"
            >
              <Package size={20} /> Khóa học
            </EnhancedButton>
          </div>

          {shopTab === 'subjects' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map(subject => (
                  <div key={subject.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
                        <p className="text-gray-600 text-sm">{subject.quizIds?.length || 0} bài tập</p>
                      </div>
                      <BookOpen className="text-blue-600" size={32} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(subject.price)}</span>
                      <EnhancedButton
                        onClick={() => addToCart('subject', subject.id)}
                        disabled={cart.subjects.includes(subject.id)}
                        variant={cart.subjects.includes(subject.id) ? 'success' : 'primary'}
                        size="sm"
                        className={cart.subjects.includes(subject.id) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                        }
                      >
                        {cart.subjects.includes(subject.id) ? '✓ Đã thêm' : '+ Thêm'}
                      </EnhancedButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shopTab === 'courses' && (
            <div>
              <div className="space-y-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="text-purple-600" size={28} />
                          <h3 className="text-2xl font-bold">{course.name}</h3>
                        </div>
                        <p className="text-gray-600 mb-3">{course.quizIds?.length || 0} bài tập</p>
                        <div className="flex flex-wrap gap-2">
                          {course.subjectIds?.map(subId => {
                            const sub = subjects.find(s => s.id === subId);
                            return sub ? (
                              <span key={subId} className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-purple-700 border border-purple-200">
                                {sub.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-purple-200">
                      <div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{formatCurrency(course.price)}</span>
                      </div>
                      <EnhancedButton
                        onClick={() => addToCart('course', course.id)}
                        disabled={cart.courses.includes(course.id)}
                        variant={cart.courses.includes(course.id) ? 'success' : 'primary'}
                        size="md"
                        className={cart.courses.includes(course.id) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                        }
                      >
                        {cart.courses.includes(course.id) ? '✓ Đã thêm' : '+ Thêm vào giỏ'}
                      </EnhancedButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ShoppingCartComponent
              cart={cart}
              onRemoveItem={removeFromCart}
              onCheckout={handleRequestOrder} // ⚡️ Đã cập nhật
              loading={paymentLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderMyQuizzes = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold mb-8">Bài tập của tôi</h2>
      
      {unlockedQuizzes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Key size={64} className="mx-auto text-gray-300 mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">Bạn chưa có bài tập nào</h3>
          <p className="text-gray-500 mb-6">Vui lòng mua môn học hoặc khóa học để truy cập bài tập.</p>
          <button
            onClick={() => setView('shop')}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Đến cửa hàng
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unlockedQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle2 className="text-green-500" size={32} />
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">Đã mở khóa</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{quiz.title}</h3>
              </div>
              <button
                onClick={() => setSelectedQuiz(quiz)}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Play size={20} /> Bắt đầu làm
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ⚡️ MỚI: Giao diện nhập Key
  const RedeemKeyComponent = () => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // ⚡️ ĐÃ CẬP NHẬT: handleRedeem (dùng fetch)
    const handleRedeem = async (e) => {
      e.preventDefault();
      if (!key.trim()) {
        setError("Vui lòng nhập Key");
        return;
      }
      setLoading(true);
      setError('');
      setMessage('');
      try {
        // 1. Lấy token (dùng 'auth' toàn cục)
        const user = auth.currentUser;
        if (!user) throw new Error("Người dùng chưa đăng nhập");
        const token = await user.getIdToken();

        // 2. Gọi API Vercel bằng fetch
        const response = await fetch(`${VERCEL_API_URL}/api/redeemAccessKey`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          // Gửi { key: ... }
          body: JSON.stringify({ key: key.trim().toUpperCase() })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Lỗi không xác định");
        }

        // 3. Xử lý kết quả
        setMessage(result.message);
        setKey(''); // Xóa key
        // onSnapshot sẽ tự cập nhật UI

      } catch (err) {
        console.error("Lỗi kích hoạt key:", err);
        setError(err.message || "Key không hợp lệ hoặc đã hết hạn");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-8">Kích hoạt Key</h2>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600 mb-6">Nhập Key kích hoạt bạn nhận được từ Admin để mở khóa nội dung hoặc tính năng.</p>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6">
              {message}
            </div>
          )}
          
          <form onSubmit={handleRedeem} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Mã Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="enhanced-input w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 uppercase tracking-widest text-center text-lg font-mono bg-gradient-to-r from-white to-purple-50 transition-all duration-300 hover:shadow-lg"
              />
            </div>
            <SuccessButton
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full py-4 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              size="lg"
            >
              <Key size={20} />
              Kích hoạt Key
            </SuccessButton>
          </form>
        </div>
      </div>
    );
  };

  // === Main Return ===
  if (selectedQuiz) {
    return renderQuizViewer();
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-2xl relative overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-blue-500/20 animate-gradient-x"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="floating-orb absolute top-4 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="floating-orb absolute top-16 right-20 w-16 h-16 bg-white/15 rounded-full blur-lg animation-delay-1000"></div>
          <div className="floating-orb absolute bottom-8 left-1/3 w-12 h-12 bg-white/20 rounded-full blur-md animation-delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="flex justify-between items-center">
            <div className="hover-lift">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent drop-shadow-lg">
                👨‍🎓 {user.hoTen}
              </h1>
              <p className="text-emerald-100 mt-2 text-lg font-medium animate-slide-up animation-delay-300">
                Học sinh - Lớp {user.lop}
              </p>
            </div>
            <EnhancedButton
              onClick={onLogout}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm"
            >
              <LogOut size={20} />
              Đăng xuất
            </EnhancedButton>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-3 py-5">
            <EnhancedButton
              onClick={() => setView('my-quizzes')}
              variant={view === 'my-quizzes' ? 'primary' : 'secondary'}
              className={view === 'my-quizzes' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-gray-300'
              }
            >
              <CheckCircle2 size={20} /> Bài tập của tôi
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setView('shop')}
              variant={view === 'shop' ? 'primary' : 'secondary'}
              className={view === 'shop' 
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-gray-300'
              }
            >
              <ShoppingCart size={20} /> Cửa hàng
            </EnhancedButton>
            {/* ⚡️ MỚI: Nút Kích hoạt Key với Enhanced Button */}
            <EnhancedButton
              onClick={() => setView('redeem-key')}
              variant={view === 'redeem-key' ? 'primary' : 'secondary'}
              className={view === 'redeem-key' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-gray-300'
              }
            >
              <Key size={20} /> Kích hoạt Key
            </EnhancedButton>
              }`}
            >
              <Ticket size={20} /> Kích hoạt Key
            </button>
          </div>
        </div>
      </div>

      {view === 'shop' && renderShop()}
      {view === 'my-quizzes' && renderMyQuizzes()}
      {view === 'redeem-key' && <RedeemKeyComponent />} {/* ⚡️ MỚI */}
      
    </div>
  );
};

// =====================================================
// COMPONENT: GeminiQuestionSuggester (Gợi ý câu hỏi AI)
// =====================================================
const GeminiQuestionSuggester = ({ quizTitle, onAddQuestions }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState('');

  const getSuggestions = async () => {
    setLoading(true);
    setError('');
    setSuggestions('');

    const prompt = `Bạn là một trợ lý giáo viên. Hãy tạo 3 câu hỏi trắc nghiệm (A, B, C, D) ôn tập về chủ đề: "${quizTitle}". 
Không cần đáp án. Chỉ cần câu hỏi và các lựa chọn.
Định dạng:
1. [Câu hỏi 1]
    A. [Lựa chọn A]
    B. [Lựa chọn B]
    C. [Lựa chọn C]
    D. [Lựa chọn D]
2. [Câu hỏi 2]
    ...
`;

    try {
      const result = await callGeminiAPI(prompt);
      setSuggestions(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <BrainCircuit className="text-blue-600" size={28} />
        <h3 className="text-xl font-bold text-gray-800">AI: Gợi ý câu hỏi</h3>
      </div>
      
      <button
        onClick={getSuggestions}
        disabled={loading}
        className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        <Sparkles size={16} className="inline mr-2" />
        {loading ? 'Đang tạo...' : 'Tạo 3 câu hỏi gợi ý'}
      </button>

      {loading && (
        <div className="flex items-center gap-3 text-gray-600 mt-4">
          <Loader2 className="animate-spin" />
          <p>AI đang soạn câu hỏi, vui lòng chờ...</p>
        </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {suggestions && (
        <div className="mt-4">
          <pre className="whitespace-pre-wrap font-sans bg-white/50 p-4 rounded-lg text-sm text-gray-700">
            {suggestions}
          </pre>
          <p className="text-xs text-gray-500 mt-2">Lưu ý: Đây chỉ là gợi ý, bạn có thể chỉnh sửa lại trong mã nhúng.</p>
        </div>
      )}
    </div>
  );
};

// =====================================================
// PAGE: TeacherDashboard (Trang của Giáo viên)
// =====================================================
const TeacherDashboard = ({ user, onLogout }) => {
  const { authUser } = useContext(AppContext);
  // ⚡️ FIX 1: Lấy thêm subjects và courses từ context
  const { quizzes, loading: loadingQuizzes, subjects, courses } = useContext(DataContext);
  const [view, setView] = useState('quizzes'); // 'quizzes', 'profile'
  const [editingQuiz, setEditingQuiz] = useState(null); // null, 'new', hoặc { id, ... }
  const [formData, setFormData] = useState({ title: '', embedCode: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const myQuizzes = useMemo(() => {
    return quizzes.filter(q => q.createdBy === authUser.uid);
  }, [quizzes, authUser]);

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({ title: quiz.title, embedCode: quiz.embedCode });
    setFormError('');
  };
  
  const handleNew = () => {
    setEditingQuiz('new');
    setFormData({ title: '', embedCode: '' });
    setFormError('');
  };

  const handleCancel = () => {
    setEditingQuiz(null);
    setFormError('');
  };
  
  const handleDelete = async (quizId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác.")) {
      return;
    }
    
    setFormLoading(true);
    try {
      // 1. Xóa khỏi collection 'quizzes'
      const quizRef = doc(db, 'quizzes', quizId);
      await deleteDoc(quizRef);
      
      // 2. Xóa quizId khỏi tất cả 'subjects' và 'courses'
      const batch = writeBatch(db);

      // ⚡️ FIX 3: Dùng subjects và courses đã lấy từ context ở top-level
      subjects.forEach(subject => {
        if (subject.quizIds?.includes(quizId)) {
          const subjectRef = doc(db, 'subjects', subject.id);
          batch.update(subjectRef, {
            quizIds: arrayRemove(quizId)
          });
        }
      });
      
      courses.forEach(course => {
        if (course.quizIds?.includes(quizId)) {
          const courseRef = doc(db, 'courses', course.id);
          batch.update(courseRef, {
            quizIds: arrayRemove(quizId)
          });
        }
      });
      
      // 3. (Tùy chọn) Xóa quizId khỏi 'unlockedQuizzes' của users
      // Bỏ qua bước này để đơn giản, vì quizId không còn tồn tại sẽ tự động bị lọc
      
      await batch.commit();
      handleCancel();
      
    } catch (err) {
      console.error("Lỗi khi xóa bài tập:", err);
      setFormError("Lỗi khi xóa bài tập: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.embedCode) {
      setFormError("Vui lòng điền đầy đủ Tiêu đề và Mã nhúng.");
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      if (editingQuiz === 'new') {
        // Tạo mới
        await addDoc(collection(db, 'quizzes'), {
          ...formData,
          createdBy: authUser.uid,
          createdAt: serverTimestamp()
        });
      } else {
        // Cập nhật
        const quizRef = doc(db, 'quizzes', editingQuiz.id);
        await updateDoc(quizRef, {
          ...formData
        });
      }
      handleCancel();
      
    } catch (err) {
      console.error("Lỗi khi lưu bài tập:", err);
      setFormError("Lỗi khi lưu bài tập: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const renderQuizEditor = () => (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">
        {editingQuiz === 'new' ? 'Tạo bài tập mới' : 'Chỉnh sửa bài tập'}
      </h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề bài tập</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ví dụ: Bài tập Hàm số bậc nhất"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Mã nhúng (Quizizz, Azota...)</label>
          <textarea
            value={formData.embedCode}
            onChange={(e) => setFormData({...formData, embedCode: e.target.value})}
            placeholder='<iframe src="..."></iframe>'
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-sm"
          />
        </div>
        
        {formError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
            {formError}
          </div>
        )}
        
        <div className="flex justify-between items-center gap-4">
          <div>
            {editingQuiz !== 'new' && (
              <button
                type="button"
                onClick={() => handleDelete(editingQuiz.id)}
                disabled={formLoading}
                className="text-red-600 font-semibold px-6 py-3 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
              >
                <Trash2 size={16} className="inline mr-2" /> Xóa
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={formLoading}
              className="bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formLoading ? <Loader2 className="animate-spin" /> : <Save size={16} className="inline mr-2" />}
              {editingQuiz === 'new' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>

      <GeminiQuestionSuggester quizTitle={formData.title} />
    </div>
  );
  
  const renderQuizList = () => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Bài tập của tôi</h2>
        <button
          onClick={handleNew}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} /> Tạo bài tập mới
        </button>
      </div>
      
      {loadingQuizzes ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin mx-auto text-gray-400" size={48} />
        </div>
      ) : myQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <p className="text-gray-500">Bạn chưa tạo bài tập nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full min-w-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Mã nhúng</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myQuizzes.map(quiz => (
                <tr key={quiz.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-gray-800">{quiz.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {quiz.embedCode.substring(0, 50)}...
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(quiz)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">👩‍🏫 {user.hoTen}</h1>
              <p className="text-teal-100 mt-1">Giáo viên - Lớp {user.lop}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition"
            >
              <LogOut size={20} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
      
      {/* ⚡️ THAY ĐỔI: Kiểm tra quyền 'canCreateQuizzes' */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {user.canCreateQuizzes ? (
          editingQuiz ? renderQuizEditor() : renderQuizList()
        ) : (
          <div className="text-center p-12 bg-white rounded-lg shadow-lg">
            <Lock size={48} className="mx-auto text-gray-400 mb-6" />
            <h3 className="text-2xl font-bold mt-4">Bạn chưa được cấp quyền tạo bài tập</h3>
            <p className="text-gray-600 mt-2">Vui lòng liên hệ Admin để nhận Key kích hoạt tính năng này.</p>
            {/* Tương lai: Có thể thêm ô nhập key cho giáo viên tại đây */}
          </div>
        )}
      </div>
    </div>
  );
};


// =====================================================
// PAGE: AdminDashboard (Trang của Admin)
// =====================================================

// Component Quản lý Người dùng
const UserManager = ({ users }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ⚡️ ĐÃ CẬP NHẬT: grantRole (dùng fetch)
  const grantRole = async (uid, role) => {
    setLoading(true);
    setError('');
    try {
      // 1. Lấy token của Admin
      const user = auth.currentUser;
      if (!user) throw new Error("Admin chưa đăng nhập");
      const token = await user.getIdToken();

      // 2. Gọi API Vercel
      const response = await fetch(`${VERCEL_API_URL}/api/grantRole`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: uid, role: role })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }
      
      alert(`Thành công: ${result.message}`);
      // onSnapshot của useAdminData sẽ tự cập nhật UI

    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(`Thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {error && <div className="p-4 bg-red-100 text-red-700">{error}</div>}
      <table className="w-full min-w-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Họ tên</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vai trò</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.uid}>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="font-semibold text-gray-800">{user.hoTen}</p>
                <p className="text-sm text-gray-500">Lớp {user.lop}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-gray-700">{user.email}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.role ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {user.role}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">student</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <button
                  onClick={() => grantRole(user.uid, 'teacher')}
                  disabled={loading || user.role === 'teacher'}
                  className="bg-teal-100 text-teal-700 px-3 py-2 rounded-lg hover:bg-teal-200 transition text-sm disabled:opacity-50"
                >
                  Cấp quyền Teacher
                </button>
                <button
                  onClick={() => grantRole(user.uid, 'admin')}
                  disabled={loading || user.role === 'admin'}
                  className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm disabled:opacity-50"
                >
                  Cấp quyền Admin
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component Quản lý Nội dung (Chung cho Subjects, Courses, Quizzes)
const ContentManager = ({ type, items, onSave, onDelete }) => {
  const [editingItem, setEditingItem] = useState(null); // null, 'new', hoặc { id, ... }
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  
  const getEmptyForm = () => {
    switch (type) {
      case 'subjects': return { name: '', price: 0, quizIds: [] };
      case 'courses': return { name: '', price: 0, subjectIds: [], quizIds: [] };
      case 'quizzes': return { title: '', embedCode: '', createdBy: '' };
      default: return {};
    }
  };
  
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
  };
  
  const handleNew = () => {
    setEditingItem('new');
    setFormData(getEmptyForm());
  };
  
  const handleCancel = () => {
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price') {
      setFormData(f => ({ ...f, [name]: Number(value) }));
    } else if (name === 'quizIds' || name === 'subjectIds') {
      setFormData(f => ({ ...f, [name]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    await onSave(formData, editingItem === 'new' ? null : editingItem.id);
    setFormLoading(false);
    setEditingItem(null);
  };

  const renderForm = () => (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6">
          {editingItem === 'new' ? 'Tạo mới' : 'Chỉnh sửa'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.keys(formData).map(key => {
            if (key === 'id' || key === 'createdBy' || key.includes('At')) return null;
            
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const value = formData[key];
            
            if (key === 'embedCode') {
              return (
                <div key={key}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                  <textarea
                    name={key}
                    value={value}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-sm"
                  />
                </div>
              );
            }
            
            if (Array.isArray(value)) {
              return (
                <div key={key}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{label} (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    name={key}
                    value={value.join(', ')}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              );
            }
            
            return (
              <div key={key}>
                <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                <input
                  type={typeof value === 'number' ? 'number' : 'text'}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            );
          })}
          
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={formLoading}
              className="bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formLoading ? <Loader2 className="animate-spin" /> : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {editingItem && renderForm()}
      <div className="p-6 flex justify-between items-center">
        <h3 className="text-xl font-bold">Quản lý {type}</h3>
        <button
          onClick={handleNew}
          className="bg-blue-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} /> Tạo mới
        </button>
      </div>
      <table className="w-full min-w-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên / Tiêu đề</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Thông tin</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map(item => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="font-semibold text-gray-800">{item.name || item.title}</p>
                <p className="text-sm text-gray-500">{item.id}</p>
              </td>
              <td className="px-6 py-4">
                {item.price !== undefined && <p>Giá: {formatCurrency(item.price)}</p>}
                {item.quizIds && <p>Số quiz: {item.quizIds.length}</p>}
                {item.subjectIds && <p>Số môn: {item.subjectIds.length}</p>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component Cấp Key Thủ công
const ManualKeyGrant = ({ users, subjects, courses }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedItem, setSelectedItem] = useState(''); // 'subject_xxx' or 'course_xxx'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // ⚡️ ĐÃ CẬP NHẬT: handleSubmit (dùng fetch)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedItem) {
      setError("Vui lòng chọn người dùng và vật phẩm.");
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // 1. Lấy token của Admin
      const user = auth.currentUser;
      if (!user) throw new Error("Admin chưa đăng nhập");
      const token = await user.getIdToken();
      
      const [type, itemId] = selectedItem.split('_');
      
      // 2. Gọi API Vercel
      const response = await fetch(`${VERCEL_API_URL}/api/manualGrant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: selectedUser, type: type, itemId: itemId })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }

      setMessage(result.message);
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-xl font-bold mb-6">Cấp Key Trực tiếp (Manual Grant)</h3>
      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      {message && <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-lg">{message}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Người dùng</label>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Chọn --</option>
            {users.map(u => (
              <option key={u.uid} value={u.uid}>{u.hoTen} ({u.email})</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Vật phẩm (Môn học / Khóa học)</label>
          <select 
            value={selectedItem} 
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Chọn --</option>
            <optgroup label="Môn học">
              {subjects.map(s => (
                <option key={s.id} value={`subject_${s.id}`}>{s.name} ({formatCurrency(s.price)})</option>
              ))}
            </optgroup>
            <optgroup label="Khóa học">
              {courses.map(c => (
                <option key={c.id} value={`course_${c.id}`}>{c.name} ({formatCurrency(c.price)})</option>
              ))}
            </optgroup>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Cấp quyền truy cập'}
        </button>
      </form>
    </div>
  );
};

// ⚡️ MỚI: Component Tạo Key Thủ công (Linh hoạt)
const ManualKeyGenerator = ({ subjects, courses }) => {
  const [cart, setCart] = useState({ subjects: [], courses: [] });
  const [capability, setCapability] = useState(''); // 'TEACHER_QUIZ_CREATION'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Để hiển thị Key đã tạo

  // ⚡️ ĐÃ CẬP NHẬT: handleSubmit (dùng fetch)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isEmpty = cart.subjects.length === 0 && cart.courses.length === 0;
    if (isEmpty && !capability) {
      setError("Vui lòng chọn ít nhất một vật phẩm hoặc một tính năng để tạo Key.");
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // 1. Lấy token của Admin
      const user = auth.currentUser;
      if (!user) throw new Error("Admin chưa đăng nhập");
      const token = await user.getIdToken();
      
      const payload = {
        status: "new",
        ...(isEmpty ? { unlocksCapability: capability } : { cartToUnlock: cart })
      };
      
      // 2. Gọi API Vercel
      const response = await fetch(`${VERCEL_API_URL}/api/createAccessKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }
      
      // Backend API trả về { success: true, key: '...' }
      setMessage(`Tạo Key thành công: ${result.key}\n\n(Hãy copy và gửi cho người dùng)`);
      setCart({ subjects: [], courses: [] }); // Reset
      setCapability('');
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logic mini-cart để chọn khóa học
  const addToCart = (type, id) => {
    if (type === 'subject') {
      if (!cart.subjects.includes(id)) setCart(c => ({ ...c, subjects: [...c.subjects, id] }));
    } else {
      if (!cart.courses.includes(id)) setCart(c => ({ ...c, courses: [...c.courses, id] }));
    }
  };
  const removeFromCart = (type, id) => {
    if (type === 'subject') {
      setCart(c => ({ ...c, subjects: c.subjects.filter(s => s !== id) }));
    } else {
      setCart(c => ({ ...c, courses: c.courses.filter(c => c !== id) }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-xl font-bold mb-6">Tạo Key Thủ công (Flexible Key)</h3>
      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      {message && (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-lg">
          <pre className="whitespace-pre-wrap font-sans">{message}</pre>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Phần 1: Chọn Tính năng */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Tính năng (Ưu tiên cao hơn)</label>
          <select 
            value={capability} 
            onChange={(e) => setCapability(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Không chọn (Tạo key nội dung) --</option>
            <option value="TEACHER_QUIZ_CREATION">Cấp quyền Giáo viên (Tạo Quiz)</option>
            {/* Thêm các quyền khác sau này */}
          </select>
          <p className="text-xs text-gray-500 mt-1">Nếu chọn tính năng, Key sẽ bỏ qua các vật phẩm bên dưới.</p>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500">hoặc</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Phần 2: Chọn Vật phẩm (nếu không chọn tính năng) */}
        <div className={capability ? 'opacity-50 pointer-events-none' : ''}>
          <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Vật phẩm (Môn học / Khóa học)</label>
          <div className="grid grid-cols-2 gap-4">
            <select 
              onChange={(e) => addToCart('subject', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              disabled={!!capability}
            >
              <option value="">-- Thêm Môn học --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id} disabled={cart.subjects.includes(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            <select 
              onChange={(e) => addToCart('course', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              disabled={!!capability}
            >
              <option value="">-- Thêm Khóa học --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id} disabled={cart.courses.includes(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Hiển thị mini-cart */}
          <div className="mt-4 space-y-2">
            {cart.subjects.map(id => {
              const item = subjects.find(s => s.id === id);
              return (
                <div key={id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-sm font-semibold">{item?.name} (Môn)</span>
                  <button type="button" onClick={() => removeFromCart('subject', id)}><X size={16} className="text-red-500" /></button>
                </div>
              );
            })}
            {cart.courses.map(id => {
              const item = courses.find(c => c.id === id);
              return (
                <div key={id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-sm font-semibold">{item?.name} (Khóa)</span>
                  <button type="button" onClick={() => removeFromCart('course', id)}><X size={16} className="text-red-500" /></button>
                </div>
              );
            })}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Tạo Key'}
        </button>
      </form>
    </div>
  );
};

// ⚡️ MỚI: Component Quản lý Đơn hàng
const OrderManager = ({ orders, users }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ⚡️ ĐÃ CẬP NHẬT: handleGenerateKey (dùng fetch)
  const handleGenerateKey = async (order) => {
    setLoading(true);
    setError('');
    try {
      // 1. Lấy token của Admin
      const user = auth.currentUser;
      if (!user) throw new Error("Admin chưa đăng nhập");
      const token = await user.getIdToken();
      
      const payload = {
        status: "new",
        cartToUnlock: order.cart,
        orderId: order.id
      };
      
      // 2. Gọi API Vercel
      const response = await fetch(`${VERCEL_API_URL}/api/createAccessKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }
      
      const key = result.key;
      alert(`Tạo Key thành công: ${key}\n\nHãy gửi Key này cho ${order.userName}.`);
      
      // 3. Cập nhật Firestore (Admin có quyền làm việc này)
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'processed',
        generatedKey: key
      });
      
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert("Lỗi khi tạo key: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {error && <div className="p-4 bg-red-100 text-red-700">{error}</div>}
      <table className="w-full min-w-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Người dùng</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nội dung</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map(order => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="font-semibold text-gray-800">{order.userName}</p>
                <p className="text-sm text-gray-500">{order.userId}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm">Môn: {order.cart.subjects.join(', ') || 'Không có'}</p>
                <p className="text-sm">Khóa: {order.cart.courses.join(', ') || 'Không có'}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {order.status === 'processed' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    Đã xử lý
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    Đang chờ
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                {order.status !== 'processed' && (
                  <button
                    onClick={() => handleGenerateKey(order)}
                    disabled={loading}
                    className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition text-sm disabled:opacity-50"
                  >
                    Tạo Key
                  </button>
                )}
                {order.generatedKey && (
                   <span className="text-xs text-gray-500 font-mono">{order.generatedKey}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main Admin Dashboard
const AdminDashboard = ({ user, onLogout }) => {
  const { role } = useContext(AppContext);
  const { subjects, courses, quizzes, loading: loadingData } = useContext(DataContext);
  // ⚡️ THAY ĐỔI: Lấy thêm 'orders' từ hook
  const { users, transactions, orders, loading: loadingAdmin } = useAdminData(role);
  
  const [view, setView] = useState('users');
  
  // ⚡️ THAY ĐỔI: Cập nhật Tabs
  const adminTabs = [
    { key: 'users', label: 'Người dùng', icon: Users },
    { key: 'orders', label: 'Đơn hàng', icon: Package }, // Mới
    { key: 'create-key', label: 'Tạo Key', icon: Sparkles }, // Mới
    { key: 'grant', label: 'Cấp Key Trực tiếp', icon: Key }, // Sửa tên
    { key: 'subjects', label: 'Môn học', icon: BookOpen },
    { key: 'courses', label: 'Khóa học', icon: Package },
    { key: 'quizzes', label: 'Bài tập', icon: CheckCircle2 },
    { key: 'transactions', label: 'Giao dịch (Log)', icon: BarChart3 }, // Sửa tên
  ];

  const handleSave = async (data, id) => {
    const collectionName = view; // 'subjects', 'courses', 'quizzes'
    try {
      if (id) {
        // Update
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data);
      } else {
        // Create
        const collRef = collection(db, collectionName);
        if (collectionName === 'quizzes') {
          data.createdBy = auth.currentUser.uid; // Gán admin là người tạo
        }
        await addDoc(collRef, data);
      }
    } catch (err) {
      console.error(`Lỗi khi lưu ${collectionName}:`, err);
      alert(`Lỗi: ${err.message}`);
    }
  };
  
  const handleDelete = async (id) => {
    const collectionName = view;
    if (!window.confirm(`Bạn có chắc muốn xóa ${collectionName} với ID: ${id}?`)) return;
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      // TODO: Xóa tham chiếu (ví dụ: xóa quizId khỏi subjects)
      // Tạm thời bỏ qua để đơn giản (nhưng TeacherDashboard CÓ logic này)
      // Cần đồng bộ hóa logic này, lý tưởng nhất là dùng Cloud Function
    } catch (err) {
      console.error(`Lỗi khi xóa ${collectionName}:`, err);
      alert(`Lỗi: ${err.message}`);
    }
  };
  
  const renderView = () => {
    if (loadingData || loadingAdmin) {
      return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" size={48} /></div>;
    }
    
    switch(view) {
      case 'users':
        return <UserManager users={users} />;
      // ⚡️ MỚI: Thêm view cho 'orders' và 'create-key'
      case 'orders':
        return <OrderManager orders={orders} users={users} />;
      case 'create-key':
        return <ManualKeyGenerator subjects={subjects} courses={courses} />;
      case 'subjects':
        return <ContentManager type="subjects" items={subjects} onSave={handleSave} onDelete={handleDelete} />;
      case 'courses':
        return <ContentManager type="courses" items={courses} onSave={handleSave} onDelete={handleDelete} />;
      case 'quizzes':
        return <ContentManager type="quizzes" items={quizzes} onSave={handleSave} onDelete={handleDelete} />;
      case 'grant':
        return <ManualKeyGrant users={users} subjects={subjects} courses={courses} />;
      case 'transactions':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6">Lịch sử Giao dịch</h3>
            {/* Đơn giản hóa, chỉ hiển thị JSON */}
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(transactions, null, 2)}
            </pre>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-red-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🛡️ {user.hoTen}</h1>
              <p className="text-red-100 mt-1">Quản trị viên (Admin)</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition"
            >
              <LogOut size={20} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-4 overflow-x-auto">
            {adminTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`px-5 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                  view === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={20} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {renderView()}
      </div>
    </div>
  );
};


// =====================================================
// COMPONENT: KickedModal (Modal Bị đá)
// =====================================================

// =====================================================


// =====================================================
// COMPONENT: AppRouter (Bộ định tuyến chính)
// =====================================================
const AppRouter = () => {
  const { 
    authUser, 
    currentUser, 
    role, 
    isLoading, 
    needsOnboarding, 
    handleSignOut,
    setOnboardingCompleted // Lấy hàm này từ context
  } = useContext(AppContext);
  
  // Tải data ở đây, SAU KHI AppContext đã sẵn sàng
  const dataState = usePublicData(); 

  if (isLoading || dataState.loading) {
    return <GlobalLoader message="Đang tải dữ liệu..." />;
  }

  // Cung cấp DataContext cho các component con (Dashboards, v.v.)
  return (
    <DataContext.Provider value={dataState}>
      {!authUser ? (
        <EnhancedLoginPage />
      ) : needsOnboarding ? (
        <OnboardingForm user={authUser} onComplete={setOnboardingCompleted} />
      ) : !currentUser ? (
        // Trường hợp lạ: đã auth, không cần onboarding, nhưng data user vẫn null
        // (Có thể do lỗi Firestore)
        <GlobalLoader message="Lỗi khi tải dữ liệu người dùng..." />
      ) : role === 'admin' ? (
        <AdminDashboard user={currentUser} onLogout={handleSignOut} />
      ) : role === 'teacher' ? (
        <TeacherDashboard user={currentUser} onLogout={handleSignOut} />
      ) : (
        <StudentDashboard user={currentUser} onLogout={handleSignOut} />
      )}
    </DataContext.Provider>
  );
};


// =====================================================
// MAIN APP
// =====================================================
export default function ELearningSystem() {
  const authState = useAuth();
  
  // Xử lý logic xác nhận đăng nhập (session conflict)
  const { sessionConflict, proceedToLogin, handleSignOut, kicked } = authState;

  const onConfirmLogin = () => {
    if (sessionConflict) {
      proceedToLogin(sessionConflict.authUser, sessionConflict.role);
    }
  };

  const onCancelLogin = () => {
    handleSignOut(); // Đăng xuất người dùng khỏi thiết bị này
  };
  
  return (
    <AppContext.Provider value={authState}>
        {kicked && <KickedModal />}

        {sessionConflict && (
          <ConfirmLoginModal 
            onConfirm={onConfirmLogin}
            onCancel={onCancelLogin}
          />
        )}
        
        {!authState.isAuthReady ? (
          <GlobalLoader message="Đang kết nối..." />
        ) : (
          <AppRouter />
        )}
    </AppContext.Provider>
  );
}

