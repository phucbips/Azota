import React, { Suspense } from 'react';
import ELearningSystem from './ELearningSystem';
import ErrorBoundary from './components/ErrorBoundary';
import { GlobalLoader } from './components/LoadingComponents';

// Lazy load ELearningSystem for better performance
const LazyELearningSystem = React.lazy(() => import('./ELearningSystem'));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<GlobalLoader message="Đang tải ứng dụng..." />}>
        <LazyELearningSystem />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
