# Hướng dẫn cấu hình Firebase

## Cách lấy Firebase Configuration từ Firebase Console

### Bước 1: Truy cập Firebase Console
1. Đăng nhập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn hoặc tạo project mới

### Bước 2: Lấy Web App Configuration
1. Vào **Project Settings** (biểu tượng bánh răng)
2. Chọn tab **General**
3. Trong mục **Your apps**, click vào **Web** icon (</>)
4. Đặt tên cho ứng dụng (ví dụ: "E-Learning System")
5. Click **Register app**

### Bước 3: Copy Firebase Configuration
Firebase sẽ hiển thị config object tương tự như này:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

### Bước 4: Cập nhật file .env.local
Sao chép các giá trị này vào file `.env.local`:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG**: 
- Các biến `REACT_APP_*` sẽ được expose trong client-side code
- Đây là thiết kế bình thường của Firebase (client SDK)
- KHÔNG chia sẻ Firebase Admin credentials (private key, service account)
- Chỉ sử dụng REACT_APP_* cho client-side Firebase configuration

## Xác minh cấu hình
Sau khi cấu hình, ứng dụng sẽ log:
- "✅ Using Firebase config from environment variables" nếu thành công
- "⚠️ Using hardcoded Firebase config" nếu thiếu environment variables

Kiểm tra Console trong Developer Tools để xác nhận.