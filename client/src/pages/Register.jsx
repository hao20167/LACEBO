import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/worlds');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="flex min-h-[82vh] rounded-2xl overflow-hidden shadow-sm border border-slate-200 my-4">
      {/* ── Left branding panel ──────────────────────── */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-600 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative text-center">
          <div className="text-5xl font-extrabold tracking-wider mb-4">
            LACEBO
          </div>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            Your story begins here. Join our community of world-builders.
          </p>
          <div className="space-y-4 text-left">
            {[
              'Free to join forever',
              'Create unlimited worlds',
              'Collaborate with others',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ✓
                </span>
                <span className="text-sm text-indigo-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-extrabold text-indigo-600">
              LACEBO
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Create your account
          </h2>
          <p className="text-slate-500 text-sm mb-7">
            Join the community and start building worlds
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="display_name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Display Name
              </label>
              <input
                id="display_name"
                type="text"
                value={form.display_name}
                onChange={update('display_name')}
                required
                placeholder="How others will see you"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={update('username')}
                required
                placeholder="unique_identifier"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
