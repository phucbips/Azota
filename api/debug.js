// Simple test endpoint - không cần import gì cả
export default async function handler(req, res) {
  res.status(200).json({
    message: "🚀 Test endpoint working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body || "No body"
  });
}