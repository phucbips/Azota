import React, { useState, useContext, useMemo } from 'react';
import { LogOut, BookOpen, Package, ShoppingCart } from 'lucide-react';
import { AppContext } from '../hooks/useAuth';
import { DataContext } from '../hooks/usePublicData';
import ShoppingCartComponent from './ShoppingCartComponent';
import GeminiStudyHelper from './GeminiStudyHelper';
import { calculateCartTotal } from '../utils/helpers';

// =====================================================
// PAGE: StudentDashboard (Trang của Học sinh)
// =====================================================
const StudentDashboard = ({ user, onLogout }) => {
  const { authUser } = useContext(AppContext);
  const [view, setView] = useState('my-quizzes'); // 'shop', 'my-quizzes'
  const [shopTab, setShopTab] = useState('subjects'); // 'subjects', 'courses'
  const [cart, setCart] = useState({ subjects: [], courses: [] });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  
  const { subjects, courses, quizzes } = useContext(DataContext);
  
  const unlockedQuizzes = useMemo(() => {
    return (user.unlockedQuizzes || [])
      .map(quizId => quizzes.find(q => q.id === quizId))
      .filter(Boolean);
  }, [user.unlockedQuizzes, quizzes]);

  const addToCart = (type, id) => {
    if (type === 'subject') {
      if (!cart.subjects.includes(id)) {
        setCart({ ...cart, subjects: [...cart.subjects, id] });
      }
    } else if (type === 'course') {
      if (!cart.courses.includes(id)) {
        setCart({ ...cart, courses: [...cart.courses, id] });
      }
    }
  };

  const removeFromCart = (type, id) => {
    if (type === 'subject') {
      setCart({ ...cart, subjects: cart.subjects.filter(s => s !== id) });
    } else if (type === 'course') {
      setCart({ ...cart, courses: cart.courses.filter(c => c !== id) });
    }
  };

  const handleRequestOrder = async () => {
    setPaymentLoading(true);
    try {
      if (!authUser) throw new Error("Người dùng chưa đăng nhập");
      const token = await authUser.getIdToken();
      
      const totalAmount = calculateCartTotal(cart, subjects, courses);
      
      alert(`Demo: Yêu cầu thanh toán ${totalAmount.toLocaleString('vi-VN')}đ cho ${cart.subjects.length} môn và ${cart.courses.length} khóa học.`);
      setCart({ subjects: [], courses: [] });

    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu:", err);
      alert("Lỗi khi gửi yêu cầu: " + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderShop = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShopTab('subjects')}
              className={`px-6 py-3 rounded-xl font-semibold transition text-lg flex items-center gap-2 ${
                shopTab === 'subjects'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen size={20} /> Môn học
            </button>
            <button
              onClick={() => setShopTab('courses')}
              className={`px-6 py-3 rounded-xl font-semibold transition text-lg flex items-center gap-2 ${
                shopTab === 'courses'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package size={20} /> Khóa học
            </button>
          </div>

          {shopTab === 'subjects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjects.map(subject => (
                <div key={subject.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
                      <p className="text-gray-600 text-sm">{subject.quizIds?.length || 0} bài tập</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {subject.price?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart('subject', subject.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              ))}
            </div>
          )}

          {shopTab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-2 border-purple-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {course.subjectIds?.length || 0} môn học • {course.quizIds?.length || 0} bài tập
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {course.price?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart('course', course.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ShoppingCartComponent
              cart={cart}
              onRemoveItem={removeFromCart}
              onCheckout={handleRequestOrder}
              loading={paymentLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyQuizzes = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold mb-8">Bài tập của tôi</h2>
      
      {unlockedQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Bạn chưa có bài tập nào.</p>
          <p className="text-gray-400 mt-2">Mua môn học để mở khóa các bài tập!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unlockedQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-xl font-bold mb-4">{quiz.title}</h3>
              <button
                onClick={() => setSelectedQuiz(quiz)}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Làm bài tập
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQuizViewer = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button 
        onClick={() => setSelectedQuiz(null)}
        className="flex items-center gap-2 text-blue-600 font-semibold mb-6"
      >
        ← Quay lại
      </button>
      
      <h2 className="text-3xl font-bold mb-6">{selectedQuiz.title}</h2>
      
      <div className="bg-gray-200 rounded-2xl p-8 text-center">
        <p className="text-gray-600">Quiz Viewer - Embed code sẽ hiển thị ở đây</p>
        <code className="text-sm bg-gray-100 p-2 rounded mt-2 block">
          {selectedQuiz.embedCode}
        </code>
      </div>
      
      <GeminiStudyHelper quizTitle={selectedQuiz.title} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🎓 {user.hoTen}</h1>
              <p className="text-blue-100 mt-1">Học sinh - Lớp {user.lop}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition"
            >
              <LogOut size={20} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-4">
            <button
              onClick={() => setView('my-quizzes')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                view === 'my-quizzes'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen size={20} /> Bài tập
            </button>
            <button
              onClick={() => setView('shop')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                view === 'shop'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart size={20} /> Cửa hàng
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {selectedQuiz ? renderQuizViewer() : 
         view === 'shop' ? renderShop() : 
         renderMyQuizzes()}
      </div>
    </div>
  );
};

export default StudentDashboard;