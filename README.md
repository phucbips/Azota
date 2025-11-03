![Azota](https://img.shields.io/badge/Azota-E--Learning%20System-blue?style=for-the-badge&logo=graduation-cap)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-11.1.0-FFCA28?style=for-the-badge&logo=firebase)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

# 🎓 Azota E-Learning System

Hệ thống học tập trực tuyến Azota là một nền tảng giáo dục hiện đại được xây dựng với React và Firebase, cung cấp trải nghiệm học tập tương tác và quản lý khóa học toàn diện.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-4CAF50?style=for-the-badge&logo=vercel)](https://your-app.vercel.app)
[![Documentation](https://img.shields.io/badge/Documentation-View%20Docs-2196F3?style=for-the-badge&logo=gitbook)](./docs)
[![Issues](https://img.shields.io/badge/Issues-Report%20Bug-FF5722?style=for-the-badge&logo=github)](https://github.com/your-repo/azota/issues)

## ✨ Tính năng chính

### 🎯 Hệ thống học tập
- **📚 Quản lý khóa học** - Tạo, chỉnh sửa và quản lý khóa học một cách dễ dàng
- **🧠 Quiz & Bài tập** - Hệ thống câu hỏi tương tác với nhiều loại format
- **📊 Theo dõi tiến độ** - Dashboard chi tiết theo dõi học tập của học viên
- **🎯 Hệ thống điểm thưởng** - Khuyến khích học tập với điểm số và danh hiệu

### 🔐 Quản lý truy cập
- **🔑 Access Key System** - Quản lý quyền truy cập khóa học thông qua access key
- **👥 Phân quyền người dùng** - Admin, Student với các quyền khác nhau
- **🛡️ Bảo mật Firebase** - Authentication và Firestore database an toàn

### 💻 Giao diện người dùng
- **📱 Responsive Design** - Hoạt động tốt trên mọi thiết bị
- **🎨 Modern UI** - Giao diện đẹp mắt với TailwindCSS và Lucide Icons
- **⚡ Performance Optimized** - Lazy loading và tối ưu hóa hiệu suất
- **🔄 Real-time Updates** - Cập nhật thời gian thực với Firebase

### 🛠️ Tính năng kỹ thuật
- **🔧 Error Handling** - Xử lý lỗi toàn diện với Error Boundary
- **📊 Loading States** - Skeleton loaders và progress indicators
- **✅ Form Validation** - Validation real-time với visual feedback
- **🚀 API Integration** - Backend API với Express.js trên Vercel

## 🏗️ Technology Stack

### Frontend
- **React 19.2.0** - Modern React với hooks và context
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Firebase SDK** - Authentication và Firestore

### Backend
- **Vercel API Functions** - Serverless API endpoints
- **Express.js** - Node.js web framework
- **Firebase Admin SDK** - Server-side Firebase operations
- **Helmet & CORS** - Security middleware

### Database & Authentication
- **Firebase Firestore** - NoSQL database
- **Firebase Auth** - User authentication
- **Google Auth Provider** - Social login

### Deployment & Tools
- **Vercel** - Frontend và Backend deployment
- **npm** - Package management
- **ESLint** - Code linting
- **Web Vitals** - Performance monitoring

## 📋 Yêu cầu hệ thống

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Firebase Account** - Để tạo project và lấy credentials
- **Vercel Account** - Để deploy (có thể dùng free tier)

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/azota.git
cd azota
```

### 2. Cài đặt Dependencies
```bash
# Frontend dependencies
npm install

# Backend API dependencies
cd api
npm install
cd ..
```

### 3. Firebase Setup

#### Bước 1: Tạo Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" và làm theo hướng dẫn
3. Enable **Authentication** và **Firestore Database**
4. Trong Authentication > Sign-in method, enable **Google** provider

#### Bước 2: Lấy Firebase Configuration
1. Vào **Project Settings** (biểu tượng bánh răng)
2. Chọn tab **General**
3. Trong mục **Your apps**, click **Web** icon (</>)
4. Đặt tên app và click **Register app**
5. Copy Firebase config object

#### Bước 3: Cấu hình Environment Variables
Tạo file `.env.local` trong thư mục root:

```env
# Firebase Configuration (Frontend)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789

# Firebase Admin Configuration (Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# API Configuration
REACT_APP_API_URL=https://your-app.vercel.app/api
```

#### Bước 4: Firebase Admin Setup
1. Vào Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download file JSON và extract thông tin:
   - `project_id`
   - `client_email`
   - `private_key`

### 4. Chạy Local Development
```bash
# Start frontend development server
npm start

# API server sẽ chạy trên port 3001
# Frontend chạy trên port 3000
```

Ứng dụng sẽ khả dụng tại: http://localhost:3000

## 📝 Environment Variables

### Frontend Variables (`REACT_APP_*`)
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase API Key | ✅ |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | ✅ |
| `REACT_APP_FIREBASE_APP_ID` | Firebase App ID | ✅ |
| `REACT_APP_API_URL` | API Endpoint URL | ❌ |

### Backend Variables (Server-side only)
| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Email | ✅ |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Private Key | ✅ |

> **Lưu ý**: Các biến `REACT_APP_*` sẽ được expose trong client-side code. Đây là thiết kế bình thường của Firebase Client SDK.

## 🎯 Available Scripts

### Development Scripts
```bash
# Chạy development server
npm start

# Chạy tests
npm test

# Build for production
npm run build

# Eject configuration (one-way operation)
npm run eject
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting errors
npm run lint:fix
```

### Build & Deploy
```bash
# Build và preview production build locally
npm run build
npx serve -s build

# Deploy to Vercel
npx vercel --prod
```

## 📁 Project Structure

```
azota/
├── 📁 api/                     # Backend API functions
│   ├── createAccessKey.js      # Tạo access key mới
│   ├── grantRole.js           # Cấp quyền người dùng
│   ├── redeemAccessKey.js     # Sử dụng access key
│   ├── requestOrder.js        # Xử lý đơn hàng
│   ├── lib/
│   │   └── firebaseAdmin.js   # Firebase Admin configuration
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   ├── validation.js     # Request validation
│   │   └── caching.js        # Response caching
│   └── utils/
│       └── security.js       # Security utilities
├── 📁 src/                    # Frontend source code
│   ├── components/           # Reusable UI components
│   │   ├── ErrorBoundary.js  # Error boundary component
│   │   ├── LoadingComponents.js # Loading states & skeletons
│   │   ├── Toast.js         # Notification system
│   │   ├── LoginPage.js     # Login component
│   │   ├── StudentDashboard.js # Student dashboard
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js      # Authentication hook
│   │   ├── useFormValidation.js # Form validation hook
│   │   ├── useAdminData.js # Admin data hook
│   │   └── usePublicData.js # Public data hook
│   ├── utils/              # Utility functions
│   │   ├── firebase.js    # Firebase client config
│   │   ├── apiWrapper.js  # API client wrapper
│   │   ├── validation.js  # Validation schemas
│   │   └── helpers.js     # Helper functions
│   ├── styles/            # CSS styles
│   │   └── loading-animations.css # Loading animations
│   ├── tests/             # Test files
│   ├── App.js             # Main App component
│   ├── ELearningSystem.js # Main E-Learning system
│   └── index.js           # React entry point
├── 📁 public/             # Static files
├── 📁 build/              # Production build output
├── package.json           # Dependencies & scripts
├── vercel.json            # Vercel configuration
├── firebase.json          # Firebase configuration
└── tailwind.config.js     # TailwindCSS configuration
```

## 🔌 API Documentation

### Authentication Endpoints
Tất cả endpoints yêu cầu authentication token trong header:
```
Authorization: Bearer <firebase_id_token>
```

### Access Key Management

#### 🔑 Create Access Key
```http
POST /api/createAccessKey
Content-Type: application/json

{
  "courseId": "course123",
  "role": "student",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### 🎯 Redeem Access Key
```http
POST /api/redeemAccessKey
Content-Type: application/json

{
  "accessKey": "AK-123456789",
  "courseId": "course123"
}
```

#### 👤 Grant Role
```http
POST /api/grantRole
Content-Type: application/json

{
  "userId": "user123",
  "role": "student",
  "courseId": "course123"
}
```

#### 📦 Request Order
```http
POST /api/requestOrder
Content-Type: application/json

{
  "productId": "course123",
  "quantity": 1,
  "userId": "user123"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## 🚀 Deployment Guide

### Deploy to Vercel (Recommended)

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Deploy to production
vercel --prod
```

#### Method 2: GitHub Integration
1. Push code lên GitHub repository
2. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import từ GitHub repository
5. Vercel sẽ tự động detect React app và build

#### Environment Variables trên Vercel
Trong Vercel Dashboard > Settings > Environment Variables:

**Frontend Variables:**
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

**Backend Variables:**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### Deploy to Other Platforms

#### Netlify
1. Connect GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `build`
4. Add environment variables trong Netlify dashboard

#### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase hosting
firebase init hosting

# Deploy
firebase deploy
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Structure
```
src/tests/
├── error-handling-examples.js # Error handling test examples
├── components/               # Component tests
├── hooks/                   # Hook tests
└── utils/                   # Utility tests
```

## 🤝 Contributing Guidelines

### Development Workflow
1. **Fork** repository
2. **Clone** fork về local: `git clone https://github.com/your-username/azota.git`
3. **Create branch** cho feature: `git checkout -b feature/amazing-feature`
4. **Commit** changes: `git commit -m 'Add amazing feature'`
5. **Push** to branch: `git push origin feature/amazing-feature`
6. **Create Pull Request**

### Code Standards
- Follow **ESLint** rules (đã được cấu hình sẵn)
- Use **Prettier** cho code formatting
- Write **meaningful commit messages**
- Add **JSDoc comments** cho functions
- Include **tests** cho new features

### Commit Message Format
```
type(scope): short description

Longer description if needed.

- Point 1
- Point 2

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Guidelines
- ✅ Mô tả rõ ràng về feature/fix
- ✅ Include screenshots cho UI changes
- ✅ Ensure all tests pass
- ✅ Update documentation nếu cần
- ✅ Follow code style guidelines

## 📊 Performance

### Optimization Features
- **Lazy Loading** - Components được load khi cần thiết
- **Code Splitting** - Bundle được chia nhỏ để load nhanh hơn
- **Caching** - API responses được cache để giảm network calls
- **Error Boundaries** - Ứng dụng không crash khi có lỗi
- **Skeleton Loaders** - UI feedback tốt hơn khi loading

### Monitoring
- **Web Vitals** - Performance metrics tracking
- **Firebase Analytics** - User behavior analysis
- **Vercel Analytics** - Build và runtime performance

## 🔒 Security

### Security Measures
- **Environment Variables** - Sensitive data được lưu trong env vars
- **Firebase Security Rules** - Database access được kiểm soát
- **Input Validation** - Tất cả inputs được validate
- **CORS Configuration** - Proper CORS setup cho API
- **Rate Limiting** - API rate limiting để prevent abuse

### Best Practices
- Never commit sensitive data to git
- Use HTTPS trong production
- Keep dependencies updated
- Follow OWASP security guidelines

## 📱 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 88+ | ✅ Full |
| Firefox | 85+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 88+ | ✅ Full |
| Mobile Safari | 14+ | ✅ Full |
| Chrome Mobile | 88+ | ✅ Full |

## 🆘 Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase config
console.log(firebase.app().options);

# Verify environment variables
echo $REACT_APP_FIREBASE_API_KEY
```

#### Build Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules và reinstall
rm -rf node_modules
npm install

# Clear build cache
rm -rf build
npm run build
```

#### Vercel Deployment Issues
```bash
# Check build logs trên Vercel dashboard
# Verify environment variables được set correctly
# Ensure vercel.json configuration đúng
```

### Debug Mode
Set `NODE_ENV=development` trong environment variables để enable debug logs.

## 📞 Support & Contact

- **Documentation**: [Wiki](https://github.com/your-repo/azota/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/azota/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/azota/discussions)
- **Email**: support@azota.edu.vn

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits & Acknowledgments

- **React Team** - For the amazing React framework
- **Firebase Team** - For the powerful backend infrastructure
- **Vercel Team** - For seamless deployment platform
- **Tailwind Labs** - For the utility-first CSS framework
- **Lucide** - For the beautiful icon set

### Third-party Libraries
- [React](https://reactjs.org/) - UI Library
- [Firebase](https://firebase.google.com/) - Backend Services
- [Vercel](https://vercel.com/) - Deployment Platform
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework
- [Lucide Icons](https://lucide.dev/) - Icon Library
- [React Router](https://reactrouter.com/) - Routing
- [Express.js](https://expressjs.com/) - Web Framework

---

<div align="center">

**[⬆ Back to Top](#azota-e-learning-system)**

Made with ❤️ by the Azota Team

![GitHub stars](https://img.shields.io/github/stars/your-repo/azota?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-repo/azota?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/your-repo/azota?style=social)

</div>