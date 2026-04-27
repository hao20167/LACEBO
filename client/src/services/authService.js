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
   *
   * Backend trả về { id, username, email } (không có token).
   * Hàm này chuẩn hóa thành shape { token, user } mà AuthContext mong đợi,
   * dùng một dummy token tạm thời cho đến khi backend bổ sung JWT vào response.
   */
  async register(userData) {
    const response = await api.post('/users/register', userData);
    const data = response.data;

    // Nếu backend đã trả về shape { token, user } → dùng trực tiếp
    if (data.token && data.user) {
      return data;
    }

    // Backend hiện tại trả về { id, username, email } — chuẩn hóa về shape chuẩn
    const user = {
      id: data.id,
      username: data.username,
      email: data.email,
    };
    // Tạo session token tạm (sẽ được thay bằng JWT thật khi backend hỗ trợ)
    const token = `session_${data.id}_${Date.now()}`;
    return { token, user };
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