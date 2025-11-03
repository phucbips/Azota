# Hướng Dẫn Xử Lý Sự Cố - Azota E-Learning Platform

## 📋 Mục Lục

1. [Quick Reference Cards](#quick-reference-cards)
2. [Các Vấn Đề Thường Gặp](#các-vấn-đề-thường-gặp)
3. [Vấn Đề Firebase](#vấn-đề-firebase)
4. [Vấn Đề Deployment Vercel](#vấn-đề-deployment-vercel)
5. [Build Failures](#build-failures)
6. [Vấn Đề API Connection](#vấn-đề-api-connection)
7. [Vấn Đề Authentication](#vấn-đề-authentication)
8. [Vấn Đề Performance](#vấn-đề-performance)
9. [Environment Variables](#environment-variables)
10. [Kỹ Thuật Debug](#kỹ-thuật-debug)
11. [Phân Tích Logs](#phân-tích-logs)
12. [FAQ](#faq)
13. [Kỹ Thuật Debug Nâng Cao](#kỹ-thuật-debug-nâng-cao)
14. [Liên Hệ Hỗ Trợ](#liên-hệ-hỗ-trợ)

---

## 🚀 Quick Reference Cards

### 🔧 Common Fixes

```bash
# Clear cache và rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Kiểm tra Firebase connection
firebase projects:list
firebase use <project-id>

# Deploy Vercel
vercel --prod

# Kiểm tra environment variables
echo $REACT_APP_FIREBASE_API_KEY
```

### ⚡ Emergency Fixes

| Issue | Quick Fix | Backup Plan |
|-------|-----------|-------------|
| Build fails | `npm ci --legacy-peer-deps` | Check Node.js version |
| Firebase errors | Verify config keys | Use emulator |
| Auth issues | Clear browser storage | Incognito mode |
| API timeouts | Check rate limits | Retry logic |

### 🎯 Priority Checklist

- [ ] Check Node.js version (16.x+)
- [ ] Verify Firebase project settings
- [ ] Test environment variables
- [ ] Check Vercel deployment status
- [ ] Review error logs
- [ ] Test in incognito mode

---

## 🐛 Các Vấn Đề Thường Gặp

### 1. Application Không Load

**Triệu chứng:**
- Trang trắng hoặc loading vô hạn
- Console hiển thị lỗi

**Giải pháp:**
```javascript
// 1. Kiểm tra import statements
import React from 'react';
import ReactDOM from 'react-dom/client';

// 2. Clear cache browser
// F12 -> Application -> Storage -> Clear storage

// 3. Check network tab để xem assets load
// F12 -> Network -> Reload page
```

### 2. Router Không Hoạt Động

**Triệu chứng:**
- 404 errors khi refresh trang
- Routes không chuyển đổi

**Giải pháp:**
```javascript
// Kiểm tra BrowserRouter setup
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Thêm fallback route
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 3. State Management Issues

**Triệu chứng:**
- Data không update
- Props không pass đúng

**Giải pháp:**
```javascript
// Use React Developer Tools
// F12 -> Components -> Select component -> Check props & state

// Thêm useEffect để debug
useEffect(() => {
  console.log('Component mounted:', componentName);
  console.log('Current state:', state);
}, []);
```

---

## 🔥 Vấn Đề Firebase

### Firebase Configuration Issues

**Lỗi thường gặp:**
```
Firebase: Firebase App named '[DEFAULT]' already exists
```

**Giải pháp:**
```javascript
// utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
try {
  app = getApps()[0];
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### Firestore Connection Issues

**Triệu chứng:**
- "Failed to get document because the client is offline"
- Data không sync

**Giải pháp:**
```javascript
// Kiểm tra network status
import { useNetworkState } from './hooks/useNetworkState';

const { online } = useNetworkState();

useEffect(() => {
  if (online) {
    // Enable Firestore offline persistence
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence');
        }
      });
  }
}, [online]);
```

### Authentication Issues

**Lỗi: "Auth domain not configured"**

**Giải pháp:**
1. **Kiểm tra Firebase Console:**
   ```
   Authentication -> Settings -> Authorized domains
   Thêm domain của app vào list
   ```

2. **Verify redirect URLs:**
   ```javascript
   // LoginPage.js
   const handleGoogleLogin = async () => {
     try {
       const result = await signInWithPopup(auth, googleProvider);
       console.log('Login successful:', result.user);
     } catch (error) {
       console.error('Login error:', error);
       // Handle specific errors
       if (error.code === 'auth/popup-closed-by-user') {
         // User closed popup
       }
     }
   };
   ```

### Firestore Security Rules Issues

**Test rules trong Firebase Console:**
```javascript
// Test Firestore rules
// Firebase Console -> Firestore -> Rules -> Simulator
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Vấn Đề Deployment Vercel

### Build Failures

**Lỗi: "Build command failed"**

**Debug steps:**
```bash
# 1. Kiểm tra build locally
npm run build

# 2. Check vercel.json configuration
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Các lỗi thường gặp và fix:**

1. **Node.js version conflicts:**
   ```json
   // package.json
   {
     "engines": {
       "node": "16.x"
     }
   }
   ```

2. **Missing dependencies:**
   ```bash
   npm install --save-dev @types/node
   ```

### Environment Variables

**Lỗi: "Environment variables not found"**

**Giải pháp:**
1. **Vercel Dashboard:**
   ```
   Project -> Settings -> Environment Variables
   Thêm các biến:
   - REACT_APP_FIREBASE_API_KEY
   - REACT_APP_FIREBASE_AUTH_DOMAIN
   - REACT_APP_FIREBASE_PROJECT_ID
   - REACT_APP_FIREBASE_STORAGE_BUCKET
   - REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   - REACT_APP_FIREBASE_APP_ID
   ```

2. **Check variable naming:**
   ```bash
   # Tên biến phải bắt đầu với REACT_APP_
   REACT_APP_API_URL=https://api.example.com
   # KHÔNG dùng
   API_URL=https://api.example.com
   ```

### Domain Configuration

**Custom domain không hoạt động:**

1. **DNS Settings:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

2. **SSL Certificate:**
   ```
   Vercel tự động provision SSL
   Nếu lỗi: Force HTTPS trong vercel.json
   ```

---

## 🔧 Build Failures

### Module Resolution Issues

**Lỗi: "Cannot resolve module"**

**Giải pháp:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Use legacy peer deps
npm install --legacy-peer-deps
```

### TypeScript Errors

**Lỗi: "Type errors"**

**Giải pháp:**
```bash
# Skip type checking trong build
npm run build -- --skip-type-check

# Hoặc configure tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### CSS Issues

**Lỗi: "CSS import order"**

**Giải pháp:**
```css
/* global.css */
@import './variables.css';
@import './reset.css';
@import './components.css';

/* Check @tailwind directives trong correct order */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🌐 Vấn Đề API Connection

### CORS Issues

**Lỗi: "Access to fetch blocked by CORS"**

**Giải pháp:**

1. **Backend API (Node.js/Express):**
   ```javascript
   // CORS middleware
   const cors = require('cors');
   
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://your-app.vercel.app',
       'https://your-custom-domain.com'
     ],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

2. **Frontend API calls:**
   ```javascript
   // utils/apiWrapper.js
   const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

   export const apiCall = async (endpoint, options = {}) => {
     const url = `${API_BASE_URL}${endpoint}`;
     const config = {
       headers: {
         'Content-Type': 'application/json',
         ...options.headers
       },
       ...options
     };

     try {
       const response = await fetch(url, config);
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       return await response.json();
     } catch (error) {
       console.error('API call failed:', error);
       throw error;
     }
   };
   ```

### Rate Limiting

**Lỗi: "Too many requests"**

**Giải pháp:**
```javascript
// Implement retry logic
const retryApiCall = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};
```

### Network Timeouts

**Giải pháp:**
```javascript
// Add timeout to API calls
const apiCallWithTimeout = async (endpoint, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};
```

---

## 🔐 Vấn Đề Authentication

### Token Expiration

**Lỗi: "Auth token expired"**

**Giải pháp:**
```javascript
// utils/auth.js
import { auth } from './firebase';

export const setupAuthListener = (callback) => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Get fresh token
      const token = await user.getIdToken();
      callback({ user, token });
    } else {
      callback(null);
    }
  });
  
  return unsubscribe;
};

// Auto refresh token
export const refreshToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(true); // Force refresh
  }
};
```

### Permission Denied

**Giải pháp:**
```javascript
// Check user permissions
const checkUserPermission = async (requiredRole) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get user role from Firestore
  const userDoc = await doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDoc);
  
  if (!snapshot.exists()) {
    throw new Error('User profile not found');
  }
  
  const userData = snapshot.data();
  if (userData.role !== requiredRole) {
    throw new Error(`Insufficient permissions. Required: ${requiredRole}`);
  }
  
  return userData;
};
```

---

## ⚡ Vấn Đề Performance

### Slow Loading

**Debug steps:**

1. **React Developer Tools Profiler:**
   ```javascript
   // Import Profiler in development
   import { Profiler } from 'react';
   
   const onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
     console.log('Component:', id);
     console.log('Render time:', actualDuration);
   };
   
   <Profiler id="App" onRender={onRenderCallback}>
     <App />
   </Profiler>
   ```

2. **Check bundle size:**
   ```bash
   npm run build
   npx bundle-analyzer build/static/js/*.js
   ```

3. **Lazy loading:**
   ```javascript
   // Lazy load components
   const LazyComponent = React.lazy(() => import('./LazyComponent'));
   
   <Suspense fallback={<Loading />}>
     <LazyComponent />
   </Suspense>
   ```

### Memory Leaks

**Lỗi: "Memory leak detected"**

**Giải pháp:**
```javascript
// Cleanup in useEffect
useEffect(() => {
  const subscription = dataService.subscribe();
  
  return () => {
    subscription.unsubscribe();
    // Clear timeouts
    clearTimeout(timeoutId);
    // Clear intervals
    clearInterval(intervalId);
  };
}, []);

// Cleanup event listeners
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Large Bundle Size

**Giải pháp:**

1. **Code splitting:**
   ```javascript
   // Split by routes
   const Home = React.lazy(() => import('./pages/Home'));
   const Dashboard = React.lazy(() => import('./pages/Dashboard'));
   const Profile = React.lazy(() => import('./pages/Profile'));
   ```

2. **Tree shaking:**
   ```javascript
   // Import specific functions instead of entire library
   import { debounce } from 'lodash/debounce';
   // Instead of
   import _ from 'lodash';
   ```

3. **Remove unused dependencies:**
   ```bash
   npm run build -- --analyze
   # Check bundle analyzer output
   ```

---

## 🔧 Environment Variables

### Missing Variables

**Lỗi: "Environment variable not defined"**

**Giải pháp:**

1. **Create .env file:**
   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id

   # API Configuration
   REACT_APP_API_URL=https://api.example.com

   # Feature Flags
   REACT_APP_ENABLE_ANALYTICS=true
   REACT_APP_DEBUG_MODE=false
   ```

2. **Validate env variables:**
   ```javascript
   // utils/envValidation.js
   const requiredEnvVars = [
     'REACT_APP_FIREBASE_API_KEY',
     'REACT_APP_FIREBASE_AUTH_DOMAIN',
     'REACT_APP_FIREBASE_PROJECT_ID'
   ];
   
   const validateEnvVars = () => {
     const missing = requiredEnvVars.filter(varName => !process.env[varName]);
     
     if (missing.length > 0) {
       throw new Error(`Missing environment variables: ${missing.join(', ')}`);
     }
   };
   
   export { validateEnvVars };
   ```

### Environment-Specific Configs

**Giải pháp:**
```javascript
// config/environment.js
const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        apiUrl: 'http://localhost:3001',
        firebaseConfig: {
          // Development config
        },
        debugMode: true
      };
      
    case 'production':
      return {
        apiUrl: process.env.REACT_APP_API_URL,
        firebaseConfig: {
          // Production config
        },
        debugMode: false
      };
      
    default:
      return {};
  }
};

export default getEnvironmentConfig();
```

---

## 🔍 Kỹ Thuật Debug

### Browser DevTools

**Console Debugging:**
```javascript
// 1. Debug logging wrapper
const debugLog = (message, data = null, type = 'info') => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const prefix = `[DEBUG ${timestamp}]`;
    
    switch (type) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }
};

// 2. Component lifecycle debugging
const debugComponent = (componentName) => {
  useEffect(() => {
    debugLog(`${componentName} mounted`);
    return () => {
      debugLog(`${componentName} unmounted`);
    };
  }, []);
};

// 3. State change debugging
const debugState = (componentName, state) => {
  useEffect(() => {
    debugLog(`${componentName} state changed:`, state);
  }, [state]);
};
```

### React Developer Tools

**Setup và sử dụng:**

1. **Install extension:**
   ```
   Chrome: React Developer Tools
   Firefox: React Developer Tools
   ```

2. **Debug hooks:**
   ```javascript
   // Custom hook with debug
   const useDebugHook = (name, value) => {
     useEffect(() => {
       console.log(`${name} updated:`, value);
     }, [name, value]);
   };
   ```

### Network Debugging

**API Response Debugging:**
```javascript
// utils/networkDebugger.js
export const debugNetworkCall = async (url, options = {}) => {
  console.group(`🌐 Network Request: ${options.method || 'GET'} ${url}`);
  console.log('Request:', {
    url,
    options
  });
  
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    console.log('Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });
    
    const data = await response.json();
    console.log('Data:', data);
    
    console.groupEnd();
    return data;
  } catch (error) {
    console.error('Network error:', error);
    console.groupEnd();
    throw error;
  }
};
```

---

## 📊 Phân Tích Logs

### Error Logging Setup

**Frontend Error Tracking:**
```javascript
// utils/errorLogger.js
class ErrorLogger {
  static log(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: auth.currentUser?.uid,
      ...context
    };
    
    console.error('Error caught:', errorInfo);
    
    // Send to logging service (e.g., Sentry, LogRocket)
    // this.sendToService(errorInfo);
  }
  
  static handleUnhandledRejection(event) {
    this.log(event.reason, { type: 'unhandledRejection' });
  }
  
  static handleGlobalError(event) {
    this.log(event.error, { type: 'globalError' });
  }
}

// Setup global error handlers
window.addEventListener('unhandledrejection', ErrorLogger.handleUnhandledRejection);
window.addEventListener('error', ErrorLogger.handleGlobalError);
```

### Log Analysis Guide

**Common Error Patterns:**

1. **Firebase Errors:**
   ```javascript
   // Pattern: Firebase Error Code Analysis
   const analyzeFirebaseError = (error) => {
     const errorCode = error.code;
     const commonCodes = {
       'auth/user-not-found': 'User account not found',
       'auth/wrong-password': 'Invalid credentials',
       'firestore/permission-denied': 'Insufficient permissions',
       'firestore/quota-exceeded': 'Firestore quota exceeded',
       'storage/object-not-found': 'File not found in storage'
     };
     
     return commonCodes[errorCode] || 'Unknown Firebase error';
   };
   ```

2. **Network Errors:**
   ```javascript
   // Pattern: Network Error Analysis
   const analyzeNetworkError = (error) => {
     if (error.name === 'TypeError' && error.message.includes('fetch')) {
       return 'Network request failed - check API endpoint';
     }
     
     if (error.message.includes('CORS')) {
       return 'CORS error - check server configuration';
     }
     
     if (error.code === 'ECONNREFUSED') {
       return 'Connection refused - server may be down';
     }
     
     return 'Unknown network error';
   };
   ```

3. **React Errors:**
   ```javascript
   // Pattern: React Error Analysis
   const analyzeReactError = (error) => {
     const stack = error.stack || '';
     
     if (stack.includes('useEffect')) {
       return 'useEffect hook error - check dependencies array';
     }
     
     if (stack.includes('render')) {
       return 'Component render error - check component logic';
     }
     
     if (stack.includes('hooks')) {
       return 'Hook rule violation - check hook usage';
     }
     
     return 'React component error';
   };
   ```

### Log Collection

**Structured Logging:**
```javascript
// utils/structuredLogger.js
class StructuredLogger {
  static log(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: {
        ...meta,
        userId: auth.currentUser?.uid,
        sessionId: this.getSessionId(),
        page: window.location.pathname
      }
    };
    
    console.log(JSON.stringify(logEntry));
    
    // Send to log aggregation service
    this.sendToLogService(logEntry);
  }
  
  static info(message, meta) {
    this.log('info', message, meta);
  }
  
  static warn(message, meta) {
    this.log('warn', message, meta);
  }
  
  static error(message, meta) {
    this.log('error', message, meta);
  }
  
  static getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
  
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

---

## ❓ FAQ

### General Questions

**Q: Tại sao ứng dụng load chậm?**
A: 
- Kiểm tra bundle size với `npm run build -- --analyze`
- Enable lazy loading cho các component lớn
- Optimize images và assets
- Sử dụng CDN cho static assets
- Kiểm tra network latency

**Q: Firebase connection failed?**
A:
1. Verify API keys trong Firebase Console
2. Check network connectivity
3. Verify domain được whitelist trong Authentication
4. Clear browser cache và cookies
5. Test với Firebase Emulator

**Q: Build fails với "Module not found"?**
A:
```bash
# Solution steps
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
npm run build
```

**Q: Deployment failed trên Vercel?**
A:
1. Check build logs trong Vercel Dashboard
2. Verify environment variables được set
3. Ensure Node.js version compatibility
4. Check vercel.json configuration
5. Test build locally trước khi deploy

### Authentication FAQ

**Q: Login không hoạt động?**
A:
```javascript
// Debug steps
1. Check console for Firebase errors
2. Verify auth domain trong Firebase Console
3. Test với different browsers
4. Clear browser storage
5. Check network tab for failed requests
```

**Q: User bị logout liên tục?**
A:
- Token expiration issues
- Check refresh token logic
- Verify session storage settings
- Check for memory leaks trong auth listener

### Performance FAQ

**Q: Component re-render nhiều lần?**
A:
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, []);
```

**Q: Memory leaks trong development?**
A:
- Cleanup subscriptions trong useEffect return
- Clear timers và intervals
- Remove event listeners
- Check for circular dependencies

---

## 🔧 Kỹ Thuật Debug Nâng Cao

### Performance Monitoring

**Custom Performance Observer:**
```javascript
// utils/performanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.setupObservers();
  }
  
  setupObservers() {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('navigation', {
            loadTime: entry.loadEventEnd - entry.fetchStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
            firstByte: entry.responseStart - entry.requestStart
          });
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      
      // First contentful paint
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('paint', {
            firstPaint: entry.startTime,
            firstContentfulPaint: entry.name === 'first-contentful-paint' ? entry.startTime : null
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    }
  }
  
  recordMetric(name, data) {
    this.metrics[name] = { ...this.metrics[name], ...data };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric - ${name}:`, data);
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  logMetrics() {
    console.table(this.metrics);
  }
}

export default new PerformanceMonitor();
```

### Advanced Error Boundary

**Custom Error Boundary với Recovery:**
```javascript
// components/AdvancedErrorBoundary.js
class AdvancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to monitoring service
    ErrorLogger.log(error, { errorInfo, component: this.props.componentName });
  }
  
  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };
  
  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, componentName } = this.props;
      const { error, retryCount } = this.state;
      
      // Custom fallback UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong in {componentName}</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{error && error.toString()}</pre>
            <pre>{this.state.errorInfo.componentStack}</pre>
          </details>
          
          {retryCount < 3 && (
            <button onClick={this.handleRetry}>
              Retry ({retryCount}/3)
            </button>
          )}
          
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
          
          {Fallback && <Fallback error={error} />}
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
<AdvancedErrorBoundary componentName="UserDashboard" fallback={<UserDashboardError />}>
  <UserDashboard />
</AdvancedErrorBoundary>
```

### Memory Leak Detection

**Custom Memory Leak Detector:**
```javascript
// utils/memoryLeakDetector.js
class MemoryLeakDetector {
  constructor() {
    this.trackedObjects = new WeakMap();
    this.intervalId = null;
  }
  
  track(componentName, obj) {
    if (process.env.NODE_ENV === 'development') {
      this.trackedObjects.set(obj, {
        componentName,
        created: Date.now(),
        references: new Set()
      });
    }
  }
  
  startMonitoring(intervalMs = 30000) {
    if (process.env.NODE_ENV === 'development') {
      this.intervalId = setInterval(() => {
        this.checkMemoryUsage();
      }, intervalMs);
    }
  }
  
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  checkMemoryUsage() {
    if ('performance' in window && 'memory' in performance) {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      
      console.log(`💾 Memory Usage: ${usedMB}MB / ${totalMB}MB`);
      
      // Warn if memory usage is high
      if (memory.usedJSHeapSize / 1024 / 1024 > 50) {
        console.warn('⚠️ High memory usage detected!');
      }
    }
  }
}

export default new MemoryLeakDetector();
```

### Network Request Interceptor

**Advanced Request Debugging:**
```javascript
// utils/networkInterceptor.js
class NetworkInterceptor {
  constructor() {
    this.originalFetch = window.fetch;
    this.requests = [];
    this.setupInterceptor();
  }
  
  setupInterceptor() {
    window.fetch = async (...args) => {
      const [url, config = {}] = args;
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      const requestInfo = {
        id: requestId,
        url,
        method: config.method || 'GET',
        headers: config.headers,
        startTime,
        status: null,
        duration: null,
        response: null,
        error: null
      };
      
      this.requests.push(requestInfo);
      
      try {
        const response = await this.originalFetch(...args);
        const endTime = Date.now();
        
        requestInfo.status = response.status;
        requestInfo.duration = endTime - startTime;
        
        // Clone response for logging
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        
        try {
          requestInfo.response = JSON.parse(responseText);
        } catch {
          requestInfo.response = responseText;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🌐 Request ${requestId}:`, requestInfo);
        }
        
        return response;
      } catch (error) {
        requestInfo.error = error.message;
        requestInfo.status = 'error';
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Request ${requestId} failed:`, error);
        }
        
        throw error;
      }
    };
  }
  
  getRequests() {
    return this.requests;
  }
  
  clearRequests() {
    this.requests = [];
  }
  
  generateRequestId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default new NetworkInterceptor();
```

---

## 📞 Liên Hệ Hỗ Trợ

### Emergency Contacts

**🚨 Critical Issues:**
- DevOps Team: devops@azota.com
- On-call Engineer: +84.xxx.xxx.xxx
- Slack Channel: #critical-issues

**🔧 Technical Support:**
- Email: support@azota.com
- Slack: #technical-support
- Documentation: https://docs.azota.com

### Issue Reporting

**Template cho bug report:**
```
## Issue Description
Brief description of the problem

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome/Safari/Firefox version
- OS: macOS/Windows/Linux version
- Network: WiFi/4G/5G
- User Role: Student/Teacher/Admin

## Screenshots/Logs
[Screenshots or error logs]

## Additional Context
[Any additional information]
```

### Support Response Times

| Priority | Response Time | Resolution Time |
|----------|---------------|-----------------|
| Critical | 15 minutes | 4 hours |
| High | 1 hour | 24 hours |
| Medium | 4 hours | 72 hours |
| Low | 24 hours | 1 week |

### Escalation Path

1. **Level 1:** Technical Support Team
2. **Level 2:** Senior Engineers
3. **Level 3:** Architecture Team
4. **Level 4:** Engineering Director

### Self-Service Resources

- **Documentation:** [docs.azota.com](https://docs.azota.com)
- **API Reference:** [api.azota.com](https://api.azota.com)
- **Community Forum:** [community.azota.com](https://community.azota.com)
- **Video Tutorials:** [learn.azota.com](https://learn.azota.com)

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-03 | Initial troubleshooting guide |
| 1.1.0 | [Future] | Added advanced debugging techniques |

---

## 🤝 Contributing

Nếu bạn muốn contribute vào troubleshooting guide:

1. Fork repository
2. Tạo branch mới: `git checkout -b fix/some-issue`
3. Commit changes: `git commit -m 'Add fix for...'`
4. Push to branch: `git push origin fix/some-issue`
5. Tạo Pull Request

### Guidelines

- Sử dụng tiếng Việt cho user-facing content
- Provide working code examples
- Include screenshots cho UI issues
- Test solutions trước khi submit

---

**🎯 Mục tiêu:** Troubleshooting guide toàn diện cho developers Azota platform

**📅 Last updated:** 2025-11-03

**👨‍💻 Maintained by:** Azota Development Team