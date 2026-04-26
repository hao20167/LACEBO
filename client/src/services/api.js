import axios from 'axios';

/**
 * api — Axios instance dùng chung cho toàn bộ app.
 *
 * Mọi request đều đi qua đây, không import axios trực tiếp ở nơi khác.
 */
const api = axios.create({
  baseURL: '/api', // Vite proxy chuyển tiếp tới http://localhost:8080/api
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000, // 10 giây — tránh request treo vô hạn
});

/* ============================================================
 * REQUEST INTERCEPTOR
 * Chèn JWT vào header Authorization trước khi gửi mọi request.
 * ============================================================ */
api.interceptors.request.use(
  (config) => {
    // Đọc token trực tiếp từ localStorage để luôn lấy giá trị mới nhất,
    // kể cả khi token vừa được refresh mà chưa re-render.
    const token = localStorage.getItem('lacebo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ============================================================
 * RESPONSE INTERCEPTOR
 * Xử lý lỗi tập trung — đặc biệt là lỗi 401 Token hết hạn.
 * ============================================================ */
api.interceptors.response.use(
  // Trường hợp thành công: trả thẳng response, không làm gì thêm
  (response) => response,

  // Trường hợp lỗi:
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token hết hạn hoặc không hợp lệ → xóa session và redirect về /login.
      // Không dùng useNavigate ở đây (không phải React component),
      // dùng window.location để đảm bảo clear toàn bộ React state.
      localStorage.removeItem('lacebo_token');
      localStorage.removeItem('lacebo_user');

      // Chỉ redirect nếu chưa đang ở trang login (tránh redirect loop)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session_expired';
      }
    }

    if (status === 403) {
      // Có token nhưng không có quyền — để từng feature tự xử lý
      console.warn('[api] 403 Forbidden:', error.config?.url);
    }

    if (status >= 500) {
      // Server error — log để debug, throw để component hiển thị
      console.error('[api] Server error:', status, error.config?.url);
    }

    // Re-throw để calling code (service layer) bắt và xử lý tiếp
    return Promise.reject(error);
  },
);

export default api;
