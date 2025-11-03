import React from 'react';
// Import from our refactored modules
import { 
  useAuth, 
  usePublicData, 
  useAdminData, 
  AppContext, 
  DataContext 
} from './hooks';
import {
  ConfirmLoginModal,
  KickedModal,
  GlobalLoader,
  OnboardingForm,
  LoginPage
} from './components';
import StudentDashboard from './components/StudentDashboard';

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
  } = React.useContext(AppContext);
  
  // Tải data ở đây, SAU KHI AppContext đã sẵn sàng
  const dataState = usePublicData(); 

  if (isLoading || dataState.loading) {
    return <GlobalLoader message="Đang tải dữ liệu..." />;
  }

  // Cung cấp DataContext cho các component con (Dashboards, v.v.)
  return (
    <DataContext.Provider value={dataState}>
      {!authUser ? (
        <LoginPage />
      ) : needsOnboarding ? (
        <OnboardingForm user={authUser} onComplete={setOnboardingCompleted} />
      ) : !currentUser ? (
        <GlobalLoader message="Lỗi khi tải dữ liệu người dùng..." />
      ) : (
        // Render appropriate dashboard based on role
        role === 'student' ? (
          <StudentDashboard user={currentUser} onLogout={handleSignOut} />
        ) : (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Dashboard for {role}</h1>
            <p className="text-gray-600">Dashboard components will be added in next iteration</p>
            <button
              onClick={handleSignOut}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        )
      )}
    </DataContext.Provider>
  );
};

// =====================================================
// MAIN APP
// =====================================================
export default function ELearningSystem() {
  const authState = useAuth();
  
  // Xử lý logic xác nhận đăng nhập (session conflict)
  const { sessionConflict, proceedToLogin, handleSignOut, kicked } = authState;

  const onConfirmLogin = () => {
    if (sessionConflict) {
      proceedToLogin(sessionConflict.authUser, sessionConflict.role);
    }
  };

  const onCancelLogin = () => {
    handleSignOut(); // Đăng xuất người dùng khỏi thiết bị này
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