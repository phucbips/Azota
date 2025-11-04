import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles, Heart, Zap } from 'lucide-react';

const EnhancedToast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation with bounce
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 400);
  };

  const getToastConfig = () => {
    const configs = {
      success: {
        bgGradient: 'bg-gradient-to-r from-green-400 to-emerald-500',
        borderColor: 'border-green-300',
        iconColor: 'text-white',
        icon: CheckCircle,
        titleColor: 'text-white',
        emoji: '🎉',
        sparkles: true
      },
      error: {
        bgGradient: 'bg-gradient-to-r from-red-400 to-pink-500',
        borderColor: 'border-red-300',
        iconColor: 'text-white',
        icon: XCircle,
        titleColor: 'text-white',
        emoji: '😰',
        shake: true
      },
      warning: {
        bgGradient: 'bg-gradient-to-r from-yellow-400 to-orange-500',
        borderColor: 'border-yellow-300',
        iconColor: 'text-white',
        icon: AlertTriangle,
        titleColor: 'text-white',
        emoji: '⚠️',
        pulse: true
      },
      info: {
        bgGradient: 'bg-gradient-to-r from-blue-400 to-cyan-500',
        borderColor: 'border-blue-300',
        iconColor: 'text-white',
        icon: Info,
        titleColor: 'text-white',
        emoji: '💡',
        glow: true
      },
      love: {
        bgGradient: 'bg-gradient-to-r from-pink-400 to-red-400',
        borderColor: 'border-pink-300',
        iconColor: 'text-white',
        icon: Heart,
        titleColor: 'text-white',
        emoji: '💖',
        float: true
      },
      magic: {
        bgGradient: 'bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500',
        borderColor: 'border-purple-300',
        iconColor: 'text-white',
        icon: Sparkles,
        titleColor: 'text-white',
        emoji: '✨',
        magical: true
      }
    };

    return configs[toast.type] || configs.info;
  };

  const config = getToastConfig();
  const Icon = config.icon;

  // Create confetti effect for success toasts
  const createConfetti = () => {
    if (config.sparkles && isVisible) {
      const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#8b5cf6'];
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.className = 'confetti-piece';
          confetti.style.left = Math.random() * 100 + 'vw';
          confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.animationDelay = Math.random() * 3 + 's';
          document.body.appendChild(confetti);
          
          setTimeout(() => {
            confetti.remove();
          }, 3000);
        }, i * 100);
      }
    }
  };

  useEffect(() => {
    if (config.sparkles) {
      createConfetti();
    }
  }, [isVisible]);

  return (
    <div
      className={`
        transform transition-all duration-400 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${config.bgGradient} ${config.borderColor} border rounded-2xl p-4 shadow-2xl
        max-w-sm w-full backdrop-blur-sm
        ${config.shake ? 'wobble-error' : ''}
        ${config.float ? 'float-animation' : ''}
        ${config.magical ? 'gradient-animated' : ''}
        ${config.glow ? 'glow-focus' : ''}
        ${config.pulse ? 'animate-pulse' : ''}
        bounce-in
      `}
    >
      {/* Sparkle overlay for magical effect */}
      {config.magical && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Emoji và Icon với effects */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>
            {config.emoji}
          </span>
          <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5 drop-shadow-lg`} size={22} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.titleColor} drop-shadow-sm`}>
            {toast.message}
          </p>
          
          {toast.details && (
            <p className="text-sm text-white/90 mt-1 drop-shadow-sm">
              {toast.details}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          className={`
            text-white/80 hover:text-white transition-all duration-200
            flex-shrink-0 p-1.5 rounded-full hover:bg-white/20
            transform hover:scale-110 hover:rotate-90
          `}
        >
          <X size={16} />
        </button>
      </div>

      {/* Enhanced Progress bar with gradient */}
      {toast.duration > 0 && (
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r from-white/60 to-white/80 animate-shrink rounded-full shadow-inner`}
            style={{
              animationDuration: `${toast.duration}ms`
            }}
          ></div>
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer-loading"></div>
        </div>
      )}

      {/* Sound wave effect for info toasts */}
      {config.type === 'info' && (
        <div className="absolute -top-2 -right-2 w-6 h-6">
          <div className="absolute inset-0 border-2 border-blue-300 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>
      )}
    </div>
  );
};

// Enhanced Toast Container with stacking animation
const EnhancedToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * -8}px) scale(${1 - index * 0.05})`,
            zIndex: 1000 - index
          }}
        >
          <EnhancedToast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// Enhanced Toast Manager with more features
const EnhancedToastManager = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', options = {}) => {
    const {
      duration = 5000,
      details = null,
      title = null,
      sound = true
    } = options;

    const id = Date.now() + Math.random();
    const toast = {
      id,
      message: title ? `${title}: ${message}` : message,
      type,
      duration,
      details
    };

    setToasts(prev => [...prev, toast]);

    // Play sound effect (if browser supports it)
    if (sound && 'speechSynthesis' in window) {
      // Simple beep using Web Audio API for different types
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = {
        success: 800,
        error: 300,
        warning: 600,
        info: 500
      };
      
      const freq = frequencies[type] || 500;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // Enhanced toast methods with emoji support
  const toast = {
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options),
    love: (message, options) => addToast(message, 'love', options),
    magic: (message, options) => addToast(message, 'magic', options),
    custom: (message, type, options) => addToast(message, type, options)
  };

  return (
    <>
      {typeof children === 'function' ? children(toast) : children}
      <EnhancedToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default EnhancedToastManager;

// Enhanced hooks
export const useEnhancedToast = () => {
  const addToast = (message, type = 'info', options = {}) => {
    window.dispatchEvent(new CustomEvent('addEnhancedToast', {
      detail: { message, type, options }
    }));
  };

  return {
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options),
    love: (message, options) => addToast(message, 'love', options),
    magic: (message, options) => addToast(message, 'magic', options),
    // Shorthand methods with emojis
    celebrate: (message) => addToast(`🎉 ${message}`, 'success'),
    oops: (message) => addToast(`😅 ${message}`, 'error'),
    remind: (message) => addToast(`🔔 ${message}`, 'warning'),
    tip: (message) => addToast(`💡 ${message}`, 'info')
  };
};