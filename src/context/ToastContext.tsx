/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const noop = { showToast: () => {} };

export function useToast() {
  return useContext(ToastContext) ?? noop;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: ToastType = 'success') {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, visible: true });
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
  }

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 28,
          left: 'var(--toast-x, 50%)',
          transform: `translateX(-50%) translateY(${toast.visible ? '0' : '10px'})`,
          opacity: toast.visible ? 1 : 0,
          transition: 'opacity 180ms ease, transform 180ms ease',
          pointerEvents: 'none',
          zIndex: 9999,
          background: toast.type === 'success' ? 'var(--surface-inverse)' : '#c0392b',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)'
        }}
      >
        {toast.message}
      </div>
    </ToastContext>
  );
}
