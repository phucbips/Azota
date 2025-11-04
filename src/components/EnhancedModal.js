import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Heart, Zap, Sparkles } from 'lucide-react';
import EnhancedButton, { MagicalButton, SuccessButton, DangerButton } from './EnhancedButton';

// ✨ Enhanced Modal Component với nhiều loại và animations đẹp mắt
const EnhancedModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'default',
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  actions = [],
  emoji = null,
  gradient = false,
  blur = true,
  animation = 'bounce',
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // 🎯 Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExiting(false);
      document.body.style.overflow = 'hidden';
      
      // Focus management
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }, 300);
    } else {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
      }, 300);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 🎹 Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, closeOnEscape]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      handleClose();
    }
  };

  // 🎨 Modal type configurations
  const typeConfigs = {
    default: {
      headerBg: gradient ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 'bg-gray-600',
      icon: Info,
      iconColor: 'text-blue-500',
      borderColor: 'border-gray-200',
      emoji: emoji || '💬'
    },
    success: {
      headerBg: gradient ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-green-600',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      borderColor: 'border-green-200',
      emoji: emoji || '🎉'
    },
    error: {
      headerBg: gradient ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-red-600',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-200',
      emoji: emoji || '😰'
    },
    warning: {
      headerBg: gradient ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : 'bg-yellow-600',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-200',
      emoji: emoji || '⚠️'
    },
    info: {
      headerBg: gradient ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : 'bg-blue-600',
      icon: Info,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-200',
      emoji: emoji || '💡'
    },
    magical: {
      headerBg: 'gradient-animated',
      icon: Sparkles,
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-200',
      emoji: emoji || '✨'
    },
    love: {
      headerBg: gradient ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-pink-600',
      icon: Heart,
      iconColor: 'text-pink-500',
      borderColor: 'border-pink-200',
      emoji: emoji || '💖'
    }
  };

  // 📏 Size configurations
  const sizeConfigs = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full'
  };

  // 🎭 Animation types
  const animationClasses = {
    bounce: 'modal-content',
    fade: 'slide-up',
    zoom: 'bounce-in',
    slide: 'slide-up'
  };

  const config = typeConfigs[type] || typeConfigs.default;
  const Icon = config.icon;

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        modal-backdrop
        ${blur ? 'backdrop-blur-sm' : ''}
        ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}
      `}
      onClick={handleOverlayClick}
    >
      {/* 🌟 Background decorations cho magical type */}
      {type === 'magical' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse text-yellow-300"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${0.5 + Math.random() * 1}rem`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      <div
        ref={modalRef}
        className={`
          card-enhanced w-full ${sizeConfigs[size]} 
          ${animationClasses[animation]}
          ${isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          ${className}
          ${config.borderColor} border-2
          transition-all duration-300 transform-gpu
          relative z-10
        `}
        {...props}
      >
        {/* 🎨 Header */}
        {(title || type !== 'default') && (
          <div className={`
            ${config.headerBg} text-white px-6 py-4 rounded-t-2xl
            flex items-center justify-between
            ${type === 'magical' ? 'glow-focus' : ''}
          `}>
            <div className="flex items-center gap-3">
              {config.emoji && (
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>
                  {config.emoji}
                </span>
              )}
              <Icon size={24} className="text-white drop-shadow-lg" />
              {title && (
                <h3 className="text-xl font-bold drop-shadow-sm">
                  {title}
                </h3>
              )}
            </div>
            
            {showCloseButton && (
              <button
                ref={firstFocusableRef}
                onClick={handleClose}
                className="
                  text-white/80 hover:text-white transition-all duration-200
                  p-2 rounded-full hover:bg-white/20
                  transform hover:scale-110 hover:rotate-90
                "
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* 📝 Content */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* 🎯 Actions */}
        {actions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            {actions.map((action, index) => {
              const ActionComponent = action.variant === 'magical' ? MagicalButton 
                : action.variant === 'success' ? SuccessButton
                : action.variant === 'danger' ? DangerButton
                : EnhancedButton;

              return (
                <ActionComponent
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || 'ghost'}
                  disabled={action.disabled}
                  loading={action.loading}
                  {...action.props}
                >
                  {action.label}
                </ActionComponent>
              );
            })}
          </div>
        )}

        {/* 🌊 Ripple effect cho magical modals */}
        {type === 'magical' && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 Pre-defined modal types
export const SuccessModal = ({ children, actions = [], ...props }) => (
  <EnhancedModal
    type="success"
    actions={[
      {
        label: '🎉 Tuyệt vời!',
        variant: 'success',
        onClick: props.onClose
      },
      ...actions
    ]}
    {...props}
  >
    {children}
  </EnhancedModal>
);

export const ErrorModal = ({ children, actions = [], ...props }) => (
  <EnhancedModal
    type="error"
    actions={[
      {
        label: '😔 Đã hiểu',
        variant: 'danger',
        onClick: props.onClose
      },
      ...actions
    ]}
    {...props}
  >
    {children}
  </EnhancedModal>
);

export const ConfirmModal = ({ 
  children, 
  onConfirm, 
  onCancel, 
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  ...props 
}) => (
  <EnhancedModal
    type="warning"
    actions={[
      {
        label: cancelText,
        variant: 'ghost',
        onClick: onCancel || props.onClose
      },
      {
        label: `⚡ ${confirmText}`,
        variant: 'warning',
        onClick: onConfirm
      }
    ]}
    {...props}
  >
    {children}
  </EnhancedModal>
);

export const MagicalModal = ({ children, ...props }) => (
  <EnhancedModal
    type="magical"
    gradient
    blur
    animation="bounce"
    {...props}
  >
    {children}
  </EnhancedModal>
);

export const LoveModal = ({ children, ...props }) => (
  <EnhancedModal
    type="love"
    gradient
    animation="bounce"
    {...props}
  >
    {children}
  </EnhancedModal>
);

// 🎊 Loading Modal với animations
export const LoadingModal = ({ 
  isOpen, 
  message = 'Đang xử lý...', 
  type = 'magical',
  ...props 
}) => (
  <EnhancedModal
    isOpen={isOpen}
    type={type}
    closeOnOverlay={false}
    closeOnEscape={false}
    showCloseButton={false}
    size="sm"
    {...props}
  >
    <div className="text-center py-8">
      <div className="loading-dots mx-auto mb-4">
        <div className="bg-purple-500"></div>
        <div className="bg-blue-500"></div>
        <div className="bg-green-500"></div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </EnhancedModal>
);

// 🎮 Game-like Achievement Modal
export const AchievementModal = ({ 
  isOpen, 
  title, 
  description, 
  icon = '🏆',
  onClose,
  ...props 
}) => (
  <EnhancedModal
    isOpen={isOpen}
    onClose={onClose}
    type="magical"
    size="md"
    title={title}
    emoji={icon}
    gradient
    animation="bounce"
    actions={[
      {
        label: '🎉 Tuyệt vời!',
        variant: 'magical',
        onClick: onClose
      }
    ]}
    {...props}
  >
    <div className="text-center py-4">
      <div className="text-6xl mb-4 animate-bounce">{icon}</div>
      <p className="text-lg text-gray-600 mb-4">{description}</p>
      <div className="text-yellow-500">
        ⭐ ⭐ ⭐ ⭐ ⭐
      </div>
    </div>
  </EnhancedModal>
);

export default EnhancedModal;