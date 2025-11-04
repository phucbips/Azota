import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Heart,
  Zap
} from 'lucide-react';
import { 
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from '../utils/firebase';

// Import enhanced components
import EnhancedButton, { 
  SuccessButton, 
  MagicalButton, 
  ActionButton,
  RainbowButton 
} from './EnhancedButton';
import { useEnhancedToast } from './EnhancedToast';

// ✨ Enhanced LoginPage với animations và effects đẹp mắt
const EnhancedLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toast = useEnhancedToast();

  // 🌟 Animation on mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // 🎯 Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!password && mode !== 'reset') {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (password && password.length < 6 && mode === 'register') {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuthAction = async (action) => {
    if (!validateForm() && action !== 'google') {
      toast.warning('Vui lòng kiểm tra lại thông tin', { 
        details: 'Có lỗi trong form đăng nhập' 
      });
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'google') {
        toast.info('Đang kết nối với Google...', { emoji: '🔄' });
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        toast.success('Đăng nhập Google thành công!', { 
          details: 'Chào mừng bạn đến với hệ thống!',
          emoji: '🎉'
        });
      } 
      else if (action === 'register') {
        toast.info('Đang tạo tài khoản...', { emoji: '⏳' });
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Tạo tài khoản thành công!', { 
          details: 'Bạn có thể đăng nhập ngay bây giờ',
          emoji: '🎊'
        });
      } 
      else if (action === 'login') {
        toast.info('Đang đăng nhập...', { emoji: '🔐' });
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Đăng nhập thành công!', { 
          details: 'Chào mừng bạn trở lại!',
          emoji: '🎉'
        });
      }
      else if (action === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Đã gửi email reset mật khẩu! Vui lòng kiểm tra hòm thư.');
        toast.magic('Email đã được gửi!', { 
          details: 'Kiểm tra hộp thư để đặt lại mật khẩu',
          emoji: '✨'
        });
      }
    } catch (err) {
      console.error(err);
      let errorMessage = '';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Không tìm thấy tài khoản với email này.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Sai mật khẩu. Vui lòng thử lại.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email này đã được sử dụng.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu quá yếu.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Bạn đã đóng cửa sổ đăng nhập Google.';
          break;
        default:
          errorMessage = 'Đã xảy ra lỗi: ' + err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { 
        details: 'Vui lòng thử lại sau',
        emoji: '😰'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Enhanced Input Component
  const EnhancedInput = ({ 
    icon: Icon, 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    error,
    ...props 
  }) => (
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          input-enhanced w-full px-4 py-3 pl-12 rounded-xl
          ${type === 'password' ? 'pr-12' : ''}
          ${error ? 'border-red-400 wobble-error' : 'focus:border-blue-500'}
          font-medium
        `}
        {...props}
      />
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      {error && (
        <div className="absolute -bottom-6 left-0 text-red-500 text-sm font-medium animate-bounce">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 🌟 Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className={`
        card-enhanced max-w-md w-full p-8 rounded-3xl shadow-2xl
        ${isVisible ? 'bounce-in' : 'opacity-0 scale-95'}
        relative z-10
      `}>
        {/* 🎓 Header với floating animation */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg float-animation">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-4xl font-bold gradient-text-animated mb-2">
            E-Learning System
          </h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            Nền tảng học tập trực tuyến
            <Heart size={16} className="text-red-500 animate-pulse" />
          </p>
        </div>

        {/* 🚨 Error/Success Messages với animations */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6 wobble-error">
            <p className="font-bold flex items-center gap-2">
              😰 Lỗi
            </p>
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6 bounce-in">
            <p className="font-bold flex items-center gap-2">
              🎉 Thành công
            </p>
            <p>{message}</p>
          </div>
        )}

        {/* 🔄 Mode Tabs với enhanced styling */}
        <div className="mb-6 flex border-b">
          <button 
            onClick={() => setMode('login')} 
            className={`
              flex-1 py-3 font-semibold transition-all duration-300
              ${mode === 'login' 
                ? 'text-blue-600 border-b-2 border-blue-600 transform scale-105' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            🔐 Đăng nhập
          </button>
          <button 
            onClick={() => setMode('register')} 
            className={`
              flex-1 py-3 font-semibold transition-all duration-300
              ${mode === 'register' 
                ? 'text-blue-600 border-b-2 border-blue-600 transform scale-105' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            📝 Đăng ký
          </button>
        </div>

        {/* 🔄 Reset Password Mode */}
        {mode === 'reset' ? (
          <div className="space-y-6 slide-up">
            <p className="text-gray-600 text-center flex items-center justify-center gap-2">
              <Mail size={20} className="text-blue-500" />
              Nhập email để nhận link reset mật khẩu.
            </p>
            
            <EnhancedInput
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              error={formErrors.email}
            />
            
            <MagicalButton
              onClick={() => handleAuthAction('reset')}
              disabled={loading}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Gửi link Reset
            </MagicalButton>
            
            <button 
              onClick={() => setMode('login')} 
              className="w-full text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 📧 Email Input */}
            <EnhancedInput
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              error={formErrors.email}
            />
            
            {/* 🔒 Password Input */}
            <EnhancedInput
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              error={formErrors.password}
            />
            
            {/* 🎯 Action Buttons */}
            {mode === 'login' && (
              <div className="space-y-4">
                <ActionButton
                  action="submit"
                  onClick={() => handleAuthAction('login')}
                  disabled={loading}
                  loading={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  size="lg"
                >
                  Đăng nhập
                </ActionButton>
                
                <button 
                  onClick={() => setMode('reset')} 
                  className="w-full text-sm text-blue-600 text-right hover:text-blue-800 transition-colors"
                >
                  Quên mật khẩu? 🤔
                </button>
              </div>
            )}
            
            {mode === 'register' && (
              <SuccessButton
                onClick={() => handleAuthAction('register')}
                disabled={loading}
                loading={loading}
                className="w-full"
                size="lg"
              >
                Đăng ký
              </SuccessButton>
            )}

            {/* 🔗 Divider */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 bg-white px-3 rounded-full">hoặc</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* 🔥 Google Login Button */}
            <EnhancedButton
              onClick={() => handleAuthAction('google')}
              disabled={loading}
              loading={loading}
              variant="ghost"
              className="w-full border-2 border-gray-300 hover:border-gray-400 hover:shadow-lg"
              size="lg"
              glow
              sound
              haptic
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </EnhancedButton>
          </div>
        )}

        {/* 🌈 Easter egg - Rainbow mode toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => toast.magic('Chế độ Rainbow kích hoạt!', { emoji: '🌈' })}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✨ Khám phá chế độ đặc biệt ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginPage;