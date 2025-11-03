import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { db, doc, setDoc, serverTimestamp } from '../utils/firebase';

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

export default OnboardingForm;