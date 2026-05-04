'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

const overlayVariants = cva([
  'fixed inset-0 z-40',
  'bg-black/60',
  'backdrop-blur-sm',
  'transition-opacity duration-300',
]);

const modalVariants = cva(
  [
    'fixed z-50',
    'bg-gradient-to-b from-[#f4e4c1] to-[#e8d4a8]',
    'border-4 rounded-lg',
    'shadow-2xl',
    'transform transition-all duration-300',
    'font-game',
  ],
  {
    variants: {
      size: {
        sm: 'w-[90%] max-w-md',
        md: 'w-[90%] max-w-2xl',
        lg: 'w-[90%] max-w-4xl',
        xl: 'w-[90%] max-w-6xl',
      },
      variant: {
        default: [
          'border-[#8b6f47]',
          'shadow-[0_0_0_2px_#5d4a32,0_8px_32px_rgba(0,0,0,0.5)]',
        ],
        warning: [
          'border-game-gold-border',
          'shadow-[0_0_0_2px_#9e7b0d,0_8px_32px_rgba(241,196,15,0.3)]',
        ],
        danger: [
          'border-game-red-border',
          'shadow-[0_0_0_2px_#a93226,0_8px_32px_rgba(231,76,60,0.3)]',
        ],
        info: [
          'border-game-blue-border',
          'shadow-[0_0_0_2px_#1f5288,0_8px_32px_rgba(91,155,213,0.3)]',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const headerVariants = cva([
  'relative',
  'px-6 py-4',
  'bg-gradient-to-b from-[#8b6f47] to-[#6d5838]',
  'border-b-4 border-[#5d4a32]',
  'rounded-t-md',
]);

const titleVariants = cva([
  'text-2xl font-bold',
  'text-white',
  'text-shadow-game',
  'font-cinzel',
  'text-center',
  'pr-8',
]);

const closeButtonVariants = cva([
  'absolute right-2 top-1/2 -translate-y-1/2',
  'w-8 h-8',
  'flex items-center justify-center',
  'rounded-full',
  'bg-gradient-to-b from-game-red-light to-game-red-dark',
  'border-2 border-game-red-border',
  'text-white',
  'hover:brightness-110',
  'active:translate-y-0.5',
  'transition-all duration-100',
  'cursor-pointer',
]);

export interface ModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size,
  variant,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div className={overlayVariants()} onClick={handleOverlayClick} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        <div
          ref={modalRef}
          className={modalVariants({ size, variant })}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className={headerVariants()}>
              <h2 className={titleVariants()}>{title}</h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={closeButtonVariants()}
                  aria-label="Fermer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
};
