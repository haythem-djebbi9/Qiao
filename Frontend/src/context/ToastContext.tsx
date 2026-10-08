import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

let nextId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextId++;
      setToasts((current) => [...current.slice(-3), { id, message, variant }]);
      setTimeout(() => dismiss(id), variant === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 max-w-sm w-[calc(100%-3rem)] sm:w-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-start gap-3 text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${
              toast.variant === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : toast.variant === 'info'
                ? 'bg-[#07152b] text-white border-sky-400/40'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.variant === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            ) : toast.variant === 'info' ? (
              <Info className="w-5 h-5 text-sky-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="opacity-60 hover:opacity-100 cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
