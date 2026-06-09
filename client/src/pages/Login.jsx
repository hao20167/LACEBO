import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/worlds');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header strip */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-black text-sm">LC</span>
                </div>
                <span className="text-2xl font-extrabold tracking-wider text-slate-900">LACEBO</span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 text-center mb-1">
              Log in to LACEBO
            </h2>
            <p className="text-slate-500 text-sm text-center mb-6">
              Continue your story
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="your_username"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-full font-bold transition-colors disabled:opacity-50 shadow-sm text-sm"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                New to LACEBO?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
