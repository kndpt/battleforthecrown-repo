import { useState, useCallback, type ReactNode } from 'react';
import { Toast, type ToastProps } from './Toast';
import { ToastContext, type ToastPosition } from './toast-context';

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

const getPositionClasses = (position: ToastPosition) => {
  switch (position) {
    case 'top-right':
      return 'top-4 right-4';
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    default:
      return 'top-4 right-4';
  }
};

export const ToastProvider = ({ children, position = 'top-right' }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, position }}>
      {children}
      
      <div className={`fixed ${getPositionClasses(position)} z-[100] flex flex-col gap-2 pointer-events-none`}>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

