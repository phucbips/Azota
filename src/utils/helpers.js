// =====================================================
// Utility Functions
// =====================================================

const generateSessionToken = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return "0 đ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Tách hàm tính tổng ra ngoài để dùng chung
const calculateCartTotal = (cart, subjects, courses) => {
  const subjectsTotal = cart.subjects.reduce((sum, subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return sum + (subject ? subject.price : 0);
  }, 0);

  const coursesTotal = cart.courses.reduce((sum, courseId) => {
    const course = courses.find(c => c.id === courseId);
    return sum + (course ? course.price : 0);
  }, 0);

  return subjectsTotal + coursesTotal;
};

// Hàm gọi Gemini API
const callGeminiAPI = async (prompt) => {
  const apiKey = ""; // API key sẽ được cung cấp bởi môi trường
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      return candidate.content.parts[0].text;
    } else {
      return "Không thể nhận được gợi ý vào lúc này.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Đã xảy ra lỗi khi kết nối với AI.";
  }
};

export {
  generateSessionToken,
  formatCurrency,
  calculateCartTotal,
  callGeminiAPI
};