import { createContext } from 'react';
import type { ToastProps } from './Toast';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastContextValue {
  toasts: Omit<ToastProps, 'onClose'>[];
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
  position: ToastPosition;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
