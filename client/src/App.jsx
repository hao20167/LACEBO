import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import ProtectedRoute from '@/components/layout/ProtectedRoute.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';

/**
 * App — Root component chứa khai báo toàn bộ routing.
 *
 * Luồng điều hướng:
 *  /              → Redirect tự động: đã login → /dashboard, chưa → /login
 *  /login         → Trang đăng nhập (public)
 *  /register      → Trang đăng ký (public)
 *  /dashboard     → Trang chính (protected — phải đăng nhập)
 */
function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — ProtectedRoute guard redirect về /login nếu chưa auth */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Fallback: mọi route không tồn tại về root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
