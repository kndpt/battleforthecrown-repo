import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const panelFooterVariants = cva(
  [
    'flex items-center justify-end gap-2',
    'border-t-2',
    'px-4 py-3',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[#e8d5b7]',
          'border-[#8b7355]',
        ],
        parchment: [
          'bg-gradient-to-r from-[#e8d5b7] to-[#d4c094]',
          'border-[#8b7355]',
        ],
        wood: [
          'bg-gradient-to-r from-[#6f5139] to-[#5d4a32]',
          'border-[#3d2f1f]',
        ],
        stone: [
          'bg-gradient-to-r from-[#808080] to-[#606060]',
          'border-[#404040]',
        ],
        success: [
          'bg-game-green-light',
          'border-game-green-border',
        ],
        info: [
          'bg-game-blue-light',
          'border-game-blue-border',
        ],
        warning: [
          'bg-game-gold-light',
          'border-game-gold-border',
        ],
        danger: [
          'bg-game-red-light',
          'border-game-red-border',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface PanelFooterProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelFooterVariants> {
  children: ReactNode;
}

export const PanelFooter = forwardRef<HTMLDivElement, PanelFooterProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={panelFooterVariants({ variant, className })}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PanelFooter.displayName = 'PanelFooter';
