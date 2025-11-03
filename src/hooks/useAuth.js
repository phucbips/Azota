import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { 
  auth, 
  db,
  signOut, 
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  getIdTokenResult,
  onAuthStateChanged
} from '../utils/firebase';
import { generateSessionToken } from '../utils/helpers';

// Context
const AppContext = createContext(null);

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

    return () => unsubscribe();
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

export { useAuth, AppContext };