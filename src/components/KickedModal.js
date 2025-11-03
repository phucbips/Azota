import React from 'react';
import { XCircle } from 'lucide-react';

// =====================================================
// COMPONENT: KickedModal (Modal Bị đá)
// =====================================================
const KickedModal = () => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <XCircle className="mx-auto text-red-500" size={64} />
      <h2 className="text-2xl font-bold mt-6 mb-4">Phiên đăng nhập hết hạn</h2>
      <p className="text-gray-600 mb-8">
        Tài khoản của bạn đã được đăng nhập trên một thiết bị khác.
        Vì lý do bảo mật, bạn đã bị đăng xuất khỏi thiết bị này.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        Đăng nhập lại
      </button>
    </div>
  </div>
);

export default KickedModal;