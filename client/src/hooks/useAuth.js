import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext.jsx';

/**
 * useAuth — Custom hook để truy cập AuthContext.
 *
 * Tại sao cần hook riêng thay vì dùng useContext trực tiếp?
 *  1. Enforce rằng hook chỉ được gọi bên trong AuthProvider.
 *  2. Component chỉ import một hook thay vì import cả Context lẫn useContext.
 *  3. Dễ thêm logic trung gian sau này mà không sửa từng component.
 *
 * @returns {{ user, token, isAuthenticated, isLoading, login, register, logout }}
 *
 * @example
 *   const { user, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      'useAuth() phải được gọi bên trong <AuthProvider>.\n' +
        'Kiểm tra xem component có nằm trong cây component bọc bởi AuthProvider không.',
    );
  }

  return context;
}
