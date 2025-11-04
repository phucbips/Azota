import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// ✨ Enhanced Button Component với nhiều effects đẹp mắt
const EnhancedButton = ({ 
  children, 
  onClick, 
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  emoji = null,
  gradient = true,
  glow = false,
  floating = false,
  sound = false,
  haptic = false,
  className = '',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);

  // 🎵 Sound effects
  const playSound = (type = 'click') => {
    if (!sound || !('AudioContext' in window)) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const frequencies = {
      click: 800,
      hover: 600,
      success: 900
    };
    
    oscillator.frequency.value = frequencies[type] || 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // 📱 Haptic feedback - with safety check
  const triggerHaptic = (intensity = 'medium') => {
    if (!haptic) return;
    
    // Only vibrate after user interaction (after DOM is ready)
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          const patterns = {
            light: 10,
            medium: 25,
            heavy: 50
          };
          
          navigator.vibrate(patterns[intensity] || 25);
        }
      } catch (error) {
        // Silently ignore vibration errors
        console.log('Vibration not available:', error.message);
      }
    }
  };

  // 🌊 Ripple effect
  const createRipple = (e) => {
    if (disabled || loading) return;
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // 🎯 Click handler với effects
  const handleClick = (e) => {
    if (disabled || loading) return;
    
    createRipple(e);
    setIsPressed(true);
    
    if (sound) playSound('click');
    if (haptic) triggerHaptic('medium');
    
    setTimeout(() => setIsPressed(false), 150);
    
    if (onClick) onClick(e);
  };

  // 🎨 Variant styles
  const variants = {
    primary: {
      base: gradient 
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
        : 'bg-blue-600 hover:bg-blue-700',
      text: 'text-white',
      shadow: 'shadow-lg hover:shadow-xl',
      glow: glow ? 'glow-focus' : ''
    },
    success: {
      base: gradient 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
        : 'bg-green-600 hover:bg-green-700',
      text: 'text-white',
      shadow: 'shadow-lg hover:shadow-xl hover:shadow-green-500/25',
      glow: glow ? 'glow-focus' : ''
    },
    warning: {
      base: gradient 
        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700' 
        : 'bg-yellow-600 hover:bg-yellow-700',
      text: 'text-white',
      shadow: 'shadow-lg hover:shadow-xl hover:shadow-yellow-500/25',
      glow: glow ? 'glow-focus' : ''
    },
    danger: {
      base: gradient 
        ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
        : 'bg-red-600 hover:bg-red-700',
      text: 'text-white',
      shadow: 'shadow-lg hover:shadow-xl hover:shadow-red-500/25',
      glow: glow ? 'glow-focus' : ''
    },
    ghost: {
      base: 'bg-transparent border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
      text: 'text-gray-700 hover:text-gray-900',
      shadow: 'hover:shadow-md',
      glow: ''
    },
    magical: {
      base: 'gradient-animated',
      text: 'text-white',
      shadow: 'shadow-xl hover:shadow-2xl',
      glow: 'glow-focus'
    }
  };

  // 📏 Size styles
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (sound) playSound('hover');
        if (haptic) triggerHaptic('light');
      }}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || loading}
      className={`
        btn-enhanced
        ${currentVariant.base}
        ${currentVariant.text}
        ${currentVariant.shadow}
        ${currentVariant.glow}
        ${currentSize}
        ${floating ? 'float-animation' : ''}
        ${isPressed ? 'scale-95' : 'hover:scale-105'}
        ${isHovered ? 'magic-hover' : ''}
        font-semibold rounded-xl
        transition-all duration-300 transform-gpu
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        relative overflow-hidden
        ${className}
      `}
      {...props}
    >
      {/* 🌊 Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '0.6s'
          }}
        />
      ))}

      {/* ✨ Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        )}
        
        {emoji && !loading && (
          <span className={`${isHovered ? 'animate-bounce' : ''}`}>
            {emoji}
          </span>
        )}
        
        {Icon && !loading && (
          <Icon 
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
            className={isHovered ? 'animate-pulse' : ''}
          />
        )}
        
        <span className={loading ? 'opacity-70' : ''}>
          {children}
        </span>
      </span>

      {/* 🌟 Magical sparkle effect */}
      {variant === 'magical' && isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </button>
  );
};

// 🎯 Pre-defined button types cho tiện dùng
export const PrimaryButton = (props) => (
  <EnhancedButton variant="primary" {...props} />
);

export const SuccessButton = (props) => (
  <EnhancedButton variant="success" emoji="🎉" sound haptic {...props} />
);

export const DangerButton = (props) => (
  <EnhancedButton variant="danger" emoji="⚠️" sound haptic {...props} />
);

export const MagicalButton = (props) => (
  <EnhancedButton variant="magical" emoji="✨" glow floating sound haptic {...props} />
);

export const GhostButton = (props) => (
  <EnhancedButton variant="ghost" {...props} />
);

// 🎮 Gaming-style action button
export const ActionButton = ({ action = 'click', children, ...props }) => {
  const actionEmojis = {
    click: '👆',
    submit: '🚀',
    save: '💾',
    delete: '🗑️',
    edit: '✏️',
    play: '▶️',
    pause: '⏸️',
    stop: '⏹️',
    download: '⬇️',
    upload: '⬆️',
    share: '📤',
    copy: '📋',
    star: '⭐',
    heart: '❤️',
    fire: '🔥',
    rocket: '🚀'
  };

  return (
    <EnhancedButton
      emoji={actionEmojis[action]}
      sound
      haptic
      glow
      {...props}
    >
      {children}
    </EnhancedButton>
  );
};

// 🌈 Rainbow button với cycling colors
export const RainbowButton = ({ children, ...props }) => {
  const [colorIndex, setColorIndex] = useState(0);
  const colors = [
    'from-red-500 to-pink-500',
    'from-pink-500 to-purple-500',
    'from-purple-500 to-indigo-500',
    'from-indigo-500 to-blue-500',
    'from-blue-500 to-cyan-500',
    'from-cyan-500 to-green-500',
    'from-green-500 to-yellow-500',
    'from-yellow-500 to-red-500'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex(prev => (prev + 1) % colors.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <EnhancedButton
      className={`bg-gradient-to-r ${colors[colorIndex]} transition-all duration-1000`}
      emoji="🌈"
      sound
      haptic
      glow
      floating
      {...props}
    >
      {children}
    </EnhancedButton>
  );
};

export default EnhancedButton;