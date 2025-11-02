// 🧪 Test API - Không cần Firebase
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      message: '✅ API Test - Hoạt động bình thường!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
    return;
  }

  if (req.method === 'POST') {
    res.status(200).json({
      success: true,
      message: '✅ POST Request nhận thành công!',
      data: req.body || {},
      timestamp: new Date().toISOString(),
      method: req.method
    });
    return;
  }

  res.status(405).json({
    success: false,
    message: '❌ Method không được phép',
    allowed: ['GET', 'POST', 'OPTIONS']
  });
}