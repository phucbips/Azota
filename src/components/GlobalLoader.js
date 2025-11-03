import React from 'react';
import { Loader2 } from 'lucide-react';

// =====================================================
// COMPONENT: GlobalLoader (Trình tải Toàn cục)
// =====================================================
const GlobalLoader = ({ message = "Đang tải ứng dụng..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4 text-white">
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-6" size={64} />
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  </div>
);

export default GlobalLoader;