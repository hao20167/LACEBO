import { useAuth } from '@/hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <span className="gradient-text text-xl font-extrabold tracking-widest">LACEBO</span>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            @{user?.username ?? 'user'}
          </span>
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="rounded border px-4 py-1.5 text-sm transition-colors hover:border-red-400 hover:text-red-400"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-3xl font-bold">
          Chào mừng,{' '}
          <span className="gradient-text">{user?.username ?? 'Roleplayer'}</span>!
        </h2>
        <p className="max-w-md leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Đây là trang chủ của bạn. Các World và tính năng roleplay sẽ xuất hiện tại đây.
        </p>
      </main>
    </div>
  );
}

export default DashboardPage;
