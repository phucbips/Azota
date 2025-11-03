import { useState, useEffect, createContext, useContext } from 'react';
import { db, collection, onSnapshot, query } from '../utils/firebase';
import { AppContext } from './useAuth';

// Context
const DataContext = createContext(null);

// =====================================================
// HOOK: usePublicData (Tải dữ liệu chung)
// =====================================================
const usePublicData = () => {
  const { isAuthReady, authUser } = useContext(AppContext);
  const [data, setData] = useState({
    subjects: [],
    courses: [],
    quizzes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isAuthReady) return; // Chỉ chạy khi Auth đã sẵn sàng

    if (!authUser) {
        setData(prev => ({ ...prev, loading: false }));
        return;
    }

    const fetchCollection = (collectionName, setError) => {
      const q = query(collection(db, collectionName));
      
      return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({
          ...prev,
          [collectionName]: items,
        }));
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(`Lỗi tải ${collectionName}: ${err.message}`);
      });
    };

    const errors = [];
    // Ghi chú: Firestore Rules phải cho phép user đã auth đọc các collection này
    const unsubSubjects = fetchCollection('subjects', (e) => errors.push(e));
    const unsubCourses = fetchCollection('courses', (e) => errors.push(e));
    const unsubQuizzes = fetchCollection('quizzes', (e) => errors.push(e));

    setData(prev => ({
      ...prev,
      loading: false,
      error: errors.length > 0 ? errors.join(', ') : null,
    }));

    return () => {
      unsubSubjects();
      unsubCourses();
      unsubQuizzes();
    };
  }, [isAuthReady, authUser]);

  return data;
};

export { usePublicData, DataContext };