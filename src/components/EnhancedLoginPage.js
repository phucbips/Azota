import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useFormValidation, useErrorHandler, useLoadingState, useToast } from '../hooks/useFormValidation';
import { validationSchemas } from '../utils/validation';
import { InlineLoader, FormSkeleton } from './LoadingComponents';

const EnhancedLoginPage = ({ onLogin, onRegister, onGoogleLogin, onResetPassword }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  
  // Initialize form validation
  const {
    formData,
    errors,
    touched,
    isValidating,
    handleChange,
    handleBlur,
    validateField,
    isFormValid,
    getFieldError,
    resetForm
  } = useFormValidation(
    {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchemas[mode] || validationSchemas.login
  );

  // Error and loading handlers
  const { handleApiCall } = useErrorHandler();
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const toast = useToast();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate entire form
    const isValid = validateAllFields();
    if (!isValid) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      const action = async () => {
        switch (mode) {
          case 'login':
            await onLogin(formData.email, formData.password);
            toast.success('Đăng nhập thành công!');
            break;
          case 'register':
            await onRegister(formData.email, formData.password);
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            setMode('login');
            resetForm();
            break;
          case 'reset':
            await onResetPassword(formData.email);
            toast.success('Đã gửi email reset mật khẩu!');
            setMode('login');
            resetForm();
            break;
          default:
            throw new Error('Chế độ không hợp lệ');
        }
      };

      await handleApiCall(action, {
        showSuccessMessage: false, // We handle success messages manually
        onError: (error) => {
          toast.error(error.message || 'Đã xảy ra lỗi');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Validate all fields
  const validateAllFields = () => {
    return Object.keys(validationSchemas[mode] || {}).every(fieldName => {
      const fieldConfig = validationSchemas[mode][fieldName];
      if (fieldConfig.required && (!formData[fieldName] || !formData[fieldName].trim())) {
        return false;
      }
      return true;
    });
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      await handleApiCall(onGoogleLogin, {
        showSuccessMessage: true,
        successMessage: 'Đăng nhập thành công!'
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // Switch mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetForm();
    setShowPassword(false);
  };

  // Field error display component
  const FieldError = ({ fieldName }) => {
    const error = getFieldError(fieldName);
    return error && (
      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
        <AlertCircle size={14} />
        {error}
      </p>
    );
  };

  // Form field component
  const FormField = ({ 
    name, 
    label, 
    type = 'text', 
    placeholder, 
    required = false,
    icon: Icon 
  }) => {
    const hasError = getFieldError(name);
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          )}
          <input
            type={type === 'password' && showPassword ? 'text' : type}
            value={formData[name]}
            onChange={handleChange(name, { sanitize: true })}
            onBlur={handleBlur(name)}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all
              ${Icon ? 'pl-12' : ''}
              ${hasError 
                ? 'border-red-300 focus:border-red-500 bg-red-50' 
                : 'border-gray-300 focus:border-blue-500 bg-white'
              }
            `}
            autoComplete={type === 'password' ? 'current-password' : 'off'}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        <FieldError fieldName={name} />
      </div>
    );
  };

  // Loading overlay
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  return (
    <ToastManager>
      {(toast) => (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GraduationCap size={48} />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                E-Learning System
              </h1>
              <p className="text-gray-600">Nền tảng học tập trực tuyến</p>
            </div>

            {/* Mode Tabs */}
            <div className="mb-6 flex border-b">
              <button 
                onClick={() => handleModeChange('login')} 
                className={`flex-1 py-3 font-semibold transition-all ${
                  mode === 'login' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đăng nhập
              </button>
              <button 
                onClick={() => handleModeChange('register')} 
                className={`flex-1 py-3 font-semibold transition-all ${
                  mode === 'register' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đăng ký
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'reset' ? (
                // Reset Password Form
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Nhập email để nhận link reset mật khẩu.
                  </p>
                  <FormField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Email của bạn"
                    icon={Mail}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isValidating || !isFormValid()}
                    className="w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 disabled:opacity-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                    Gửi link Reset
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleModeChange('login')} 
                    className="w-full text-blue-600 font-semibold hover:text-blue-700 transition"
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              ) : (
                // Login/Register Form
                <div className="space-y-6">
                  <FormField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Email"
                    icon={Mail}
                    required
                  />

                  <FormField
                    name="password"
                    label="Mật khẩu"
                    type="password"
                    placeholder="Mật khẩu"
                    icon={Lock}
                    required
                  />

                  {mode === 'register' && (
                    <FormField
                      name="confirmPassword"
                      label="Xác nhận mật khẩu"
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      icon={Lock}
                      required
                    />
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isValidating || !isFormValid()}
                    className="w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 disabled:opacity-50 bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                    {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </button>

                  {/* Forgot Password */}
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => handleModeChange('reset')} 
                      className="w-full text-sm text-blue-600 text-right hover:text-blue-700 transition"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">hoặc</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 disabled:opacity-50 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </button>

            {/* Form Validation Summary */}
            {mode !== 'reset' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Yêu cầu mật khẩu:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={`flex items-center gap-2 ${formData.password.length >= 6 ? 'text-green-600' : ''}`}>
                    {formData.password.length >= 6 ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border border-gray-300 rounded-full"></div>}
                    Ít nhất 6 ký tự
                  </li>
                  {mode === 'register' && (
                    <>
                      <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                        {/[A-Z]/.test(formData.password) ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border border-gray-300 rounded-full"></div>}
                        Ít nhất 1 chữ hoa
                      </li>
                      <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                        {/\d/.test(formData.password) ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border border-gray-300 rounded-full"></div>}
                        Ít nhất 1 số
                      </li>
                      <li className={`flex items-center gap-2 ${formData.password === formData.confirmPassword && formData.confirmPassword ? 'text-green-600' : ''}`}>
                        {formData.password === formData.confirmPassword && formData.confirmPassword ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border border-gray-300 rounded-full"></div>}
                        Mật khẩu khớp
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </ToastManager>
  );
};

export default EnhancedLoginPage;