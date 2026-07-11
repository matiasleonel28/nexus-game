import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/Toast';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    const persistent = type === 'error';

    setToasts(prev => {
      const next = [...prev, { id, message, type, persistent }];
      if (next.length > 3) {
        const persistent_toasts = next.filter(t => t.persistent);
        const non_persistent = next.filter(t => !t.persistent);
        const combined = [...persistent_toasts, ...non_persistent];
        return combined.slice(-3);
      }
      return next;
    });

    if (!persistent) {
      setTimeout(() => removeToast(id), 4000);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}
