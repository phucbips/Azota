import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { callGeminiAPI } from '../utils/helpers';

// =====================================================
// COMPONENT: GeminiStudyHelper (Trợ lý AI Học tập)
// =====================================================
const GeminiStudyHelper = ({ quizTitle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [concepts, setConcepts] = useState('');

  const getConcepts = async () => {
    setLoading(true);
    setError('');
    setConcepts('');

    const prompt = `Bạn là một trợ lý gia sư. Một học sinh đang chuẩn bị làm bài tập về chủ đề: "${quizTitle}". 
Hãy liệt kê 3-5 khái niệm hoặc định lý cốt lõi quan trọng nhất mà học sinh cần ôn lại để làm tốt bài tập này. 
Trình bày dưới dạng gạch đầu dòng ngắn gọn.`;

    try {
      const result = await callGeminiAPI(prompt);
      setConcepts(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <BrainCircuit className="text-blue-600" size={28} />
        <h3 className="text-xl font-bold text-gray-800">Trợ lý AI: Gợi ý kiến thức</h3>
      </div>
      
      {!concepts && !loading && (
        <button
          onClick={getConcepts}
          className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Sparkles size={16} className="inline mr-2" />
          Lấy gợi ý
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" />
          <p>AI đang phân tích, vui lòng chờ...</p>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {concepts && (
        <div className="prose prose-sm max-w-none text-gray-700">
          <p>Để làm tốt chủ đề này, bạn nên ôn lại:</p>
          <pre className="whitespace-pre-wrap font-sans bg-white/50 p-4 rounded-lg">{concepts}</pre>
        </div>
      )}
    </div>
  );
};

export default GeminiStudyHelper;