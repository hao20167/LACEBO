import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname ?? '/dashboard';

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.identifier.trim() || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ?? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(message);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        background: 'radial-gradient(ellipse at 60% 20%, #1e0a3c 0%, #0f0f13 60%)',
      }}
    >
      <div className="auth-card">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-extrabold tracking-widest">LACEBO</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Chào mừng trở lại
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Identifier */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="identifier"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Email hoặc tên người dùng
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="name@example.com"
              className="form-input"
              value={formData.identifier}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            id="btn-login-submit"
            type="submit"
            className="btn-primary mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-violet-400 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
