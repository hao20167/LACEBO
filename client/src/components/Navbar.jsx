import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
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
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${
        active
          ? 'bg-[#e8eaed] text-slate-900 font-semibold'
          : 'text-slate-700 hover:bg-[#f0f2f5] hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
      {label}
    </Link>
  );
}

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }) {
  return (
    <div className="px-2.5 pt-5 pb-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

SectionLabel.propTypes = { label: PropTypes.string.isRequired };

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="my-2 mx-2.5 border-t border-slate-200" />;
}

// ─── Sidebar Content ─────────────────────────────────────────────────────────

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center justify-between flex-shrink-0 border-b border-slate-200 bg-white">
        <Link to="/" onClick={onClose} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <span className="text-white font-black text-xs">LC</span>
          </div>
          <span className="text-lg font-extrabold tracking-wider text-slate-900">
            LACEBO
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 px-1.5 py-1.5">
        {/* My Feeds section */}
        <SectionLabel label="My Feeds" />
        <nav className="space-y-0.5">
          <NavItem to="/" icon={<HomeIcon />} label="Home" onClick={onClose} />
          <NavItem to="/worlds" icon={<GlobeIcon />} label="Explore Worlds" onClick={onClose} />
        </nav>

        <Divider />

        {/* Communities section */}
        {user && (
          <>
            <SectionLabel label="Communities" />
            <nav className="space-y-0.5">
              <NavItem to="/worlds/mine" icon={<LayersIcon />} label="My Worlds" onClick={onClose} />
            </nav>
            <Divider />
          </>
        )}

        {/* Other section */}
        <SectionLabel label="Other" />
        <nav className="space-y-0.5">
          <NavItem to="/worlds/create" icon={<PlusCircleIcon />} label="Create World" onClick={onClose} />
          {user && (
            <NavItem to="/profile" icon={<UserIcon />} label="Profile" onClick={onClose} />
          )}
        </nav>
      </div>

      {/* User section at bottom */}
      <div className="flex-shrink-0 border-t border-slate-200 p-3 bg-white">
        {user ? (
          <div>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#f0f2f5] transition-colors mb-1 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user.display_name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-slate-400 truncate">u/{user.username}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => { logout(); onClose?.(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOutIcon />
              Log Out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              to="/login"
              onClick={onClose}
              className="block text-center w-full border border-indigo-500 text-indigo-600 text-sm px-4 py-2 rounded-full hover:bg-indigo-50 transition-all font-bold"
            >
              Log In
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-full transition-colors font-bold"
            >
              Sign Up
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
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-[#f8f9fa] border-r border-slate-200 z-40">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-black text-[10px]">LC</span>
          </div>
          <span className="text-base font-extrabold tracking-wider text-slate-900">LACEBO</span>
        </Link>
        <button
          type="button"
          onClick={open}
          aria-label="Open menu"
          className="flex flex-col justify-center items-center w-8 h-8 gap-1 rounded hover:bg-slate-100 transition-colors"
        >
          <span className="block h-0.5 w-4 bg-slate-600 rounded-full" />
          <span className="block h-0.5 w-5 bg-slate-600 rounded-full" />
          <span className="block h-0.5 w-4 bg-slate-600 rounded-full self-end" />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={close}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#f8f9fa] z-50 flex flex-col shadow-2xl animate-slide-in">
            <SidebarContent onClose={close} />
          </aside>
        </>
      )}
    </>
  );
}
