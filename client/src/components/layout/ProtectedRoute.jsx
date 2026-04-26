import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';

/**
 * ProtectedRoute — Layout route dùng làm guard cho các route cần xác thực.
 *
 * Cách dùng trong App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *     <Route path="/world/:id" element={<WorldPage />} />
 *   </Route>
 *
 * Luồng:
 *  - Đã auth  → render <Outlet /> (các route con bên trong)
 *  - Chưa auth → redirect về /login, kèm state.from để sau login quay lại đúng trang
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        // Lưu trang hiện tại vào state để LoginPage có thể redirect về sau khi login
        state={{ from: location }}
        replace
      />
    );
  }

  // Render route con được khai báo bên trong <Route element={<ProtectedRoute />}>
  return <Outlet />;
}

export default ProtectedRoute;
