import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastConfig = () => {
    const configs = {
      success: {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        icon: CheckCircle,
        titleColor: 'text-green-800'
      },
      error: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        icon: XCircle,
        titleColor: 'text-red-800'
      },
      warning: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        icon: AlertTriangle,
        titleColor: 'text-yellow-800'
      },
      info: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        icon: Info,
        titleColor: 'text-blue-800'
      }
    };

    return configs[toast.type] || configs.info;
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${config.bgColor} ${config.borderColor} border rounded-xl p-4 shadow-lg
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${config.titleColor}`}>
            {toast.message}
          </p>
          
          {toast.details && (
            <p className="text-sm text-gray-600 mt-1">
              {toast.details}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          className={`
            ${config.iconColor} hover:opacity-70 transition-opacity
            flex-shrink-0 p-1 rounded-md hover:bg-white/50
          `}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.iconColor.replace('text-', 'bg-')} animate-shrink`}
            style={{
              animationDuration: `${toast.duration}ms`
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// Toast Manager Component
const ToastManager = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', options = {}) => {
    const {
      duration = 5000,
      details = null,
      title = null
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

  // Global toast methods
  const toast = {
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options),
    custom: (message, type, options) => addToast(message, type, options)
  };

  // Provide toast methods to children
  return (
    <>
      {typeof children === 'function' ? children(toast) : children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default ToastManager;

// Simple hooks for easy usage
export const useToast = () => {
  const [toastManager, setToastManager] = useState(null);

  const addToast = (message, type = 'info', options = {}) => {
    // Create a custom event to communicate with ToastManager
    window.dispatchEvent(new CustomEvent('addToast', {
      detail: { message, type, options }
    }));
  };

  return {
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options)
  };
};