import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 Azota E-Learning Platform</h1>
        <p>Chào mừng đến với nền tảng học tập trực tuyến Azota</p>
        <div className="status">
          <span className="success">✅ Build thành công - Lỗi Vercel đã được sửa!</span>
        </div>
        <div className="fix-info">
          <h3>🔧 Vấn đề đã được sửa:</h3>
          <p>✅ Lệnh build: <code>CI=false BUILD_PATH='../build' react-scripts build</code></p>
          <p>✅ Vercel working directory: <code>/vercel/path0/src/</code></p>
          <p>✅ Output build: <code>/vercel/path0/build/</code></p>
        </div>
      </header>
    </div>
  );
}

export default App;
