import React from 'react';
import { AlertCircle } from 'lucide-react';

// =====================================================
// MODAL: ConfirmLoginModal (Xác nhận Đăng nhập)
// =====================================================
const ConfirmLoginModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-500" size={64} />
          <h2 className="text-2xl font-bold mt-6 mb-4">Phát hiện phiên đăng nhập</h2>
          <p className="text-gray-600 mb-8">
            Tài khoản này đã được đăng nhập trên một thiết bị khác. Bạn có muốn tiếp tục và đăng xuất thiết bị kia không?
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLoginModal;