/**
 * Toast.jsx
 * Toast container + individual toast UI.
 * Rendered once at the app root; receives toasts + dismiss via ToastContext.
 */
import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';
import { useToast } from '../hooks/useToast';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToastContext() {
  return useContext(ToastContext);
}

// ─── Styles per type ─────────────────────────────────────────────────────────
const STYLES = {
  success: {
    bar: 'bg-emerald-500',
    icon: '✓',
    ring: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  error: {
    bar: 'bg-red-500',
    icon: '✕',
    ring: 'border-red-200 bg-red-50 text-red-800',
  },
  info: {
    bar: 'bg-indigo-500',
    icon: 'ℹ',
    ring: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastItem({ id, message, type, onDismiss }) {
  const s = STYLES[type] ?? STYLES.info;
  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 pr-10 shadow-lg text-sm font-medium animate-toast-in ${s.ring}`}
    >
      {/* Colored left bar */}
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.bar}`}
      >
        {s.icon}
      </span>
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2.5 text-current opacity-40 hover:opacity-80 transition text-lg leading-none"
      >
        ×
      </button>
      {/* Auto-progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 w-full rounded-b-xl ${s.bar} opacity-30 animate-toast-progress`}
      />
    </div>
  );
}

ToastItem.propTypes = {
  id: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

// ─── Toast Container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[9999] flex flex-col gap-3 sm:w-80"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

ToastContainer.propTypes = {
  toasts: PropTypes.array.isRequired,
  dismiss: PropTypes.func.isRequired,
};

// ─── Provider (wraps app, exposes toast fn via context) ───────────────────────
export function ToastProvider({ children }) {
  const { toasts, toast, dismiss } = useToast();
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = { children: PropTypes.node.isRequired };
