# SECRET REFERENCE ERROR - ĐÃ FIX

## 🚨 Lỗi gặp phải:
```
Environment Variable "FIREBASE_SERVICE_ACCOUNT_KEY" references Secret "firebase-service-account-key", which does not exist.
```

## 🔧 Nguyên nhân:
Trong file `vercel.json` cũ có reference đến secret `@firebase-service-account-key` nhưng secret này chưa được tạo trong Vercel dashboard.

## ✅ Giải pháp đã áp dụng:
**Đã xóa reference đến secret** trong `vercel.json`:
```json
// TRƯỚC:
"env": {
  "SKIP_PREFLIGHT_CHECK": "true",
  "FIREBASE_SERVICE_ACCOUNT_KEY": "@firebase-service-account-key"
}

// SAU:
"env": {
  "SKIP_PREFLIGHT_CHECK": "true"
}
```

## 🎯 Cách set Environment Variable trong Vercel:

### Bước 1: Vào Vercel Dashboard
1. Chọn project của bạn
2. Vào **Settings** → **Environment Variables**

### Bước 2: Thêm Environment Variable
Click **"Add New"** và nhập:
```
Name: FIREBASE_SERVICE_ACCOUNT_KEY
Value: [Paste toàn bộ JSON từ Firebase Service Account]
Environment: Production, Preview, Development
```

### Bước 3: Lấy JSON từ Firebase
1. Vào [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Click "Generate new private key"
4. Download file JSON
5. Copy toàn bộ nội dung JSON vào Value

### Ví dụ JSON Value:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0B...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## 🔄 Cách khác (nếu muốn dùng Secret):
Nếu bạn muốn dùng Vercel Secrets thay vì Environment Variables:

### Bước 1: Tạo Secret
```bash
# Dùng Vercel CLI
vercel secrets add firebase-service-account-key "$(cat path/to/service-account.json)"
```

### Bước 2: Khôi phục reference trong vercel.json
Thêm lại vào `vercel.json`:
```json
"env": {
  "SKIP_PREFLIGHT_CHECK": "true",
  "FIREBASE_SERVICE_ACCOUNT_KEY": "@firebase-service-account-key"
}
```

## ✅ Status hiện tại:
- ✅ Đã xóa secret reference khỏi vercel.json
- ✅ Cần set environment variable trong Vercel dashboard
- ✅ Build sẽ thành công sau khi set đúng environment variable

## 📁 File đã update:
- `vercel.json` - Đã fix secret reference error
- Project sẵn sàng deploy sau khi set environment variable