import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const panelHeaderVariants = cva(
  [
    'flex items-center justify-between',
    'border-b-2',
    'font-cinzel font-bold',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[#d4c094]',
          'border-[#8b7355]',
          'text-gray-800',
        ],
        parchment: [
          'bg-gradient-to-r from-[#e8d5b7] to-[#d4c094]',
          'border-[#8b7355]',
          'text-gray-800',
        ],
        wood: [
          'bg-gradient-to-r from-[#6f5139] to-[#5d4a32]',
          'border-[#3d2f1f]',
          'text-[#f5e6d3]',
        ],
        stone: [
          'bg-gradient-to-r from-[#808080] to-[#606060]',
          'border-[#404040]',
          'text-white',
        ],
        success: [
          'bg-gradient-to-r from-game-green-light to-game-green-dark',
          'border-game-green-border',
          'text-white',
        ],
        info: [
          'bg-gradient-to-r from-game-blue-light to-game-blue-dark',
          'border-game-blue-border',
          'text-white',
        ],
        warning: [
          'bg-gradient-to-r from-game-gold-light to-game-gold-dark',
          'border-game-gold-border',
          'text-gray-800',
        ],
        danger: [
          'bg-gradient-to-r from-game-red-light to-game-red-dark',
          'border-game-red-border',
          'text-white',
        ],
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-6 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface PanelHeaderProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelHeaderVariants> {
  children: ReactNode;
}

export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={panelHeaderVariants({ variant, size, className })}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PanelHeader.displayName = 'PanelHeader';
