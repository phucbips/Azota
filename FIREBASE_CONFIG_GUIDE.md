# ⚠️ THÔNG BÁO: Hai loại Firebase Config khác nhau

## 🔍 Phân biệt 2 loại Firebase Config:

### 1. **Firebase Web Config** (Sử dụng cho React app)
```env
# Đây là config cần thiết cho React app
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 2. **Firebase Service Account JSON** (Sử dụng cho server/admin)
```json
{
  "type": "service_account",
  "project_id": "thpt-chi-linh",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-fbsvc@thpt-chi-linh.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

---

## 🎯 Lời khuyên:

**Bạn đã cung cấp Service Account JSON → Cần Firebase Web Config**

Để lấy Firebase Web Config:
1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project **thpt-chi-linh**
3. Vào **Project Settings** > **General**
4. Scroll đến **Your apps** > Chọn app hoặc tạo app mới
5. Copy **Firebase SDK snippet**

---

## 📝 File .env.local mẫu cho project thpt-chi-linh

Nếu bạn có Firebase Web Config của project **thpt-chi-linh**:

```env
# ==========================================
# AZOTA E-LEARNING SYSTEM - Firebase Config
# ==========================================

# Firebase Configuration (từ Firebase Console > Project Settings)
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXX-your-real-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=thpt-chi-linh.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=thpt-chi-linh
REACT_APP_FIREBASE_STORAGE_BUCKET=thpt-chi-linh.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# API Configuration
REACT_APP_API_URL=https://your-app.vercel.app/api
REACT_APP_ENV=production

# Optional: Admin configuration (cho Vercel Functions)
ADMIN_EMAIL=admin@yourdomain.com
ALLOWED_DOMAINS=yourdomain.com

# Development (optional)
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=error
```

---

## 🔧 Cách lấy Firebase Web Config chính xác:

1. **Truy cập Firebase Console**: https://console.firebase.google.com
2. **Chọn project**: thpt-chi-linh
3. **Project Settings** > **General**
4. **Your apps section**
5. **Click vào app hoặc tạo web app mới**
6. **Copy config code** → Paste vào .env.local

**Template format đúng**:
```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=thpt-chi-linh.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=thpt-chi-linh
REACT_APP_FIREBASE_STORAGE_BUCKET=thpt-chi-linh.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

---

## 🚀 Sau khi có .env.local đúng:

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Chỉnh sửa với config thật
nano .env.local  # hoặc editor khác

# 3. Chạy development
npm start

# 4. Build production
npm run build
```