'use client';

import { ReactNode, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const toastVariants = cva(
  [
    'flex items-start gap-3',
    'min-w-[300px] max-w-[500px]',
    'p-4 rounded-lg',
    'border-2',
    'shadow-lg',
    'font-game',
    'animate-in slide-in-from-top-5 fade-in duration-300',
  ],
  {
    variants: {
      variant: {
        success: [
          'bg-gradient-to-b from-game-green-light/95 to-game-green-dark/95',
          'border-game-green-border',
          'text-white',
        ],
        error: [
          'bg-gradient-to-b from-game-red-light/95 to-game-red-dark/95',
          'border-game-red-border',
          'text-white',
        ],
        warning: [
          'bg-gradient-to-b from-game-gold-light/95 to-game-gold-dark/95',
          'border-game-gold-border',
          'text-white',
        ],
        info: [
          'bg-gradient-to-b from-game-blue-light/95 to-game-blue-dark/95',
          'border-game-blue-border',
          'text-white',
        ],
        default: [
          'bg-gradient-to-b from-[#8b6f47]/95 to-[#6d5838]/95',
          'border-[#5d4a32]',
          'text-white',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const getIcon = (variant: 'success' | 'error' | 'warning' | 'info' | 'default') => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="w-5 h-5 flex-shrink-0" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
    case 'info':
      return <Info className="w-5 h-5 flex-shrink-0" />;
    default:
      return <Info className="w-5 h-5 flex-shrink-0" />;
  }
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  title?: string;
  message: string | ReactNode;
  duration?: number;
  onClose: (id: string) => void;
  onClick?: () => void;
}

export const Toast = ({
  id,
  title,
  message,
  variant = 'default',
  duration = 5000,
  onClose,
  onClick,
}: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      onClose(id); // Fermer le toast après le clic
    }
  };

  return (
    <div 
      className={`${toastVariants({ variant })} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      onClick={handleClick}
    >
      {getIcon(variant || 'default')}
      
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-bold text-sm mb-1 text-shadow-game">
            {title}
          </div>
        )}
        <div className="text-sm text-white/90">
          {message}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation(); // Empêcher le clic de déclencher onClick du toast
          onClose(id);
        }}
        className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

Toast.displayName = 'Toast';
