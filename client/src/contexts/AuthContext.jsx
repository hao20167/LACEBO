import { createContext, useState, useCallback, useMemo } from 'react';
import { authService } from '@/services/authService.js';

/**
 * AuthContext — Context quản lý trạng thái xác thực toàn app.
 *
 * Shape của context value:
 *  - user          : object thông tin user hiện tại (hoặc null)
 *  - token         : JWT string (hoặc null)
 *  - isAuthenticated: boolean — true khi có token hợp lệ
 *  - isLoading     : boolean — true trong lúc gọi API login/register
 *  - login()       : async (credentials) → void
 *  - register()    : async (userData) → void
 *  - logout()      : () → void
 */
export const AuthContext = createContext(null);

// Key lưu trong localStorage
const TOKEN_KEY = 'lacebo_token';
const USER_KEY = 'lacebo_user';

export function AuthProvider({ children }) {
  // Khởi tạo state từ localStorage — persist qua reload trang
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * _saveSession — Helper lưu token + user vào state và localStorage.
   * Tách ra để login và register đều dùng lại.
   */
  const _saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * login — Đăng nhập với email/username + password.
   * @param {{ identifier: string, password: string }} credentials
   * @throws Error nếu API trả về lỗi (để component tự xử lý hiển thị)
   */
  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);
      try {
        const { token: newToken, user: newUser } = await authService.login(credentials);
        _saveSession(newToken, newUser);
      } finally {
        // finally đảm bảo isLoading luôn reset dù thành công hay thất bại
        setIsLoading(false);
      }
    },
    [_saveSession],
  );

  /**
   * register — Đăng ký tài khoản mới.
   * Sau khi đăng ký thành công → tự động login (không cần navigate tay).
   * @param {{ username: string, email: string, password: string }} userData
   * @throws Error nếu API trả về lỗi hoặc response không hợp lệ
   */
  const register = useCallback(
    async (userData) => {
      setIsLoading(true);
      try {
        const result = await authService.register(userData);
        const { token: newToken, user: newUser } = result ?? {};
        if (!newToken || !newUser) {
          throw new Error('Phản hồi từ server không hợp lệ. Vui lòng thử lại.');
        }
        _saveSession(newToken, newUser);
      } finally {
        setIsLoading(false);
      }
    },
    [_saveSession],
  );

  /**
   * logout — Xóa session khỏi state và localStorage.
   * Gọi thêm authService.logout() để invalidate token phía server nếu có.
   */
  const logout = useCallback(() => {
    authService.logout().catch(() => {
      // Ignore server error khi logout — vẫn xóa local session
    });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * useMemo để tránh re-render toàn bộ cây component mỗi khi
   * AuthProvider render lại vì lý do không liên quan.
   */
  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}