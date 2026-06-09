import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

function GlobeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ to, icon, label, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
        {icon}
      </span>
      {label}
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
      )}
    </Link>
  );
}

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

// ─── Sidebar body (shared between desktop + mobile drawer) ───────────────────

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center justify-between flex-shrink-0 border-b border-slate-100">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <span className="text-white font-black text-xs tracking-tight">LC</span>
          </div>
          <span className="text-xl font-extrabold tracking-wider text-indigo-600 group-hover:text-indigo-700 transition-colors">
            LACEBO
          </span>
        </Link>

        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Navigation
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <NavItem to="/worlds" icon={<GlobeIcon />} label="Explore Worlds" onClick={onClose} />
        {user && (
          <>
            <NavItem to="/worlds/mine" icon={<LayersIcon />} label="My Worlds" onClick={onClose} />
            <NavItem to="/worlds/create" icon={<PlusIcon />} label="Create World" onClick={onClose} />
            <NavItem to="/profile" icon={<UserIcon />} label="Profile" onClick={onClose} />
          </>
        )}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 p-4 border-t border-slate-100">
        {user ? (
          <>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors mb-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                {user.display_name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                  {user.display_name}
                </p>
                <p className="text-xs text-slate-400 truncate">@{user.username}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => { logout(); onClose?.(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOutIcon />
              Sign out
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <Link
              to="/login"
              onClick={onClose}
              className="block text-center w-full border border-slate-200 text-slate-700 text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

SidebarContent.propTypes = { onClose: PropTypes.func };

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = useCallback(() => setDrawerOpen(true), []);
  const close = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-slate-200 z-40 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-[10px] tracking-tight">LC</span>
          </div>
          <span className="text-lg font-extrabold tracking-wider text-indigo-600">LACEBO</span>
        </Link>
        <button
          type="button"
          onClick={open}
          aria-label="Open menu"
          className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <span className="block h-0.5 w-5 bg-slate-600 rounded-full" />
          <span className="block h-0.5 w-5 bg-slate-600 rounded-full" />
          <span className="block h-0.5 w-3.5 bg-slate-600 rounded-full self-start" />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={close}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-2xl animate-slide-in">
            <SidebarContent onClose={close} />
          </aside>
        </>
      )}
    </>
  );
}
