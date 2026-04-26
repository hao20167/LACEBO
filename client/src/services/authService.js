import api from './api.js';

/**
 * authService — Tầng giao tiếp API dành riêng cho Auth.
 *
 * Tất cả call liên quan đến xác thực đi qua đây.
 * AuthContext sẽ gọi các hàm này và xử lý state, không gọi API trực tiếp.
 */
export const authService = {
  /**
   * login — Đăng nhập.
   * @param {{ identifier: string, password: string }} credentials
   * @returns {{ token: string, user: object }}
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    // Backend Spring Boot dự kiến trả về: { token, user: { id, username, email, ... } }
    return response.data;
  },

  /**
   * register — Đăng ký tài khoản mới.
   * @param {{ username: string, email: string, password: string }} userData
   * @returns {{ token: string, user: object }}
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * logout — Thông báo server invalidate token (best-effort).
   * Dù thất bại, AuthContext vẫn xóa local session.
   */
  async logout() {
    await api.post('/auth/logout');
  },

  /**
   * getMe — Lấy thông tin user hiện tại từ server.
   * Dùng để verify token còn hợp lệ hoặc refresh user data.
   * @returns {{ id, username, email, ... }}
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
