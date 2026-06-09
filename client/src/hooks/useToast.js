/**
 * useToast.js
 * Lightweight toast notification hook — no external dependencies.
 * Usage: const { toasts, toast } = useToast();
 *        toast.success('Done!') | toast.error('Oops') | toast.info('Note')
 */
import { useState, useCallback } from 'react';

let _nextId = 0;

// Named helpers to avoid deep nesting inside callbacks
function withoutId(id) {
  return (t) => t.id !== id;
}

function appendToast(id, message, type) {
  return (prev) => [...prev, { id, message, type }];
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_nextId;
    setToasts(appendToast(id, message, type));
    setTimeout(() => setToasts((prev) => prev.filter(withoutId(id))), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter(withoutId(id)));
  }, []);

  const toast = {
    success: (msg, duration) => push(msg, 'success', duration),
    error:   (msg, duration) => push(msg, 'error',   duration),
    info:    (msg, duration) => push(msg, 'info',    duration),
  };

  return { toasts, toast, dismiss };
}
