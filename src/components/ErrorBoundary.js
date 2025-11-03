import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to external service (tùy chọn)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Tùy chọn: Gửi lỗi đến service monitoring (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      console.group('🔴 Production Error Details');
      console.log('Error ID:', this.state.errorId);
      console.log('Error:', error);
      console.log('Error Info:', errorInfo);
      console.log('User Agent:', navigator.userAgent);
      console.log('URL:', window.location.href);
      console.groupEnd();
      
      // Có thể thêm logic gửi đến external service ở đây
      // this.sendToErrorService(error, errorInfo, this.state.errorId);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
            {/* Icon */}
            <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-600" size={48} />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Oops! Có gì đó không ổn
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-8">
              Ứng dụng gặp lỗi không mong muốn. Chúng tôi đã được thông báo và sẽ khắc phục sớm.
            </p>

            {/* Error ID for support */}
            <div className="bg-gray-100 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600 mb-2">Mã lỗi để hỗ trợ:</p>
              <code className="text-sm font-mono text-gray-800 bg-white px-3 py-1 rounded border">
                {this.state.errorId}
              </code>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg"
              >
                <RefreshCw size={20} />
                Thử lại
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-lg"
              >
                <RefreshCw size={20} />
                Tải lại trang
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-gray-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-700 transition shadow-lg"
              >
                <Home size={20} />
                Về trang chủ
              </button>
            </div>

            {/* Development Error Details */}
            {isDevelopment && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Bug className="text-red-600" size={20} />
                  <h3 className="text-lg font-bold text-red-800">Chi tiết lỗi (Development)</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-red-700 mb-2">Error Message:</h4>
                    <p className="text-red-600 font-mono text-sm bg-white p-3 rounded border">
                      {this.state.error.toString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-red-700 mb-2">Stack Trace:</h4>
                    <pre className="text-red-600 font-mono text-xs bg-white p-3 rounded border overflow-x-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Support */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-2">
                Vẫn còn vấn đề? Hãy liên hệ với chúng tôi:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
                <a 
                  href="mailto:support@azota.vn" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  support@azota.vn
                </a>
                <span className="hidden sm:inline text-gray-400">|</span>
                <span className="text-gray-600">
                  Hotline: 1900-xxxx
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;