import React, { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { Sparkles, BookOpen, Users, BarChart3, LogOut, ShoppingCart, Plus, Trash2, AlertCircle, CheckCircle2, XCircle, Trophy, Clock, Eye, Play, Home, Key, CreditCard, Package, GraduationCap, Settings, Shield, Edit, Save, X, MoreVertical, ChevronDown, UserPlus, Lock, Mail, Server, Loader2, BrainCircuit, Send, Ticket } from 'lucide-react';

// =====================================================
// Firebase SDK Imports
// =====================================================
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  getIdTokenResult
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
// ⚡️ ĐÃ XÓA: import { getFunctions, httpsCallable } from 'firebase/functions';

// =====================================================
// Firebase Configuration
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyBLeBmdJ85IhfeJ7sGBHOlSjUmYJ6V_YIY",
  authDomain: "thpt-chi-linh.firebaseapp.com",
  projectId: "thpt-chi-linh",
  storageBucket: "thpt-chi-linh.firebasestorage.app",
  messagingSenderId: "59436766218",
  appId: "1:59436766218:web:8621e33cc12f6129e6fbf3",
  measurementId: "G-442TZLSK9J"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// ⚡️ ĐÃ XÓA: const functions = getFunctions(app);

// ⚡️ MỚI: Thêm URL API Vercel của bạn
const VERCEL_API_URL = "https://payos-proxy.vercel.app"; 

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

const generateAccessKey = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i + 1 < length) {
      result += '-'; // Thêm dấu gạch ngang cho dễ đọc
    }
  }
  return result;
};

// ⚡️ MỚI: Tách hàm tính tổng ra ngoài để dùng chung
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
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY || ""; // API key sẽ được cung cấp bởi môi trường
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


// =====================================================
// React Context
// =====================================================
const AppContext = createContext(null);
const DataContext = createContext(null);

// =====================================================
// HOOK: useAuth (Quản lý Xác thực & Trạng thái)
// =====================================================
const useAuth = () => {
  const [authState, setAuthState] = useState({
    authUser: null, // User object từ Firebase Auth
    currentUser: null, // User data từ Firestore
    role: 'student', // Vai trò (student, teacher, admin)
    isAuthReady: false, // Auth đã sẵn sàng (đã check xong)
    isLoading: true, // Đang tải data người dùng từ Firestore
    needsOnboarding: false, // Cần điền thông tin
    kicked: false, // Bị đá do đăng nhập nơi khác
    sessionConflict: null, // Phát hiện xung đột phiên
  });

  const [localToken, setLocalToken] = useState(() => localStorage.getItem('sessionToken'));

  const handleSignOut = async () => {
    localStorage.removeItem('sessionToken');
    setLocalToken(null);
    await signOut(auth);
  };

  // 1. Lắng nghe thay đổi trạng thái Auth (Đăng nhập/Đăng xuất)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Người dùng đã đăng nhập
        const tokenResult = await user.getIdTokenResult(true); // Force refresh
        const role = tokenResult.claims.role || 'student';
        
        // Kiểm tra session conflict
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const dbToken = userDoc.data().activeLoginToken;
          const currentLocalToken = localStorage.getItem('sessionToken');

          if (dbToken && dbToken !== currentLocalToken) {
            // Phát hiện xung đột!
            setAuthState(prev => ({
              ...prev,
              isAuthReady: true,
              isLoading: false,
              sessionConflict: { authUser: user, role: role }
            }));
            return; // Dừng lại, chờ người dùng xác nhận
          }
        }
        
        // Không có xung đột, tiếp tục đăng nhập
        proceedToLogin(user, role);

      } else {
        // Người dùng đã đăng xuất
        setAuthState({
          authUser: null,
          currentUser: null,
          role: 'student',
          isAuthReady: true,
          isLoading: false,
          needsOnboarding: false,
          kicked: false,
          sessionConflict: null,
        });
        localStorage.removeItem('sessionToken');
        setLocalToken(null);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // 2. Hàm tiếp tục đăng nhập (sau khi check conflict)
  const proceedToLogin = async (user, role) => {
    const newSessionToken = generateSessionToken();
    localStorage.setItem('sessionToken', newSessionToken);
    setLocalToken(newSessionToken);

    setAuthState(prev => ({
      ...prev,
      authUser: user,
      role: role,
      isAuthReady: true,
      isLoading: true, // Bắt đầu tải data Firestore
      sessionConflict: null,
    }));

    // Cập nhật token mới lên DB
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { activeLoginToken: newSessionToken }); // Dòng mới
    } catch (error) {
      if (error.code !== 'not-found') {
        console.error("Lỗi cập nhật session token (cho user cũ):", error);
      }
    }
  };

  // 3. Lắng nghe thay đổi tài liệu người dùng (Firestore)
  useEffect(() => {
    let unsubscribeUserDoc;

    if (authState.isAuthReady && authState.authUser) {
      const userDocRef = doc(db, 'users', authState.authUser.uid);
      
      unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          // Kiểm tra bị đá (session management)
          const dbToken = userData.activeLoginToken;
          if (localToken && dbToken && dbToken !== localToken) {
            handleSignOut(); // Đăng xuất thiết bị này
            setAuthState(prev => ({ ...prev, kicked: true }));
            return;
          }

          setAuthState(prev => ({
            ...prev,
            currentUser: userData,
            isLoading: false,
            needsOnboarding: false, // User đã tồn tại, không cần onboarding
          }));
        } else {
          // Người dùng mới, cần onboarding
          setAuthState(prev => ({
            ...prev,
            currentUser: null,
            isLoading: false,
            needsOnboarding: true,
          }));
        }
      }, (error) => {
        console.error("Lỗi lắng nghe user document:", error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      });
    } else if (authState.isAuthReady && !authState.authUser) {
      // Đã sẵn sàng nhưng chưa đăng nhập
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }

    return () => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, [authState.isAuthReady, authState.authUser, localToken]);
  
  // Hàm cập nhật needsOnboarding (cho OnboardingForm)
  const setOnboardingCompleted = () => {
    setAuthState(prev => ({ ...prev, needsOnboarding: false }));
  };

  return { 
    ...authState, 
    handleSignOut, 
    proceedToLogin,
    setOnboardingCompleted 
  };
};

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
      if (typeof unsubSubjects === 'function') unsubSubjects();
      if (typeof unsubCourses === 'function') unsubCourses();
      if (typeof unsubQuizzes === 'function') unsubQuizzes();
    };
  }, [isAuthReady, authUser]);

  return data;
};

// =====================================================
// HOOK: useAdminData (Tải dữ liệu cho Admin)
// =====================================================
const useAdminData = (role) => {
  const [adminData, setAdminData] = useState({
    users: [],
    transactions: [],
    orders: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (role !== 'admin') {
      setAdminData(prev => ({ ...prev, loading: false }));
      return; // Không phải admin, không tải
    }

    let usersLoaded = false;
    let transactionsLoaded = false;
    let ordersLoaded = false;
    const errors = [];

    const checkLoadingDone = () => {
      if (usersLoaded && transactionsLoaded && ordersLoaded) {
        setAdminData(prev => ({
          ...prev,
          loading: false,
          error: errors.length > 0 ? errors.join(', ') : null,
        }));
      }
    };

    // Tải Users
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAdminData(prev => ({ ...prev, users: userList }));
      usersLoaded = true;
      checkLoadingDone();
    }, (err) => {
      console.error("Lỗi tải danh sách người dùng:", err);
      errors.push("Lỗi tải người dùng");
      usersLoaded = true;
      checkLoadingDone();
    });

    // Tải Transactions
    const qTrans = query(collection(db, 'transactions'));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminData(prev => ({ ...prev, transactions: transList }));
      transactionsLoaded = true;
      checkLoadingDone();
    }, (err) => {
      console.error("Lỗi tải giao dịch:", err);
      errors.push("Lỗi tải giao dịch");
      transactionsLoaded = true;
      checkLoadingDone();
    });

    // Tải Orders
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminData(prev => ({ ...prev, orders: orderList }));
      ordersLoaded = true;
      checkLoadingDone();
    }, (err) => {
      console.error("Lỗi tải đơn hàng:", err);
      errors.push("Lỗi tải đơn hàng");
      ordersLoaded = true;
      checkLoadingDone();
    });

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers();
      if (typeof unsubTrans === 'function') unsubTrans();
      if (typeof unsubOrders === 'function') unsubOrders();
    };
  }, [role]);

  return adminData;
};

// =====================================================
// MODAL: ConfirmLoginModal (Xác nhận Đăng nhập)
// =====================================================
const ConfirmLoginModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-500" size={64} />
          <h2 className="text-2xl font-bold mt-6 mb-4">Phát hiện phiên đăng nhập</h2>
          <p className="text-gray-600 mb-8">
            Tài khoản này đã được đăng nhập trên một thiết bị khác. Bạn có muốn tiếp tục và đăng xuất thiết bị kia không?
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};


// =====================================================
// PAGE: LoginPage (Đăng nhập / Đăng ký)
// =====================================================
const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = async (action) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged sẽ tự động xử lý
      } 
      else if (action === 'register') {
        if (password.length < 6) {
          throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } 
      else if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      }
      else if (action === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Đã gửi email reset mật khẩu! Vui lòng kiểm tra hòm thư.');
      }
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản với email này.');
          break;
        case 'auth/wrong-password':
          setError('Sai mật khẩu. Vui lòng thử lại.');
          break;
        case 'auth/email-already-in-use':
          setError('Email này đã được sử dụng.');
          break;
        case 'auth/weak-password':
          setError('Mật khẩu quá yếu.');
          break;
        case 'auth/invalid-email':
          setError('Email không hợp lệ.');
          break;
        case 'auth/popup-closed-by-user':
          setError('Bạn đã đóng cửa sổ đăng nhập Google.');
          break;
        default:
          setError('Đã xảy ra lỗi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const AuthButton = ({ action, children, className }) => (
    <button
      onClick={() => handleAuthAction(action)}
      disabled={loading}
      className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 disabled:opacity-50 ${className}`}
    >
      {loading && <Loader2 className="animate-spin" size={20} />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            E-Learning System
          </h1>
          <p className="text-gray-600">Nền tảng học tập trực tuyến</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Lỗi</p>
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Thành công</p>
            <p>{message}</p>
          </div>
        )}

        <div className="mb-6 flex border-b">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 font-semibold ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Đăng nhập</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 font-semibold ${mode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Đăng ký</button>
        </div>

        {mode === 'reset' ? (
          <div className="space-y-6">
            <p className="text-gray-600 text-center">Nhập email để nhận link reset mật khẩu.</p>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <AuthButton action="reset" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg">
              Gửi link Reset
            </AuthButton>
            <button onClick={() => setMode('login')} className="w-full text-blue-600 font-semibold">
              Quay lại Đăng nhập
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            {mode === 'login' && (
              <>
                <AuthButton action="login" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg">
                  Đăng nhập
                </AuthButton>
                <button onClick={() => setMode('reset')} className="w-full text-sm text-blue-600 text-right">
                  Quên mật khẩu?
                </button>
              </>
            )}
            
            {mode === 'register' && (
              <AuthButton action="register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg">
                Đăng ký
              </AuthButton>
            )}

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">hoặc</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <AuthButton action="google" className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </AuthButton>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// PAGE: OnboardingForm (Hoàn tất thông tin)
// =====================================================
const OnboardingForm = ({ user, onComplete }) => {
  const [hoTen, setHoTen] = useState('');
  const [lop, setLop] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hoTen.trim()) {
      setError('⚠️ Vui lòng nhập họ và tên!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Lấy session token hiện tại từ localStorage
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) {
        throw new Error("Không tìm thấy session token, vui lòng đăng nhập lại.");
      }

      const userData = {
        hoTen: hoTen.trim(),
        lop,
        email: user.email,
        unlockedQuizzes: [],
        activeLoginToken: sessionToken, // Dùng token đã được tạo khi đăng nhập
        createdAt: serverTimestamp() // Dùng timestamp của server
      };

      // Tạo document mới (sẽ khớp với 'allow create' rule)
      await setDoc(doc(db, 'users', user.uid), userData);
      
      onComplete(); // Báo cho AppRouter biết là đã xong

    } catch (err) {
      console.error(err);
      setError('Lỗi khi lưu thông tin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Users size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng bạn!</h2>
          <p className="text-gray-600">Vui lòng hoàn tất thông tin cá nhân</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              👤 Họ và tên
            </label>
            <input
              type="text"
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🎓 Lớp
            </label>
            <select
              value={lop}
              onChange={(e) => setLop(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </form>
      </div>
    </div>
  );
};


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

  // ⚡️ ĐÃ DI CHUYỂN HÀM calculateTotal ra ngoài

  const isEmpty = cart.subjects.length === 0 && cart.courses.length === 0;
  const total = calculateCartTotal(cart, subjects, courses); // ⚡️ Dùng hàm mới

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
              {/* ⚡️ THAY ĐỔI: Icon và Text */}
              {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
              {loading ? 'Đang gửi...' : (conflicts.length > 0 ? 'Vui lòng xóa môn trùng lặp' : 'Gửi yêu cầu duyệt')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

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


// =====================================================
// PAGE: StudentDashboard (Trang của Học sinh)
// =====================================================
const StudentDashboard = ({ user, onLogout }) => {
  const { authUser } = useContext(AppContext); // ⚡️ MỚI: Lấy authUser để có uid
  const [view, setView] = useState('my-quizzes'); // 'shop', 'my-quizzes', 'redeem-key'
  const [shopTab, setShopTab] = useState('subjects'); // 'subjects', 'courses'
  const [cart, setCart] = useState({ subjects: [], courses: [] });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null); // {id, title, embedCode}
  
  const { subjects, courses, quizzes } = useContext(DataContext);
  
  const unlockedQuizzes = useMemo(() => {
    return (user.unlockedQuizzes || [])
      .map(quizId => quizzes.find(q => q.id === quizId))
      .filter(Boolean); // Lọc bỏ các quiz không tìm thấy
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

  // ⚡️ ĐÃ CẬP NHẬT: handleRequestOrder (dùng fetch)
  const handleRequestOrder = async () => {
    setPaymentLoading(true);
    try {
      // 1. Lấy token xác thực của người dùng
      if (!authUser) throw new Error("Người dùng chưa đăng nhập");
      const token = await authUser.getIdToken();
      
      // Lấy tổng số tiền
      const totalAmount = calculateCartTotal(cart, subjects, courses);

      // 2. Gọi API Vercel bằng fetch
      const response = await fetch(`${VERCEL_API_URL}/api/requestOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart: cart,
          userName: user.hoTen,
          amount: totalAmount, // Gửi thêm tổng tiền
          paymentMethod: 'Chờ duyệt' // Gửi thêm phương thức
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }

      // 3. Xử lý kết quả
      alert(result.message); // Hiển thị thông báo từ API
      setCart({ subjects: [], courses: [] }); // Xóa giỏ hàng

    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu:", err);
      alert("Lỗi khi gửi yêu cầu: " + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };
  
  // Xử lý mã nhúng (vô hiệu hóa chuột phải)
  const safeEmbedCode = useMemo(() => {
    if (!selectedQuiz?.embedCode) return '';
    
    let code = selectedQuiz.embedCode;
    // Thêm oncontextmenu="return false;"
    if (code.includes('<iframe')) {
      if (!code.includes('oncontextmenu')) {
        code = code.replace('<iframe', '<iframe oncontextmenu="return false;"');
      }
    }
    return code;
  }, [selectedQuiz]);
  
  // === Views ===
  
  const renderQuizViewer = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button 
        onClick={() => setSelectedQuiz(null)}
        className="flex items-center gap-2 text-blue-600 font-semibold mb-6"
      >
        <ChevronDown size={20} className="-rotate-90" />
        Quay lại
      </button>
      
      <h2 className="text-3xl font-bold mb-6">{selectedQuiz.title}</h2>
      
      <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden shadow-lg border">
        <div 
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: safeEmbedCode }} 
        />
      </div>
      
      <GeminiStudyHelper quizTitle={selectedQuiz.title} />
    </div>
  );

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
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map(subject => (
                  <div key={subject.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
                        <p className="text-gray-600 text-sm">{subject.quizIds?.length || 0} bài tập</p>
                      </div>
                      <BookOpen className="text-blue-600" size={32} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(subject.price)}</span>
                      <button
                        onClick={() => addToCart('subject', subject.id)}
                        disabled={cart.subjects.includes(subject.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cart.subjects.includes(subject.id) ? '✓ Đã thêm' : '+ Thêm'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shopTab === 'courses' && (
            <div>
              <div className="space-y-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="text-purple-600" size={28} />
                          <h3 className="text-xl font-bold">{course.name}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">
                          📚 {course.subjectIds?.length || 0} môn học
                          {course.subjectIds && course.subjectIds.length > 0 && (
                            <span className="ml-2">
                              ({course.subjectIds.map(id => {
                                const subject = subjects.find(s => s.id === id);
                                return subject ? subject.name : 'Unknown';
                              }).join(', ')})
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600 text-sm">🎯 {course.quizIds?.length || 0} bài tập</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">{formatCurrency(course.price)}</span>
                      <button
                        onClick={() => addToCart('course', course.id)}
                        disabled={cart.courses.includes(course.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cart.courses.includes(course.id) ? '✓ Đã thêm' : '+ Thêm'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">📚 Bài tập của tôi</h2>
        <p className="text-gray-600">Danh sách các bài tập bạn có thể truy cập</p>
      </div>
      
      {unlockedQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <BookOpen size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">Chưa có bài tập nào</h3>
          <p className="text-gray-400">Hãy mua môn học hoặc khóa học để mở khóa bài tập!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unlockedQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" onClick={() => setSelectedQuiz(quiz)}>
              <div className="flex items-center justify-between mb-4">
                <Trophy className="text-yellow-500" size={32} />
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Đã mở</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nhấn để làm bài</span>
                <Play className="text-blue-600" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRedeemKey = () => (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Key className="mx-auto text-blue-600 mb-4" size={64} />
          <h2 className="text-3xl font-bold mb-2">Nhập Key truy cập</h2>
          <p className="text-gray-600">Nhập mã key để mở khóa nội dung học tập</p>
        </div>
        
        <KeyRedeemForm />
      </div>
    </div>
  );

  // Key Redeem Component
  const KeyRedeemForm = () => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRedeem = async () => {
      if (!key.trim()) {
        setError('Vui lòng nhập mã key!');
        return;
      }

      setLoading(true);
      setError('');
      setSuccess('');

      try {
        if (!authUser) throw new Error("Người dùng chưa đăng nhập");
        const token = await authUser.getIdToken();

        const response = await fetch(`${VERCEL_API_URL}/api/redeemAccessKey`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ key: key.trim() })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Lỗi không xác định");
        }

        setSuccess(result.message);
        setKey('');
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Mã Key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-center font-mono text-lg tracking-widest"
            maxLength={15}
          />
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Lỗi</p>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded">
            <p className="font-bold">Thành công</p>
            <p>{success}</p>
          </div>
        )}
        
        <button
          onClick={handleRedeem}
          disabled={loading || !key.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Kích hoạt Key'}
        </button>
      </div>
    );
  };

  // Main render
  if (selectedQuiz) {
    return renderQuizViewer();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🎓 {user.hoTen}</h1>
              <p className="text-emerald-100 mt-1">Học sinh - Lớp {user.lop}</p>
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-4 overflow-x-auto">
            <button
              onClick={() => setView('my-quizzes')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                view === 'my-quizzes'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen size={20} /> Bài tập của tôi
            </button>
            <button
              onClick={() => setView('shop')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                view === 'shop'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart size={20} /> Cửa hàng
            </button>
            <button
              onClick={() => setView('redeem-key')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                view === 'redeem-key'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Key size={20} /> Nhập Key
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {view === 'shop' && renderShop()}
        {view === 'my-quizzes' && renderMyQuizzes()}
        {view === 'redeem-key' && renderRedeemKey()}
      </div>
    </div>
  );
};


// =====================================================
// PAGE: TeacherDashboard (Trang của Giáo viên)
// =====================================================
const TeacherDashboard = ({ user, onLogout }) => {
  const { authUser } = useContext(AppContext);
  const { subjects, courses, quizzes } = useContext(DataContext);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({ title: '', embedCode: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Lọc bài tập do giáo viên này tạo
  useEffect(() => {
    if (authUser && quizzes.length > 0) {
      const teacherQuizzes = quizzes.filter(quiz => quiz.createdBy === authUser.uid);
      setMyQuizzes(teacherQuizzes);
      setLoadingQuizzes(false);
    }
  }, [authUser, quizzes]);

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData(quiz);
    setFormError('');
  };

  const handleNew = () => {
    setEditingQuiz('new');
    setFormData({ title: '', embedCode: '' });
    setFormError('');
  };

  const handleCancel = () => {
    setEditingQuiz(null);
    setFormError('');
  };
  
  const handleDelete = async (quizId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác.")) {
      return;
    }
    
    setFormLoading(true);
    try {
      // 1. Xóa khỏi collection 'quizzes'
      const quizRef = doc(db, 'quizzes', quizId);
      await deleteDoc(quizRef);
      
      // 2. Xóa quizId khỏi tất cả 'subjects' và 'courses'
      const batch = writeBatch(db);

      // ⚡️ FIX 3: Dùng subjects và courses đã lấy từ context ở top-level
      subjects.forEach(subject => {
        if (subject.quizIds?.includes(quizId)) {
          const subjectRef = doc(db, 'subjects', subject.id);
          batch.update(subjectRef, {
            quizIds: arrayRemove(quizId)
          });
        }
      });
      
      courses.forEach(course => {
        if (course.quizIds?.includes(quizId)) {
          const courseRef = doc(db, 'courses', course.id);
          batch.update(courseRef, {
            quizIds: arrayRemove(quizId)
          });
        }
      });
      
      // 3. (Tùy chọn) Xóa quizId khỏi 'unlockedQuizzes' của users
      // Bỏ qua bước này để đơn giản, vì quizId không còn tồn tại sẽ tự động bị lọc
      
      await batch.commit();
      handleCancel();
      
    } catch (err) {
      console.error("Lỗi khi xóa bài tập:", err);
      setFormError("Lỗi khi xóa bài tập: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.embedCode) {
      setFormError("Vui lòng điền đầy đủ Tiêu đề và Mã nhúng.");
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      if (editingQuiz === 'new') {
        // Tạo mới
        await addDoc(collection(db, 'quizzes'), {
          ...formData,
          createdBy: authUser.uid,
          createdAt: serverTimestamp()
        });
      } else {
        // Cập nhật
        const quizRef = doc(db, 'quizzes', editingQuiz.id);
        await updateDoc(quizRef, {
          ...formData
        });
      }
      handleCancel();
      
    } catch (err) {
      console.error("Lỗi khi lưu bài tập:", err);
      setFormError("Lỗi khi lưu bài tập: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const renderQuizEditor = () => (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">
        {editingQuiz === 'new' ? 'Tạo bài tập mới' : 'Chỉnh sửa bài tập'}
      </h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề bài tập</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ví dụ: Bài tập Hàm số bậc nhất"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Mã nhúng (Quizizz, Azota...)</label>
          <textarea
            value={formData.embedCode || ''}
            onChange={(e) => setFormData({...formData, embedCode: e.target.value})}
            placeholder='<iframe src="..."></iframe>'
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-sm"
          />
        </div>
        
        {formError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
            {formError}
          </div>
        )}
        
        <div className="flex justify-between items-center gap-4">
          <div>
            {editingQuiz !== 'new' && (
              <button
                type="button"
                onClick={() => handleDelete(editingQuiz?.id)}
                disabled={formLoading || !editingQuiz?.id}
                className="text-red-600 font-semibold px-6 py-3 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
              >
                <Trash2 size={16} className="inline mr-2" /> Xóa
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={formLoading}
              className="bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formLoading ? <Loader2 className="animate-spin" /> : <Save size={16} className="inline mr-2" />}
              {editingQuiz === 'new' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>

      <GeminiQuestionSuggester quizTitle={formData.title} />
    </div>
  );
  
  const renderQuizList = () => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Bài tập của tôi</h2>
        <button
          onClick={handleNew}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} /> Tạo bài tập mới
        </button>
      </div>
      
      {loadingQuizzes ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin mx-auto text-gray-400" size={48} />
        </div>
      ) : myQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <p className="text-gray-500">Bạn chưa tạo bài tập nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <table className="w-full min-w-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Mã nhúng</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myQuizzes.map(quiz => (
                <tr key={quiz.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-gray-800">{quiz.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {(quiz.embedCode || '').substring(0, 50)}...
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(quiz)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">👩‍🏫 {user.hoTen}</h1>
              <p className="text-teal-100 mt-1">Giáo viên - Lớp {user.lop}</p>
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
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {editingQuiz ? renderQuizEditor() : renderQuizList()}
      </div>
    </div>
  );
};


// =====================================================
// COMPONENT: GeminiQuestionSuggester (Gợi ý câu hỏi)
// =====================================================
const GeminiQuestionSuggester = ({ quizTitle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState('');

  const getSuggestions = async () => {
    setLoading(true);
    setError('');
    setSuggestions('');

    const prompt = `Bạn là một chuyên gia tạo câu hỏi giáo dục. Hãy tạo 5 câu hỏi trắc nghiệm cho chủ đề "${quizTitle}" 
    với mức độ từ dễ đến khó. Mỗi câu hỏi bao gồm:
    1. Câu hỏi rõ ràng
    2. 4 lựa chọn A, B, C, D
    3. Đáp án đúng
    4. Giải thích ngắn gọn
    Trình bày dưới dạng JSON hoặc danh sách có cấu trúc.`;

    try {
      const result = await callGeminiAPI(prompt);
      setSuggestions(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!quizTitle) return null;

  return (
    <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200">
      <div className="flex items-center gap-3 mb-4">
        <BrainCircuit className="text-green-600" size={28} />
        <h3 className="text-xl font-bold text-gray-800">AI: Gợi ý câu hỏi</h3>
      </div>
      
      {!suggestions && !loading && (
        <button
          onClick={getSuggestions}
          className="bg-green-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Sparkles size={16} className="inline mr-2" />
          Tạo gợi ý câu hỏi
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" />
          <p>AI đang tạo câu hỏi, vui lòng chờ...</p>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {suggestions && (
        <div className="prose prose-sm max-w-none text-gray-700">
          <p>Gợi ý câu hỏi cho bài tập này:</p>
          <pre className="whitespace-pre-wrap font-sans bg-white/50 p-4 rounded-lg">{suggestions}</pre>
        </div>
      )}
    </div>
  );
};


// =====================================================
// PAGE: AdminDashboard (Trang của Admin)
// =====================================================

// Component Quản lý Người dùng
const UserManager = ({ users }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ⚡️ ĐÃ CẬP NHẬT: grantRole (dùng fetch)
  const grantRole = async (uid, role) => {
    setLoading(true);
    setError('');
    try {
      // 1. Lấy token của Admin
      const user = auth.currentUser;
      if (!user) throw new Error("Admin chưa đăng nhập");
      const token = await user.getIdToken();

      // 2. Gọi API Vercel
      const response = await fetch(`${VERCEL_API_URL}/api/grantRole`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: uid, role: role })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Lỗi không xác định");
      }
      
      alert(`Thành công: ${result.message}`);
      // onSnapshot của useAdminData sẽ tự cập nhật UI

    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(`Thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {error && <div className="p-4 bg-red-100 text-red-700">{error}</div>}
      <table className="w-full min-w-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Họ tên</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vai trò</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.uid}>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="font-semibold text-gray-800">{user.hoTen}</p>
                <p className="text-sm text-gray-500">Lớp {user.lop}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-gray-700">{user.email}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.role ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {user.role}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">student</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <button
                  onClick={() => grantRole(user.uid, 'teacher')}
                  disabled={loading || user.role === 'teacher'}
                  className="bg-teal-100 text-teal-700 px-3 py-2 rounded-lg hover:bg-teal-200 transition text-sm disabled:opacity-50"
                >
                  Cấp quyền Teacher
                </button>
                <button
                  onClick={() => grantRole(user.uid, 'admin')}
                  disabled={loading || user.role === 'admin'}
                  className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm disabled:opacity-50"
                >
                  Cấp quyền Admin
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main Admin Dashboard
const AdminDashboard = ({ user, onLogout }) => {
  const { role } = useContext(AppContext);
  const { subjects, courses, quizzes, loading: loadingData } = useContext(DataContext);
  const { users, transactions, orders, loading: loadingAdmin } = useAdminData(role);
  
  const [view, setView] = useState('users');
  
  const adminTabs = [
    { key: 'users', label: 'Người dùng', icon: Users },
    { key: 'orders', label: 'Đơn hàng', icon: Package },
    { key: 'subjects', label: 'Môn học', icon: BookOpen },
    { key: 'courses', label: 'Khóa học', icon: Package },
    { key: 'quizzes', label: 'Bài tập', icon: CheckCircle2 },
    { key: 'transactions', label: 'Giao dịch (Log)', icon: BarChart3 },
  ];

  const handleSave = async (data, id) => {
    const collectionName = view;
    try {
      if (id) {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data);
      } else {
        const collRef = collection(db, collectionName);
        if (collectionName === 'quizzes') {
          data.createdBy = auth.currentUser.uid;
        }
        await addDoc(collRef, data);
      }
    } catch (err) {
      console.error(`Lỗi khi lưu ${collectionName}:`, err);
      alert(`Lỗi: ${err.message}`);
    }
  };
  
  const handleDelete = async (id) => {
    const collectionName = view;
    if (!window.confirm(`Bạn có chắc muốn xóa ${collectionName} với ID: ${id}?`)) return;
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Lỗi khi xóa ${collectionName}:`, err);
      alert(`Lỗi: ${err.message}`);
    }
  };
  
  const renderView = () => {
    if (loadingData || loadingAdmin) {
      return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" size={48} /></div>;
    }
    
    switch(view) {
      case 'users':
        return <UserManager users={users} />;
      case 'orders':
        return <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Quản lý Đơn hàng</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(orders, null, 2)}
          </pre>
        </div>;
      case 'subjects':
        return <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Quản lý Môn học</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(subjects, null, 2)}
          </pre>
        </div>;
      case 'courses':
        return <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Quản lý Khóa học</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(courses, null, 2)}
          </pre>
        </div>;
      case 'quizzes':
        return <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Quản lý Bài tập</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(quizzes, null, 2)}
          </pre>
        </div>;
      case 'transactions':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6">Lịch sử Giao dịch</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(transactions, null, 2)}
            </pre>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-red-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🛡️ {user.hoTen}</h1>
              <p className="text-red-100 mt-1">Quản trị viên (Admin)</p>
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

      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-4 overflow-x-auto">
            {adminTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`px-5 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                  view === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={20} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {renderView()}
      </div>
    </div>
  );
};


// =====================================================
// COMPONENT: GlobalLoader (Trình tải Toàn cục)
// =====================================================
const GlobalLoader = ({ message = "Đang tải ứng dụng..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4 text-white">
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-6" size={64} />
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  </div>
);

// =====================================================
// COMPONENT: KickedModal (Modal Bị đá)
// =====================================================
const KickedModal = () => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <XCircle className="mx-auto text-red-500" size={64} />
      <h2 className="text-2xl font-bold mt-6 mb-4">Phiên đăng nhập hết hạn</h2>
      <p className="text-gray-600 mb-8">
        Tài khoản của bạn đã được đăng nhập trên một thiết bị khác.
        Vì lý do bảo mật, bạn đã bị đăng xuất khỏi thiết bị này.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        Đăng nhập lại
      </button>
    </div>
  </div>
);


// =====================================================
// COMPONENT: AppRouter (Bộ định tuyến chính)
// =====================================================
const AppRouter = () => {
  const { 
    authUser, 
    currentUser, 
    role, 
    isLoading, 
    needsOnboarding, 
    handleSignOut,
    setOnboardingCompleted
  } = useContext(AppContext);
  
  const dataState = usePublicData(); 

  if (isLoading || dataState.loading) {
    return <GlobalLoader message="Đang tải dữ liệu..." />;
  }

  return (
    <DataContext.Provider value={dataState}>
      {!authUser ? (
        <LoginPage />
      ) : needsOnboarding ? (
        <OnboardingForm user={authUser} onComplete={setOnboardingCompleted} />
      ) : !currentUser ? (
        <GlobalLoader message="Lỗi khi tải dữ liệu người dùng..." />
      ) : role === 'admin' ? (
        <AdminDashboard user={currentUser} onLogout={handleSignOut} />
      ) : role === 'teacher' ? (
        <TeacherDashboard user={currentUser} onLogout={handleSignOut} />
      ) : (
        <StudentDashboard user={currentUser} onLogout={handleSignOut} />
      )}
    </DataContext.Provider>
  );
};


// =====================================================
// MAIN APP
// =====================================================
export default function ELearningSystem() {
  const authState = useAuth();
  
  const { sessionConflict, proceedToLogin, handleSignOut, kicked } = authState;

  const onConfirmLogin = () => {
    if (sessionConflict) {
      proceedToLogin(sessionConflict.authUser, sessionConflict.role);
    }
  };

  const onCancelLogin = () => {
    handleSignOut();
  };
  
  return (
    <AppContext.Provider value={authState}>
        {kicked && <KickedModal />}

        {sessionConflict && (
          <ConfirmLoginModal 
            onConfirm={onConfirmLogin}
            onCancel={onCancelLogin}
          />
        )}
        
        {!authState.isAuthReady ? (
          <GlobalLoader message="Đang kết nối..." />
        ) : (
          <AppRouter />
        )}
    </AppContext.Provider>
  );
}