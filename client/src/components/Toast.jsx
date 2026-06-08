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
    bar:  'bg-green-500',
    icon: '✓',
    ring: 'border-green-700/60 bg-green-900/30 text-green-200',
  },
  error: {
    bar:  'bg-red-500',
    icon: '✕',
    ring: 'border-red-700/60 bg-red-900/30 text-red-200',
  },
  info: {
    bar:  'bg-primary-500',
    icon: 'ℹ',
    ring: 'border-primary-700/60 bg-primary-900/30 text-primary-200',
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastItem({ id, message, type, onDismiss }) {
  const s = STYLES[type] ?? STYLES.info;
  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 pr-10 shadow-2xl text-sm font-medium animate-toast-in ${s.ring}`}
    >
      {/* Colored left bar */}
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.bar}`}>
        {s.icon}
      </span>
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2.5 text-current opacity-50 hover:opacity-100 transition text-lg leading-none"
      >
        ×
      </button>
      {/* Auto-progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 w-full rounded-b-xl ${s.bar} opacity-40 animate-toast-progress`} />
    </div>
  );
}

ToastItem.propTypes = {
  id:        PropTypes.number.isRequired,
  message:   PropTypes.string.isRequired,
  type:      PropTypes.oneOf(['success', 'error', 'info']).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

// ─── Toast Container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

ToastContainer.propTypes = {
  toasts:  PropTypes.array.isRequired,
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
