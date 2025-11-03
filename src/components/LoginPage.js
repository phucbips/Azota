import React, { useState } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Loader2 
} from 'lucide-react';
import { 
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from '../utils/firebase';

// =====================================================
// PAGE: LoginPage (Đăng nhập / Đăng ký)
// =====================================================
const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = async (action) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged sẽ tự động xử lý
      } 
      else if (action === 'register') {
        if (password.length < 6) {
          throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } 
      else if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      }
      else if (action === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Đã gửi email reset mật khẩu! Vui lòng kiểm tra hòm thư.');
      }
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản với email này.');
          break;
        case 'auth/wrong-password':
          setError('Sai mật khẩu. Vui lòng thử lại.');
          break;
        case 'auth/email-already-in-use':
          setError('Email này đã được sử dụng.');
          break;
        case 'auth/weak-password':
          setError('Mật khẩu quá yếu.');
          break;
        case 'auth/invalid-email':
          setError('Email không hợp lệ.');
          break;
        case 'auth/popup-closed-by-user':
          setError('Bạn đã đóng cửa sổ đăng nhập Google.');
          break;
        default:
          setError('Đã xảy ra lỗi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const AuthButton = ({ action, children, className }) => (
    <button
      onClick={() => handleAuthAction(action)}
      disabled={loading}
      className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 disabled:opacity-50 ${className}`}
    >
      {loading && <Loader2 className="animate-spin" size={20} />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            E-Learning System
          </h1>
          <p className="text-gray-600">Nền tảng học tập trực tuyến</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Lỗi</p>
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Thành công</p>
            <p>{message}</p>
          </div>
        )}

        <div className="mb-6 flex border-b">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 font-semibold ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Đăng nhập</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 font-semibold ${mode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Đăng ký</button>
        </div>

        {mode === 'reset' ? (
          <div className="space-y-6">
            <p className="text-gray-600 text-center">Nhập email để nhận link reset mật khẩu.</p>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <AuthButton action="reset" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg">
              Gửi link Reset
            </AuthButton>
            <button onClick={() => setMode('login')} className="w-full text-blue-600 font-semibold">
              Quay lại Đăng nhập
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            {mode === 'login' && (
              <>
                <AuthButton action="login" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg">
                  Đăng nhập
                </AuthButton>
                <button onClick={() => setMode('reset')} className="w-full text-sm text-blue-600 text-right">
                  Quên mật khẩu?
                </button>
              </>
            )}
            
            {mode === 'register' && (
              <AuthButton action="register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg">
                Đăng ký
              </AuthButton>
            )}

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">hoặc</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <AuthButton action="google" className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </AuthButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;