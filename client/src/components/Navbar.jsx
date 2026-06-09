import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

// ─── Nav Link helper ──────────────────────────────────────────────────────────
function NavLink({ to, children, onClick = undefined }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`text-sm font-medium transition ${
        active ? 'text-primary-400' : 'text-dark-300 hover:text-dark-100'
      }`}
    >
      {children}
    </Link>
  );
}

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

// ─── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = useCallback(() => setMenuOpen(false), []);
  const toggle = useCallback(() => setMenuOpen((o) => !o), []);

  return (
    <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={close}
            className="text-2xl font-extrabold tracking-wider text-primary-400 hover:text-primary-300 transition"
          >
            LACEBO
          </Link>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <NavLink to="/worlds">Explore Worlds</NavLink>
            {user && (
              <>
                <NavLink to="/worlds/mine">My Worlds</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <NavLink to="/worlds/create">Create World</NavLink>
              </>
            )}
          </div>
        </div>

        {/* Right: auth + hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <>
                <NavLink to="/profile">{user.display_name || user.username}</NavLink>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm text-dark-400 hover:text-red-400 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={toggle}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="sm:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-dark-800 transition"
          >
            <span className={`block h-0.5 w-5 bg-dark-300 transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-5 bg-dark-300 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-dark-300 transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-dark-700 bg-dark-900 px-4 py-4 flex flex-col gap-3">
          <NavLink to="/worlds" onClick={close}>Explore Worlds</NavLink>
          {user ? (
            <>
              <NavLink to="/worlds/mine" onClick={close}>My Worlds</NavLink>
              <NavLink to="/profile" onClick={close}>Profile</NavLink>
              <NavLink to="/worlds/create" onClick={close}>Create World</NavLink>
              <hr className="border-dark-700" />
              <span className="text-sm text-primary-400 font-medium">
                {user.display_name || user.username}
              </span>
              <button
                type="button"
                onClick={() => { logout(); close(); }}
                className="text-sm text-dark-400 hover:text-red-400 transition text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <Link
                to="/register"
                onClick={close}
                className="bg-primary-600 hover:bg-primary-500 text-white text-sm px-4 py-2.5 rounded-lg transition font-medium text-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
