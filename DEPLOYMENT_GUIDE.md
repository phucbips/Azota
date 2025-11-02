# Quiz App - Hệ thống Quản lý Access Key

## Tổng quan
Ứng dụng Quiz được xây dựng bằng React (frontend) kết hợp với Vercel API functions (backend) để quản lý access key và quyền truy cập.

## Chức năng chính
- **Frontend React**: Giao diện người dùng cho ứng dụng quiz
- **API Functions**: Quản lý access key và quyền truy cập
  - `createAccessKey`: Tạo access key mới
  - `grantRole`: Cấp quyền truy cập
  - `manualGrant`: Cấp quyền thủ công
  - `redeemAccessKey`: Sử dụng access key
  - `requestOrder`: Yêu cầu đơn hàng

## Cấu trúc dự án
```
quiz-app/
├── api/                 # Vercel API functions
│   ├── createAccessKey.js
│   ├── grantRole.js
│   ├── manualGrant.js
│   ├── redeemAccessKey.js
│   ├── requestOrder.js
│   └── lib/
│       └── firebaseAdmin.js
├── src/                 # React frontend source
├── public/              # Static files
├── package.json         # Dependencies
├── vercel.json          # Vercel configuration
└── .gitignore
```

## Hướng dẫn Deploy lên Vercel

### Bước 1: Chuẩn bị dự án
1. Upload toàn bộ thư mục `quiz-app` lên GitHub repository
2. Hoặc sử dụng Vercel CLI để deploy trực tiếp

### Bước 2: Deploy qua Vercel Dashboard
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập
2. Click "New Project"
3. Import từ GitHub repository hoặc upload folder trực tiếp
4. Vercel sẽ tự động detect đây là React app và build

### Bước 3: Cấu hình Environment Variables
Trong Vercel dashboard, thêm các biến môi trường cần thiết:

**Firebase Configuration:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Bước 4: Cấu hình CORS
File `vercel.json` đã được cấu hình CORS cho phép mọi domain:
```
"Access-Control-Allow-Origin": "*"
```

## API Endpoints
Các API functions sẽ available tại:
- `POST https://your-app.vercel.app/api/createAccessKey`
- `POST https://your-app.vercel.app/api/grantRole`
- `POST https://your-app.vercel.app/api/manualGrant`
- `POST https://your-app.vercel.app/api/redeemAccessKey`
- `POST https://your-app.vercel.app/api/requestOrder`

## Yêu cầu đặc biệt
- **Firebase Admin**: API functions sử dụng Firebase Admin SDK
- **Authentication**: Cần token xác thực để truy cập các API
- **Admin Role**: Chỉ user có role "admin" mới được tạo access key

## Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Deploy to Vercel
npx vercel
```

## Lưu ý quan trọng
- Frontend được build từ React app (distDir: build)
- Backend API functions được deploy qua @vercel/node
- CORS đã được cấu hình cho mọi domain
- Environment variables Firebase cần được set trong Vercel dashboard