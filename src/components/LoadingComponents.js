import React from 'react';
import { Loader2 } from 'lucide-react';

// Global Loading Spinner
export const GlobalLoader = ({ message = "Đang tải ứng dụng..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4 text-white">
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-6" size={64} />
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  </div>
);

// Inline Loading Spinner
export const InlineLoader = ({ size = "md", text = "Đang tải..." }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {text && <span className="text-gray-600 font-medium">{text}</span>}
    </div>
  );
};

// Card Skeleton
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-300 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-8 bg-gray-300 rounded-full w-20"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-300 rounded w-24"></div>
            <div className="h-10 bg-gray-300 rounded-lg w-28"></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-6 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-6">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Form Skeleton
export const FormSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
      <div className="space-y-6">
        {/* Form Title */}
        <div className="h-8 bg-gray-300 rounded-lg w-1/3 mb-8"></div>
        
        {/* Form Fields */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
        ))}
        
        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <div className="h-12 bg-gray-300 rounded-xl w-24"></div>
          <div className="h-12 bg-gray-300 rounded-xl w-32"></div>
        </div>
      </div>
    </div>
  );
};

// Quiz Card Skeleton
export const QuizCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300 rounded-lg mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="h-5 bg-gray-300 rounded w-16"></div>
            <div className="h-10 bg-gray-300 rounded-lg w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// User Dashboard Skeleton
export const UserDashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 bg-white/20 rounded-lg w-64 mb-2 animate-pulse"></div>
              <div className="h-5 bg-white/20 rounded-lg w-48 animate-pulse"></div>
            </div>
            <div className="h-12 bg-white/20 rounded-xl w-32 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 bg-white rounded-xl w-32 animate-pulse flex-shrink-0"></div>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton count={3} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded-lg mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ 
  progress = 0, 
  text = "", 
  color = "blue",
  showPercentage = true,
  size = "md"
}) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600", 
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    purple: "bg-purple-600"
  };

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-6"
  };

  return (
    <div className="w-full">
      {(text || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {text && <span className="text-sm font-medium text-gray-700">{text}</span>}
          {showPercentage && <span className="text-sm text-gray-500">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        ></div>
      </div>
    </div>
  );
};

// Step Progress Component
export const StepProgress = ({ 
  steps = [], 
  currentStep = 0, 
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted 
                    ? 'bg-green-600 text-white' 
                    : isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={`text-xs mt-2 ${
                isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded ${
                isCompleted ? 'bg-green-600' : 'bg-gray-300'
              }`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Dots Loading Animation
export const DotsLoader = ({ color = "blue", size = "md" }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    purple: "bg-purple-600"
  };

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full animate-bounce`}
          style={{ animationDelay: `${index * 0.1}s` }}
        ></div>
      ))}
    </div>
  );
};

// Pulse Loading Effect
export const PulseLoader = ({ text = "Đang xử lý..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{text}</p>
    </div>
  );
};