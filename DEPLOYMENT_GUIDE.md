# 🚀 Azota Quiz App - Hướng dẫn Deploy Chi tiết

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Prerequisites](#prerequisites)
3. [Firebase Setup](#firebase-setup)
4. [Vercel Setup](#vercel-setup)
5. [Environment Variables](#environment-variables)
6. [Local Development](#local-development)
7. [Deployment Process](#deployment-process)
8. [Post-deployment Testing](#post-deployment-testing)
9. [Troubleshooting](#troubleshooting)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Security Checklist](#security-checklist)
12. [Production Optimization](#production-optimization)
13. [Backup Strategies](#backup-strategies)

---

## 🎯 Tổng quan

**Azota Quiz App** là hệ thống quiz trực tuyến được xây dựng bằng React (frontend) kết hợp với Vercel API functions (backend) để quản lý access key và quyền truy cập.

### Kiến trúc hệ thống:
- **Frontend**: React 18+ với Firebase SDK
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Vercel Platform
- **CDN**: Vercel Edge Network

### Tính năng chính:
- ✅ Quản lý access key và quyền truy cập
- ✅ Xác thực người dùng với Firebase Auth
- ✅ Hệ thống quiz tương tác
- ✅ Dashboard quản trị
- ✅ API endpoints đầy đủ
- ✅ CORS configured
- ✅ Production-ready

---

## 🛠️ Prerequisites

### 1. Node.js & npm
```bash
# Kiểm tra version (yêu cầu Node.js 18+)
node --version  # V18.17.0 trở lên
npm --version   # V9+ trở lên

# Cài đặt Node.js từ nodejs.org hoặc sử dụng nvm
nvm install 18
nvm use 18
```

### 2. Firebase Account
- Tài khoản Google
- Truy cập [Firebase Console](https://console.firebase.google.com/)

### 3. Vercel Account
- Tài khoản GitHub, GitLab, hoặc Email
- Truy cập [Vercel Dashboard](https://vercel.com/dashboard)

### 4. Git Repository
```bash
# Khởi tạo Git repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

---

## 🔥 Firebase Setup

### Bước 1: Tạo Firebase Project

1. **Truy cập Firebase Console**
   ```bash
   # Mở trình duyệt và truy cập
   open https://console.firebase.google.com/
   ```

2. **Tạo Project mới**
   - Click "Create a project"
   - Đặt tên: `azota-quiz-app`
   - Chọn region: `asia-southeast2 (Jakarta)`
   - Disable Google Analytics (optional)
   - Click "Create project"

### Bước 2: Cấu hình Web App

1. **Thêm Web App**
   ```bash
   # Trong Firebase Console
   Project Overview → Add app → Web (</>)
   App nickname: "Azota Quiz Web"
   ✅ Setup Firebase Hosting (optional for now)
   ```

2. **Lấy Firebase Configuration**
   ```javascript
   // Firebase sẽ cung cấp config như này
   const firebaseConfig = {
     apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456789"
   };
   ```

### Bước 3: Cấu hình Firestore Database

1. **Tạo Database**
   ```bash
   # Firebase Console → Firestore Database → Create database
   Start in test mode (sẽ cấu hình security rules sau)
   Location: asia-southeast2
   ```

2. **Cấu hình Security Rules**
   ```javascript
   // Firestore Rules (Production)
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Chỉ cho phép authenticated users đọc
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Bước 4: Cấu hình Authentication

1. **Enable Authentication**
   ```bash
   # Firebase Console → Authentication → Get started
   Sign-in method → Email/Password → Enable
   Sign-in method → Google → Enable
   ```

2. **Cấu hình Google Provider**
   ```bash
   # Authentication → Sign-in method → Google
   Project public-facing name: "Azota Quiz App"
   Support email: your-email@example.com
   Project ID: your-project-id
   ```

### Bước 5: Tạo Service Account (Admin SDK)

1. **Tạo Service Account**
   ```bash
   # Firebase Console → Project Settings → Service Accounts
   Generate new private key → JSON file
   # Lưu file này an toàn (sẽ dùng cho Vercel)
   ```

2. **Extract Service Account Info**
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "xxxxxxxx",
     "private_key": "-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
     "client_id": "xxxxxxxx",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token"
   }
   ```

---

## 🌐 Vercel Setup

### Bước 1: Tạo Vercel Account

1. **Đăng ký Vercel**
   ```bash
   # Truy cập vercel.com
   Sign up with GitHub
   # Hoặc sử dụng GitLab/Email
   ```

2. **Install Vercel CLI** (Optional)
   ```bash
   npm i -g vercel
   vercel login
   ```

### Bước 2: Import Project

1. **Via Vercel Dashboard**
   ```bash
   # vercel.com → New Project
   Import Git Repository → Choose your repo
   Framework Preset: React
   Root Directory: ./ (để trống)
   Build Command: npm run build (auto-detected)
   Output Directory: build (auto-detected)
   ```

2. **Via Vercel CLI**
   ```bash
   vercel
   # Follow the prompts
   ? Set up and deploy? Yes
   ? Which scope? [your-username]
   ? Link to existing project? No
   ? What's your project's name? azota-quiz-app
   ? In which directory is your code located? ./
   ```

### Bước 3: Cấu hình Project Settings

1. **Framework Settings**
   ```bash
   # Vercel Dashboard → Project → Settings → General
   Framework Preset: React
   Root Directory: ./
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   Dev Command: npm start
   ```

2. **Functions Settings**
   ```bash
   # Settings → Functions
   Memory: 1024 MB
   Duration: 10s (max)
   Max Duration: 60s
   ```

---

## 🔐 Environment Variables

### Frontend Environment Variables (REACT_APP_*)

```bash
# ✅ Được expose trong client-side code (bình thường cho Firebase)
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API URL (optional, sẽ auto-detect)
REACT_APP_API_URL=https://your-app.vercel.app
```

### Backend Environment Variables (Server-side)

```bash
# ⚠️ Firebase Admin Configuration
# Lấy từ service account JSON file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# ⚠️ Private Key (cần escape newlines)
# Thay thế \n thành actual newlines trong Vercel dashboard
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Alternative: Sử dụng SERVICE_ACCOUNT_KEY (JSON string)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Cách thêm Environment Variables trong Vercel

```bash
# Vercel Dashboard → Project → Settings → Environment Variables

# Production Variables
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Development Variables (optional)
REACT_APP_API_URL=http://localhost:3000

# Preview Variables (auto-created)
# (Same as Production for preview deployments)
```

### CLI Method

```bash
# Thêm từng variable
vercel env add REACT_APP_FIREBASE_API_KEY production
# Paste your API key
vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN production
# Paste your auth domain
# ...tiếp tục cho các variable khác
```

---

## 💻 Local Development Setup

### Bước 1: Clone và Install Dependencies

```bash
# Clone repository
git clone YOUR_REPO_URL
cd azota-quiz-app

# Install dependencies
npm install

# Install API dependencies (nếu có)
cd api
npm install
cd ..
```

### Bước 2: Tạo Environment File

```bash
# Copy template file
cp .env.example .env.local

# Chỉnh sửa .env.local với thông tin Firebase của bạn
nano .env.local
```

**Example .env.local:**
```bash
# Frontend Firebase Config
REACT_APP_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend Firebase Admin Config
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# API URL
REACT_APP_API_URL=http://localhost:3000
```

### Bước 3: Khởi chạy Development Server

```bash
# Start React development server
npm start

# Hoặc start cả frontend và backend
npm run dev

# Kiểm tra ứng dụng
open http://localhost:3000
```

### Bước 4: Test Local Deployment

```bash
# Build production bundle locally
npm run build

# Test build locally
npx serve -s build -l 3000

# Hoặc sử dụng Vercel CLI
vercel dev
```

---

## 🚀 Deployment Process

### Phương pháp 1: Vercel Dashboard

1. **Push code lên Git repository**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy qua Dashboard**
   ```bash
   # vercel.com → Your Project → Deployments
   # Click "Redeploy" hoặc tự động deploy khi push code
   ```

3. **Kiểm tra build logs**
   ```bash
   # Dashboard → Deployments → Click vào deployment
   # Xem build logs và đảm bảo không có lỗi
   ```

### Phương pháp 2: Vercel CLI

```bash
# Deploy từ local
vercel --prod

# Hoặc deploy với options cụ thể
vercel --prod --confirm

# Kiểm tra deployment
vercel ls
```

### Phương pháp 3: GitHub Actions (Auto Deploy)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.REACT_APP_FIREBASE_API_KEY }}
        REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.REACT_APP_FIREBASE_AUTH_DOMAIN }}
        REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.REACT_APP_FIREBASE_PROJECT_ID }}
        # ... other env vars
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID}}
        vercel-project-id: ${{ secrets.PROJECT_ID}}
        vercel-args: '--prod'
```

---

## 🧪 Post-deployment Testing

### 1. Kiểm tra Frontend

```bash
# Test website functionality
open https://your-app.vercel.app

# Kiểm tra console logs
# Developer Tools → Console → Không có errors
# Firebase config loaded successfully ✅
```

### 2. Kiểm tra API Endpoints

```bash
# Test các endpoint chính
curl -X POST https://your-app.vercel.app/api/createAccessKey \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"courseId": "test"}'

# Expected: {success: true, data: {...}}
```

### 3. Kiểm tra Firebase Connection

```bash
# Developer Tools → Network tab
# Xem các request đến Firebase
# Expected: 200 OK responses
```

### 4. Test Authentication

```bash
# Test đăng nhập Google
# Test đăng nhập email/password
# Test logout
# Test protected routes
```

### 5. Test Access Key Flow

```bash
# Test tạo access key (admin user)
# Test sử dụng access key (student user)
# Test cấp quyền thủ công
# Test yêu cầu đơn hàng
```

### Automated Testing Script

```bash
# Tạo file test-deployment.sh
#!/bin/bash

APP_URL="https://your-app.vercel.app"
echo "🧪 Testing deployment at $APP_URL"

# Test frontend
echo "1. Testing frontend..."
curl -s -o /dev/null -w "%{http_code}" $APP_URL | grep -q "200"
if [ $? -eq 0 ]; then
  echo "✅ Frontend accessible"
else
  echo "❌ Frontend not accessible"
fi

# Test API endpoints
echo "2. Testing API endpoints..."
for endpoint in createAccessKey grantRole redeemAccessKey; do
  response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/$endpoint)
  if [ "$response" = "405" ] || [ "$response" = "401" ]; then
    echo "✅ API endpoint /$endpoint responding"
  else
    echo "❌ API endpoint /$endpoint not responding correctly"
  fi
done

echo "🎉 Deployment testing completed!"
```

---

## 🔧 Troubleshooting

### Lỗi thường gặp và cách khắc phục

#### 1. Firebase Configuration Errors

**Lỗi:**
```
Firebase: Error (auth/invalid-api-key)
```

**Khắc phục:**
```bash
# Kiểm tra environment variables
echo $REACT_APP_FIREBASE_API_KEY

# Verify Firebase project settings
# Firebase Console → Project Settings → General → Your apps
# Đảm bảo API key đúng và enabled
```

#### 2. Vercel Build Errors

**Lỗi:**
```
Build failed: npm install failed
```

**Khắc phục:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Check package.json dependencies
npm audit
```

#### 3. API Functions Not Working

**Lỗi:**
```
Function timeout or Firebase not initialized
```

**Khắc phục:**
```bash
# Kiểm tra environment variables trong Vercel
# Settings → Environment Variables → Verify all required vars

# Check function logs
# Vercel Dashboard → Functions → Select function → View Logs

# Verify Firebase Admin config
# Service account email và private key phải đúng
```

#### 4. CORS Issues

**Lỗi:**
```
Access to fetch blocked by CORS policy
```

**Khắc phục:**
```bash
# Kiểm tra vercel.json CORS configuration
# Đảm bảo có headers:
# "Access-Control-Allow-Origin": "*"
# "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
# "Access-Control-Allow-Headers": "Content-Type,Authorization"

# Test CORS với curl
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-app.vercel.app/api/createAccessKey
```

#### 5. Environment Variables Not Loading

**Lỗi:**
```
Using hardcoded Firebase config (development fallback)
```

**Khắc phục:**
```bash
# Kiểm tra environment variables names
# Phải bắt đầu với REACT_APP_ cho frontend
# Không có REACT_APP_ cho backend variables

# Redeploy sau khi thêm environment variables
vercel --prod

# Kiểm tra build logs cho environment variable warnings
```

### Debug Commands

```bash
# Kiểm tra deployment status
vercel ls

# Check function logs
vercel logs [deployment-url]

# Pull environment variables locally
vercel env pull .env.local

# Test locally với production environment
vercel env pull .env.production.local
vercel dev --env-file .env.production.local
```

---

## 📊 Monitoring & Maintenance

### 1. Vercel Monitoring

```bash
# Vercel Dashboard → Analytics
# - Page views
# - Unique visitors
# - Bandwidth usage
# - Function invocations

# Vercel Dashboard → Functions
# - Function performance
# - Error rates
# - Response times
# - Memory usage
```

### 2. Firebase Monitoring

```bash
# Firebase Console → Monitoring
# - Authentication metrics
# - Database operations
# - Storage usage
# - Function logs

# Firebase Console → Firestore → Usage
# - Read/write operations
# - Storage size
# - Network egress
```

### 3. Performance Monitoring

```bash
# Setup Google Analytics
# Track user behavior
# Monitor Core Web Vitals

# Setup error tracking (Sentry - optional)
# Monitor JavaScript errors
# API error tracking
```

### 4. Regular Maintenance Tasks

#### Weekly:
```bash
# Update dependencies
npm audit
npm update

# Check deployment status
vercel ls

# Review error logs
# Vercel Dashboard → Functions → Logs
```

#### Monthly:
```bash
# Security audit
npm audit --audit-level moderate

# Performance review
# Check Vercel Analytics
# Review Firebase usage

# Backup verification
# Test backup restore process
```

#### Before major updates:
```bash
# Create deployment backup
vercel rollback [deployment-url]

# Test in preview environment
git checkout -b staging
git push origin staging
```

---

## 🔒 Security Checklist

### 1. Environment Variables Security

- ✅ **Không commit .env files**
- ✅ **Private keys được escape properly trong Vercel**
- ✅ **Sensitive vars không có REACT_APP_ prefix**
- ✅ **Production và development environment phân biệt**

### 2. Firebase Security Rules

- ✅ **Firestore rules restrictive**
- ✅ **Authentication required cho sensitive operations**
- ✅ **Service account có least privilege**
- ✅ **API keys không bị leak**

```javascript
// Example Firestore Rules (Production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for quiz content
    match /quizzes/{quizId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User data - private access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Access keys - admin only
    match /accessKeys/{keyId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. API Security

- ✅ **JWT token validation**
- ✅ **Admin role verification**
- ✅ **Input sanitization**
- ✅ **Rate limiting (Vercel provides basic)**

```javascript
// API Security Middleware (示例)
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
```

### 4. Frontend Security

- ✅ **No sensitive data trong client-side code**
- ✅ **Secure HTTPS connections**
- ✅ **Content Security Policy headers**
- ✅ **XSS protection**

```html
<!-- CSP Headers (add to vercel.json) -->
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

### 5. Dependency Security

```bash
# Regular security audit
npm audit

# Update dependencies
npm update

# Check for vulnerabilities
npm audit --audit-level high

# Remove unused dependencies
npm prune
```

---

## ⚡ Production Optimization

### 1. Build Optimization

```bash
# Enable production optimizations
npm run build

# Bundle analysis
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# Code splitting
# React lazy loading
# Dynamic imports
```

### 2. Caching Strategy

```javascript
// vercel.json caching headers
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

### 3. Image Optimization

```bash
# Use WebP format
# Responsive images
# Lazy loading
# CDN optimization (Vercel handles this)
```

### 4. API Optimization

```javascript
// Firestore query optimization
// Use indexes
// Batch operations
// Cache frequent data

// Example optimized query
const getQuizData = async (quizId) => {
  const quizRef = db.collection('quizzes').doc(quizId);
  const quizSnap = await quizRef.get();
  
  if (!quizSnap.exists) {
    throw new Error('Quiz not found');
  }
  
  return {
    id: quizSnap.id,
    ...quizSnap.data()
  };
};
```

### 5. Performance Monitoring

```bash
# Vercel Analytics
# Web Vitals tracking
# Bundle size monitoring
# API response time tracking

# Setup Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

---

## 💾 Backup Strategies

### 1. Firebase Data Backup

```bash
# Manual export (Firebase Console)
# Firestore → Export Data → Select collections

# Automated backup script
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Export Firestore
gcloud firestore export $BACKUP_DIR

# Backup authentication users
gcloud auth application-default login
gsutil -m cp -r $BACKUP_DIR gs://your-backup-bucket/
```

### 2. Environment Variables Backup

```bash
# Create .env.backup (never commit this file!)
cp .env.local .env.backup

# Export from Vercel
vercel env ls > vercel-env-backup.txt
```

### 3. Code Repository Backup

```bash
# GitHub repository backup
# Multiple remotes
git remote add backup https://github.com/backup/repo.git
git push backup main

# Local repository backup
git bundle create repo.bundle --all
```

### 4. Deployment Backup

```bash
# Vercel deployment rollback
vercel rollback [deployment-url]

# Create deployment tag
vercel alias [deployment-url] backup-staging
```

### 5. Automated Backup Script

```bash
#!/bin/bash
# backup.sh - Daily backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

echo "Starting backup process at $DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup environment variables
echo "Backing up environment variables..."
vercel env ls > $BACKUP_DIR/vercel-env.txt

# Backup Firestore data
echo "Backing up Firestore..."
gcloud firestore export $BACKUP_DIR/firestore

# Backup repository
echo "Backing up repository..."
git bundle create $BACKUP_DIR/repo.bundle --all

# Upload to cloud storage
echo "Uploading to cloud storage..."
gsutil -m cp -r $BACKUP_DIR gs://your-backup-bucket/

echo "Backup completed: $BACKUP_DIR"
```

### 6. Recovery Procedures

```bash
# Restore Firestore from backup
gcloud firestore import $BACKUP_DIR/firestore

# Restore environment variables
# Manually re-enter via Vercel Dashboard

# Restore repository
git clone repo.bundle restored-repo
cd restored-repo
git checkout main
```

---

## 📞 Support & Contact

### Documentation Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)

### Community Support:
- [Vercel Discord](https://vercel.com/discord)
- [Firebase Support](https://firebase.google.com/support)

### Emergency Contacts:
- **Production Issues**: Check Vercel Status Page
- **Firebase Issues**: Check Firebase Status Page
- **Deployment Rollback**: `vercel rollback [deployment-url]`

---

## ✅ Checklist cuối cùng

Trước khi deploy production, đảm bảo hoàn thành:

- [ ] **Firebase project configured**
- [ ] **Vercel account setup**
- [ ] **Environment variables configured**
- [ ] **Local development tested**
- [ ] **Production build successful**
- [ ] **API endpoints tested**
- [ ] **Firebase security rules configured**
- [ ] **CORS properly configured**
- [ ] **Authentication working**
- [ ] **Error handling implemented**
- [ ] **Backup strategy in place**
- [ ] **Monitoring setup**
- [ ] **Security checklist completed**

---

🎉 **Chúc bạn deploy thành công Azota Quiz App!**

**Mọi thắc mắc hoặc cần hỗ trợ, vui lòng kiểm tra troubleshooting section hoặc tạo issue trong repository.**