import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const e = {};
    if (!formData.username.trim()) e.username = 'Tên người dùng không được để trống.';
    else if (formData.username.length < 3) e.username = 'Tối thiểu 3 ký tự.';
    if (!formData.email.trim()) e.email = 'Email không được để trống.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email không hợp lệ.';
    if (!formData.password) e.password = 'Mật khẩu không được để trống.';
    else if (formData.password.length < 8) e.password = 'Tối thiểu 8 ký tự.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.';
      setErrors({ form: message });
    }
  }

  const fieldError = (key) =>
    errors[key] ? (
      <span className="text-xs" style={{ color: 'var(--color-error)' }}>
        {errors[key]}
      </span>
    ) : null;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at 60% 20%, #1e0a3c 0%, #0f0f13 60%)' }}
    >
      <div className="auth-card">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-extrabold tracking-widest">LACEBO</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Tạo tài khoản mới
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Tên người dùng
            </label>
            <input
              id="username" name="username" type="text" autoComplete="username"
              placeholder="lacebo_user"
              className={`form-input ${errors.username ? 'form-input--error' : ''}`}
              value={formData.username} onChange={handleChange} disabled={isLoading}
            />
            {fieldError('username')}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Email
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              placeholder="name@example.com"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              value={formData.email} onChange={handleChange} disabled={isLoading}
            />
            {fieldError('email')}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-password" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Mật khẩu
            </label>
            <input
              id="reg-password" name="password" type="password" autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              className={`form-input ${errors.password ? 'form-input--error' : ''}`}
              value={formData.password} onChange={handleChange} disabled={isLoading}
            />
            {fieldError('password')}
          </div>

          {errors.form && <p role="alert" className="alert-error">{errors.form}</p>}

          <button id="btn-register-submit" type="submit" className="btn-primary mt-2" disabled={isLoading}>
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-violet-400 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
