import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-extrabold tracking-wider text-primary-400 hover:text-primary-300 transition">
            LACEBO
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/worlds" className="text-dark-300 hover:text-dark-100 transition text-sm font-medium">
              Explore Worlds
            </Link>
            {user && (
              <>
                <Link to="/worlds/mine" className="text-dark-300 hover:text-dark-100 transition text-sm font-medium">
                  My Worlds
                </Link>
                <Link to="/worlds/create" className="text-dark-300 hover:text-dark-100 transition text-sm font-medium">
                  Create World
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-dark-300">
                <span className="text-primary-400 font-medium">{user.display_name}</span>
              </span>
              <button onClick={logout} className="text-sm text-dark-400 hover:text-red-400 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-dark-300 hover:text-dark-100 transition">Login</Link>
              <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
