import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
            warning: 'bg-amber-50 border-amber-300 text-amber-900',
            error: 'bg-red-50 border-red-300 text-red-900',
            info: 'bg-rail-50 border-rail-300 text-rail-900'
          }[toast.type] || 'bg-slate-50 border-slate-300 text-slate-900';

          const icon = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
            error: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
            info: <Info className="w-5 h-5 text-rail-600 shrink-0" />
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto border rounded-lg p-3.5 shadow-elevated flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-3 duration-200 ${typeStyles}`}
            >
              {icon}
              <div className="flex-1 text-sm">
                {toast.title && <div className="font-semibold text-xs tracking-wide uppercase mb-0.5">{toast.title}</div>}
                <div className="text-xs opacity-90 leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
