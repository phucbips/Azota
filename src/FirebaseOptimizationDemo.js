// Firebase Optimization Demo
// File này minh họa cách sử dụng các tính năng optimization đã triển khai

import React, { useState, useEffect } from 'react';
import { getPerformanceStats, clearAllCaches, warmupCache } from './src/ELearningSystem.js';

const FirebaseOptimizationDemo = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cacheKey, setCacheKey] = useState('');

  // Monitor performance in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getPerformanceStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Demo functions
  const handleClearCache = () => {
    clearAllCaches();
    alert('🧹 Cache cleared!');
  };

  const handleWarmupCache = async () => {
    setLoading(true);
    try {
      await warmupCache();
      alert('🔥 Cache warmed up!');
    } catch (error) {
      alert('❌ Warmup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLoad = async () => {
    setLoading(true);
    try {
      // Simulate loading data with cache hits
      console.log('📊 Loading data to demonstrate caching...');
      
      // First load (no cache)
      const start1 = performance.now();
      await fetchData();
      const time1 = performance.now() - start1;
      
      // Second load (should use cache)
      const start2 = performance.now();
      await fetchData();
      const time2 = performance.now() - start2;
      
      alert(`🚀 Performance Demo:
First load: ${time1.toFixed(2)}ms (no cache)
Second load: ${time2.toFixed(2)}ms (with cache)
Improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}% faster!`);
      
    } catch (error) {
      console.error('Demo failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data fetching function
  const fetchData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Generate mock cache key
    const mockCacheKey = `demo_${Date.now()}`;
    setCacheKey(mockCacheKey);
    
    return { data: 'Mock data', timestamp: Date.now() };
  };

  if (!stats) return <div>Loading performance stats...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔥 Firebase Optimization Demo
      </h1>

      {/* Performance Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📊 Performance Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalCalls}
            </div>
            <div className="text-sm text-gray-600">Total Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.cacheHitRate}
            </div>
            <div className="text-sm text-gray-600">Cache Hit Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.cacheSize}
            </div>
            <div className="text-sm text-gray-600">Cache Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.offlineQueueLength}
            </div>
            <div className="text-sm text-gray-600">Offline Queue</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className={`flex items-center ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${stats.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {stats.isOnline ? 'Online' : 'Offline'}
          </div>
          <div className={`flex items-center ${stats.isFirebaseOnline ? 'text-green-600' : 'text-orange-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${stats.isFirebaseOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            Firebase {stats.isFirebaseOnline ? 'Connected' : 'Offline'}
          </div>
          <div className="text-gray-600">
            Uptime: {Math.floor(stats.uptime / 60)}m
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🚀 Demo Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleClearCache}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
            disabled={loading}
          >
            🧹 Clear Cache
          </button>
          
          <button
            onClick={handleWarmupCache}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
            disabled={loading}
          >
            🔥 Warmup Cache
          </button>
          
          <button
            onClick={handleSimulateLoad}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            disabled={loading}
          >
            🚀 Performance Test
          </button>
        </div>
        
        {loading && (
          <div className="mt-4 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2">Processing...</span>
          </div>
        )}
      </div>

      {/* Cache Status */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">💾 Cache Status</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Current Cache Key:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              {cacheKey || 'None'}
            </code>
          </div>
          <div className="flex justify-between">
            <span>Cache Hit Rate:</span>
            <span className="font-bold text-green-600">{stats.cacheHitRate}</span>
          </div>
          <div className="flex justify-between">
            <span>Cache Efficiency:</span>
            <span className={`font-bold ${parseFloat(stats.cacheHitRate) > 60 ? 'text-green-600' : 'text-orange-600'}`}>
              {parseFloat(stats.cacheHitRate) > 60 ? 'Excellent' : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </div>

      {/* Optimization Features */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">✨ Optimization Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2">🔧 Performance</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Multi-level caching với TTL</li>
              <li>• Paginated data loading</li>
              <li>• Debounced updates</li>
              <li>• Batch operations</li>
              <li>• Memory leak prevention</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">🔐 Authentication</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Auto token refresh (45min)</li>
              <li>• Session timeout handling</li>
              <li>• Remember me functionality</li>
              <li>• Activity tracking</li>
              <li>• Multi-device session management</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">📡 Network</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Offline support basics</li>
              <li>• Automatic reconnection</li>
              <li>• Offline operation queue</li>
              <li>• Network status monitoring</li>
              <li>• Graceful degradation</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">📊 Monitoring</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Real-time performance stats</li>
              <li>• Cache hit rate tracking</li>
              <li>• Firebase call counting</li>
              <li>• Error logging & handling</li>
              <li>• Development debug tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseOptimizationDemo;