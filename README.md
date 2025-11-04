# Azota Frontend - Hệ thống quản lý học sinh

Ứng dụng React.js được xây dựng để quản lý học sinh với Firebase backend, hỗ trợ authentication, quản lý dữ liệu học sinh và giao diện người dùng hiện đại.

## 🚀 Tính năng chính

- **Authentication**: Đăng nhập/đăng ký với Firebase Auth
- **Quản lý học sinh**: CRUD operations cho dữ liệu học sinh
- **Real-time updates**: Cập nhật dữ liệu real-time với Firestore
- **Responsive design**: Giao diện responsive với Tailwind CSS
- **Form validation**: Validation toàn diện cho forms
- **Error handling**: Xử lý lỗi với Error Boundaries
- **Toast notifications**: Hệ thống thông báo cho người dùng
- **Loading states**: Các trạng thái loading cho UX tốt hơn
- **PWA ready**: Progressive Web App support

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- npm >= 7.0.0 hoặc yarn >= 1.22.0
- Firebase project với Firestore và Authentication được kích hoạt

## 🛠 Cài đặt

### 1. Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd azota-frontend

# Cài đặt dependencies
npm install
# hoặc
yarn install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc với các biến môi trường sau:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API Configuration (nếu có)
REACT_APP_API_URL=http://localhost:3001/api

# Environment
REACT_APP_ENV=development
```

### 3. Firebase Setup

1. Tạo Firebase project tại [Firebase Console](https://console.firebase.google.com/)
2. Kích hoạt Authentication với Email/Password
3. Tạo Firestore database
4. Copy configuration từ Firebase Console vào file `.env`

## 🚀 Chạy ứng dụng

### Development Mode

```bash
npm start
# hoặc
yarn start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Production Build

```bash
npm run build
# hoặc
yarn build
```

Build files sẽ được tạo trong thư mục `build/`

### Testing

```bash
npm test
# hoặc
yarn test
```

## 📁 Cấu trúc Project

```
src/
├── components/          # React components
│   ├── ErrorBoundary.js    # Error handling
│   ├── KickedModal.js      # Session expiration modal
│   ├── LoadingComponents.js # Loading states
│   └── Toast.js           # Toast notifications
├── hooks/              # Custom React hooks
│   └── useFormValidation.js # Form validation hook
├── utils/              # Utility functions
│   ├── firebase.js      # Firebase configuration
│   └── validation.js    # Validation rules
├── App.js              # Main App component
├── index.js            # App entry point
└── index.css           # Global styles
```

## 🔧 Cấu hình Firebase

### Authentication Setup

1. Đăng nhập Firebase Console
2. Chọn Authentication > Sign-in method
3. Kích hoạt Email/Password provider
4. Cấu hình authorized domains

### Firestore Setup

1. Chọn Firestore Database
2. Tạo database trong production mode
3. Cấu hình security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ authenticated users có thể truy cập
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📦 Dependencies

### Core Dependencies
- **react** ^19.2.0 - React framework
- **react-dom** ^19.2.0 - React DOM renderer
- **react-scripts** 5.0.1 - Create React App scripts

### Firebase & Backend
- **firebase** ^11.1.0 - Firebase SDK

### Styling & UI
- **tailwindcss** ^3.4.1 - Utility-first CSS framework
- **lucide-react** ^0.469.0 - Icon library
- **autoprefixer** ^10.4.19 - CSS post-processor
- **postcss** ^8.4.38 - CSS transformation tool

### Testing
- **@testing-library/react** ^16.3.0 - React testing utilities
- **@testing-library/jest-dom** ^6.9.1 - Jest DOM matchers
- **@testing-library/user-event** ^14.6.1 - User event simulation

### Performance
- **web-vitals** ^4.2.4 - Core web vitals measurement

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| REACT_APP_FIREBASE_API_KEY | Firebase API key | ✅ |
| REACT_APP_FIREBASE_AUTH_DOMAIN | Firebase auth domain | ✅ |
| REACT_APP_FIREBASE_PROJECT_ID | Firebase project ID | ✅ |
| REACT_APP_FIREBASE_STORAGE_BUCKET | Firebase storage bucket | ✅ |
| REACT_APP_FIREBASE_MESSAGING_SENDER_ID | Firebase messaging sender ID | ✅ |
| REACT_APP_FIREBASE_APP_ID | Firebase app ID | ✅ |
| REACT_APP_FIREBASE_MEASUREMENT_ID | Firebase measurement ID | ⚪ |
| REACT_APP_API_URL | Backend API URL | ⚪ |
| REACT_APP_ENV | Environment (development/production) | ⚪ |

## 🚀 Deployment

### Netlify

1. Kết nối repository với Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Thêm environment variables trong Netlify dashboard
5. Deploy

### Vercel

1. Import repository vào Vercel
2. Framework preset: Create React App
3. Thêm environment variables
4. Deploy

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add scripts to package.json:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```
3. Deploy: `npm run deploy`

## 🐛 Troubleshooting

### Firebase Configuration Issues

- Đảm bảo Firebase config đúng trong `.env`
- Kiểm tra Firebase project đã được kích hoạt đầy đủ services
- Verify authorized domains trong Firebase Console

### Build Issues

- Xóa `node_modules` và cài đặt lại: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Kiểm tra Node.js version: `node --version`

### Runtime Issues

- Kiểm tra console errors trong browser DevTools
- Verify Firebase rules allow truy cập data
- Check network requests trong Network tab

## 📝 Development Guidelines

### Code Style
- Sử dụng ESLint rules đã cấu hình
- Follow React best practices
- Sử dụng functional components với hooks
- Đặt tên files với PascalCase cho components

### Error Handling
- Sử dụng ErrorBoundary cho component errors
- Validate forms với useFormValidation hook
- Handle Firebase errors gracefully
- Hiển thị user-friendly error messages

### Performance
- Lazy load components khi cần thiết
- Optimize Firebase queries
- Sử dụng React.memo cho expensive components
- Monitor performance với web-vitals

## 🔧 Troubleshooting

### Vấn đề NPM Permissions

Nếu gặp lỗi `EACCES: permission denied` khi chạy `npm install`:

```bash
# Giải pháp 1: Cài đặt với sudo (Linux/macOS)
sudo npm install

# Giải pháp 2: Reset npm config và thử lại
npm config delete prefix
npm install

# Giải pháp 3: Dùng yarn thay vì npm
npm install -g yarn
yarn install

# Giải pháp 4: Cài đặt Node.js với nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm use node
npm install
```

### Vấn đề Build

Nếu gặp lỗi khi build:

```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json
npm install

# Build với CI=false
CI=false npm run build
```

### Vấn đề Firebase

Nếu gặp lỗi Firebase connection:

1. Kiểm tra file `.env` có đúng format không
2. Đảm bảo Firebase project có Firestore và Authentication được kích hoạt
3. Kiểm tra rules của Firestore database
4. Verify API keys trong Firebase Console

## 📄 License

MIT License

## 👥 Support

Để được hỗ trợ, vui lòng tạo issue trong repository hoặc liên hệ qua email: support@azota.edu.vn

---

**Phiên bản**: 0.1.0  
**Cập nhật lần cuối**: 2025-11-04