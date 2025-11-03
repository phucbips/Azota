# 🔐 Firestore Security Rules - Hướng dẫn triển khai

## 📋 Tổng quan

File `firestore.rules` đã được tạo với các đặc điểm sau:

### 🛡️ Cấp độ bảo mật cao
- **Authentication bắt buộc**: Tất cả operations đều yêu cầu đăng nhập
- **Role-based Access Control (RBAC)**: Phân quyền theo vai trò admin, teacher, student
- **Data validation**: Kiểm tra quyền sở hữu dữ liệu

### 👥 Phân quyền chi tiết

#### 🔴 **Admin**
- Quản lý tất cả users (CRUD)
- Quản lý môn học, khóa học, quiz
- Quản lý đơn hàng, giao dịch, access keys
- Xem tất cả tiến độ học tập và báo cáo
- Quản lý cấu hình hệ thống

#### 🟡 **Teacher**
- Quản lý môn học và khóa học
- Tạo, chỉnh sửa quiz (chỉ quiz của mình)
- Xem tiến độ học tập của học sinh
- Tạo thông báo

#### 🟢 **Student**
- Xem thông tin cơ bản của tất cả users
- Xem danh sách môn học, khóa học, quiz
- Tạo và quản lý đơn hàng của mình
- Tham gia quiz và xem kết quả
- Cập nhật tiến độ học tập của mình

## 🚀 Cách triển khai

### Bước 1: Deploy Firestore Rules
```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Login Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules

# Hoặc deploy toàn bộ project
firebase deploy
```

### Bước 2: Kiểm tra rules
```bash
# Test rules với Firebase CLI
firebase emulators:start --only firestore
```

### Bước 3: Thiết lập Custom Claims
Firebase Auth custom claims cần được set cho mỗi user:

```javascript
// Set role cho user (chạy trong Firebase Functions hoặc Admin SDK)
admin.auth().setCustomUserClaims(userId, { 
  role: 'admin' | 'teacher' | 'student' 
});
```

## 📊 Các collection được bảo vệ

| Collection | Admin | Teacher | Student | Mô tả |
|------------|--------|---------|---------|-------|
| **users** | Full | Read | Own | Quản lý người dùng |
| **subjects** | Full | Full | Read | Môn học |
| **courses** | Full | Full | Read | Khóa học |
| **quizzes** | Full | Own | Read | Bài kiểm tra |
| **orders** | Full | - | Own | Đơn hàng |
| **transactions** | Full | - | - | Giao dịch |
| **accessKeys** | Full | - | Check | Mã truy cập |
| **quizResponses** | Full | Full | Own | Câu trả lời |
| **userProgress** | Full | Full | Own | Tiến độ |
| **announcements** | Full | Full | Read | Thông báo |
| **systemConfig** | Full | Read | Read | Cấu hình |

## ⚠️ Lưu ý quan trọng

### 🔧 Setup Custom Claims
Đảm bảo Firebase Auth custom claims được thiết lập đúng:
- Admin users cần có `role: 'admin'`
- Teacher users cần có `role: 'teacher'`  
- Student users cần có `role: 'student'`

### 🧪 Testing
- Test tất cả các role khác nhau
- Kiểm tra truy cập không được phép bị từ chối
- Verify data isolation giữa các users

### 📈 Monitoring
- Sử dụng Firebase Console để theo dõi security rules violations
- Set up alerts cho unauthorized access attempts

## 🔍 Troubleshooting

### Lỗi "Permission denied"
1. Kiểm tra user đã đăng nhập chưa
2. Verify custom claims đã được set đúng
3. Kiểm tra logic của rules

### Lỗi "Index required"
1. Firestore có thể yêu cầu tạo indexes cho complex queries
2. Deploy file `firestore.indexes.json` kèm theo

### Lỗi "Document not found"
1. Kiểm tra collection và document ID
2. Verify quyền đọc cho collection đó

## 📚 Tài liệu tham khảo

- [Firebase Firestore Security Rules](https://firebase.google.com/docs/rules)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)