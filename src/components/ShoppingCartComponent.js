import React, { useState, useEffect, useContext } from 'react';
import { ShoppingCart, BookOpen, Package, Trash2, AlertCircle, Send, Loader2 } from 'lucide-react';
import { DataContext } from '../hooks/usePublicData';
import { formatCurrency, calculateCartTotal } from '../utils/helpers';

// =====================================================
// COMPONENT: ShoppingCartComponent (Giỏ hàng)
// =====================================================
const ShoppingCartComponent = ({ cart, onRemoveItem, onCheckout, loading }) => {
  const { subjects, courses } = useContext(DataContext);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (!subjects.length || !courses.length) return;
    
    const detectCartConflicts = () => {
      const detected = [];
      
      const courseSubjectIds = cart.courses
        .flatMap(courseId => {
          const course = courses.find(c => c.id === courseId);
          return course ? course.subjectIds : [];
        });

      const selectedSubjectIds = cart.subjects;

      selectedSubjectIds.forEach(subjectId => {
        if (courseSubjectIds.includes(subjectId)) {
          const subject = subjects.find(s => s.id === subjectId);
          const conflictCourse = courses.find(c => c.subjectIds.includes(subjectId) && cart.courses.includes(c.id));
          
          if (subject && conflictCourse) {
            detected.push({
              type: 'subject_in_course',
              subjectName: subject.name,
              courseName: conflictCourse.name
            });
          }
        }
      });
      return detected;
    };

    setConflicts(detectCartConflicts());
  }, [cart, subjects, courses]);

  const isEmpty = cart.subjects.length === 0 && cart.courses.length === 0;
  const total = calculateCartTotal(cart, subjects, courses);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart size={28} className="text-blue-600" />
        <h2 className="text-2xl font-bold">Giỏ hàng</h2>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
          {cart.subjects.length + cart.courses.length}
        </span>
      </div>

      {isEmpty ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingCart size={64} className="mx-auto mb-4 opacity-30" />
          <p>Giỏ hàng trống</p>
        </div>
      ) : (
        <>
          {conflicts.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold text-yellow-800 mb-2">⚠️ Phát hiện trùng lặp!</p>
                  {conflicts.map((conflict, i) => (
                    <p key={i} className="text-sm text-yellow-700">
                      • Môn <strong>{conflict.subjectName}</strong> đã có trong <strong>{conflict.courseName}</strong>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
            {cart.subjects.map(subjectId => {
              const subject = subjects.find(s => s.id === subjectId);
              if (!subject) return null;

              return (
                <div key={subjectId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-blue-600" size={24} />
                    <div>
                      <p className="font-semibold">{subject.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(subject.price)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem('subject', subjectId)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}

            {cart.courses.map(courseId => {
              const course = courses.find(c => c.id === courseId);
              if (!course) return null;

              return (
                <div key={courseId} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Package className="text-purple-600" size={24} />
                    <div>
                      <p className="font-semibold">{course.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(course.price)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem('course', courseId)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Tổng cộng:</span>
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>

            <button
              onClick={onCheckout}
              disabled={conflicts.length > 0 || loading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
              {loading ? 'Đang gửi...' : (conflicts.length > 0 ? 'Vui lòng xóa môn trùng lặp' : 'Gửi yêu cầu duyệt')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCartComponent;