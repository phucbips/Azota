// Examples và Tests cho Error Handling và Loading States

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  CardSkeleton, 
  InlineLoader, 
  ProgressBar,
  TableSkeleton 
} from '../components/LoadingComponents';
import { useFormValidation } from '../hooks/useFormValidation';
import { validationSchemas } from '../utils/validation';
import ToastManager from '../components/Toast';

// Test Error Boundary
describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  test('hiển thị fallback UI khi có lỗi', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Oops! Có gì đó không ổn/i)).toBeInTheDocument();
    expect(screen.getByText(/mã lỗi để hỗ trợ/i)).toBeInTheDocument();
  });

  test('hiển thị nút thử lại', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tải lại trang/i })).toBeInTheDocument();
  });

  test('hiển thị error details trong development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/chi tiết lỗi/i)).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});

// Test Loading Components
describe('Loading Components', () => {
  test('CardSkeleton render correctly', () => {
    render(<CardSkeleton count={2} />);
    
    const skeletons = screen.getAllByRole('article');
    expect(skeletons).toHaveLength(2);
  });

  test('InlineLoader hiển thị text và spinner', () => {
    render(<InlineLoader text="Đang tải..." size="md" />);
    
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('ProgressBar hiển thị progress correctly', () => {
    render(<ProgressBar progress={75} text="Uploading..." color="blue" />);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  test('TableSkeleton render with correct dimensions', () => {
    render(<TableSkeleton rows={3} cols={4} />);
    
    const headers = screen.getAllByText('');
    expect(headers.length).toBeGreaterThan(0); // At least header columns
  });
});

// Test Form Validation
describe('Form Validation', () => {
  test('validate email format', () => {
    const TestComponent = () => {
      const { getFieldError } = useFormValidation(
        { email: 'invalid-email' },
        validationSchemas.login
      );

      return <div>{getFieldError('email')}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText(/Email không hợp lệ/i)).toBeInTheDocument();
  });

  test('validate required fields', () => {
    const TestComponent = () => {
      const { getFieldError } = useFormValidation(
        { email: '', password: '' },
        validationSchemas.login
      );

      return <div>{getFieldError('email')}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText(/là bắt buộc/i)).toBeInTheDocument();
  });

  test('validate password strength', () => {
    const TestComponent = () => {
      const { getFieldError } = useFormValidation(
        { password: '123' },
        validationSchemas.register
      );

      return <div>{getFieldError('password')}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText(/ít nhất 6 ký tự/i)).toBeInTheDocument();
  });

  test('validate password confirmation', () => {
    const TestComponent = () => {
      const { formData, getFieldError } = useFormValidation(
        { password: 'password123', confirmPassword: 'different' },
        validationSchemas.register
      );

      return <div>{getFieldError('confirmPassword')}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText(/không khớp/i)).toBeInTheDocument();
  });
});

// Test Input Sanitization
describe('Input Sanitization', () => {
  test('sanitize text input', () => {
    const { sanitizeInput } = require('../utils/validation');
    
    expect(sanitizeInput.text('  test <script>alert("xss")</script>  ')).toBe('test alert("xss")');
  });

  test('sanitize email input', () => {
    const { sanitizeInput } = require('../utils/validation');
    
    expect(sanitizeInput.email('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
  });

  test('sanitize iframe input', () => {
    const { sanitizeInput } = require('../utils/validation');
    
    const maliciousIframe = '<iframe src="javascript:alert(\'xss\')" onload="alert(\'xss\')"></iframe>';
    const sanitized = sanitizeInput.iframe(maliciousIframe);
    
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('onload=');
  });
});

// Test Toast Notifications
describe('Toast Notifications', () => {
  test('render toast container', () => {
    render(
      <ToastManager>
        {(toast) => (
          <div>
            <button onClick={() => toast.success('Test success')}>Show Success</button>
          </div>
        )}
      </ToastManager>
    );

    expect(screen.getByRole('button', { name: 'Show Success' })).toBeInTheDocument();
  });

  test('show success toast', async () => {
    render(
      <ToastManager>
        {(toast) => (
          <div>
            <button onClick={() => toast.success('Success!')}>Show Success</button>
          </div>
        )}
      </ToastManager>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});

// Integration Tests
describe('Integration Tests', () => {
  test('form submission với validation errors', async () => {
    const mockLogin = jest.fn();
    
    const LoginForm = () => {
      const { formData, handleChange, isFormValid } = useFormValidation(
        { email: '', password: '' },
        validationSchemas.login
      );

      const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) {
          mockLogin(formData);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input 
            data-testid="email" 
            value={formData.email}
            onChange={handleChange('email', { sanitize: true })}
          />
          <input 
            data-testid="password" 
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
          />
          <button type="submit" disabled={!isFormValid()}>
            Login
          </button>
        </form>
      );
    };

    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    expect(submitButton).toBeDisabled();
    
    fireEvent.change(screen.getByTestId('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'password123' } });
    
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('loading state transition', () => {
    const TestComponent = () => {
      const [loading, setLoading] = React.useState(false);
      
      React.useEffect(() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 100);
      }, []);

      return (
        <div>
          {loading ? <InlineLoader text="Loading..." /> : <div data-testid="content">Loaded</div>}
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for loading to complete
    setTimeout(() => {
      expect(screen.getByTestId('content')).toHaveTextContent('Loaded');
    }, 150);
  });
});

// Example Usage Files
export const ExampleErrorBoundary = () => (
  <ErrorBoundary>
    <div>
      <h1>My App</h1>
      {/* Your app components here */}
    </div>
  </ErrorBoundary>
);

export const ExampleLoadingStates = () => (
  <div>
    {/* Skeleton loading */}
    <CardSkeleton count={3} />
    
    {/* Progress bar */}
    <ProgressBar progress={60} text="Processing..." color="blue" />
    
    {/* Step progress */}
    <StepProgress 
      steps={['Đăng nhập', 'Xác thực', 'Hoàn tất']} 
      currentStep={1} 
    />
  </div>
);

export const ExampleFormWithValidation = () => {
  const {
    formData,
    errors,
    handleChange,
    isFormValid
  } = useFormValidation(
    {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchemas.register
  );

  return (
    <form>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={handleChange('email', { sanitize: true })}
          onBlur={handleChange('email')}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      
      <button type="submit" disabled={!isFormValid()}>
        Register
      </button>
    </form>
  );
};

export const ExampleToastUsage = () => (
  <ToastManager>
    {(toast) => (
      <div>
        <button onClick={() => toast.success('Operation successful!')}>
          Show Success
        </button>
        <button onClick={() => toast.error('Something went wrong!')}>
          Show Error
        </button>
        <button onClick={() => toast.warning('Please be careful!')}>
          Show Warning
        </button>
        <button onClick={() => toast.info('Here is some info')}>
          Show Info
        </button>
      </div>
    )}
  </ToastManager>
);