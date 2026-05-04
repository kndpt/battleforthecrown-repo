import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const floatingButtonVariants = cva(
  [
    'fixed z-50',
    'font-game font-bold text-white',
    'border-2 cursor-pointer outline-none',
    'transition-all duration-200 ease-in-out',
    'text-shadow-game',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'shadow-lg hover:shadow-xl',
    'flex items-center justify-center gap-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-[#f5e6d3] to-[#d4c094]',
          'border-[#8b7355]',
          'text-gray-800',
          'hover:brightness-105',
          'active:translate-y-0.5 active:shadow-md',
        ],
        success: [
          'bg-gradient-to-b from-game-green-light to-game-green-dark',
          'border-game-green-border',
          'shadow-game-inset',
          'hover:brightness-110',
          'active:translate-y-0.5 active:shadow-game-pressed',
        ],
        info: [
          'bg-gradient-to-b from-game-blue-light to-game-blue-dark',
          'border-game-blue-border',
          'shadow-game-inset',
          'hover:brightness-110',
          'active:translate-y-0.5 active:shadow-game-pressed',
        ],
        warning: [
          'bg-gradient-to-b from-game-gold-light to-game-gold-dark',
          'border-game-gold-border',
          'shadow-game-inset',
          'hover:brightness-110',
          'active:translate-y-0.5 active:shadow-game-pressed',
        ],
        danger: [
          'bg-gradient-to-b from-game-red-light to-game-red-dark',
          'border-game-red-border',
          'shadow-game-inset-red',
          'hover:brightness-110',
          'active:translate-y-0.5 active:shadow-game-pressed',
        ],
      },
      shape: {
        round: 'rounded-full aspect-square',
        edge: 'rounded-lg',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      position: {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'right-center': 'top-1/2 -translate-y-1/2 right-0',
        'left-center': 'top-1/2 -translate-y-1/2 left-0',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
      },
    },
    compoundVariants: [
      // Round sizes
      {
        shape: 'round',
        size: 'sm',
        className: 'w-12 h-12 text-sm',
      },
      {
        shape: 'round',
        size: 'md',
        className: 'w-14 h-14 text-base',
      },
      {
        shape: 'round',
        size: 'lg',
        className: 'w-16 h-16 text-lg',
      },
      {
        shape: 'round',
        size: 'xl',
        className: 'w-20 h-20 text-xl',
      },
      // Edge sizes (rectangular for sides)
      {
        shape: 'edge',
        size: 'sm',
        className: 'px-3 py-2 text-sm min-w-[100px]',
      },
      {
        shape: 'edge',
        size: 'md',
        className: 'px-4 py-3 text-base min-w-[120px]',
      },
      {
        shape: 'edge',
        size: 'lg',
        className: 'px-6 py-4 text-lg min-w-[140px]',
      },
      {
        shape: 'edge',
        size: 'xl',
        className: 'px-8 py-5 text-xl min-w-[160px]',
      },
      // Edge positions with rounded corners adjustments
      {
        shape: 'edge',
        position: 'right-center',
        className: 'rounded-l-lg rounded-r-none',
      },
      {
        shape: 'edge',
        position: 'left-center',
        className: 'rounded-r-lg rounded-l-none',
      },
    ],
    defaultVariants: {
      variant: 'success',
      shape: 'round',
      size: 'md',
      position: 'bottom-right',
    },
  }
);

export interface FloatingButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    VariantProps<typeof floatingButtonVariants> {
  children?: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
}

export const FloatingButton = forwardRef<HTMLButtonElement, FloatingButtonProps>(
  ({ 
    className, 
    variant, 
    shape, 
    size, 
    position, 
    children, 
    icon,
    badge,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={floatingButtonVariants({ variant, shape, size, position, className })}
        {...props}
      >
        {icon && <span className="flex items-center justify-center">{icon}</span>}
        {shape === 'edge' && <span className="flex-1">{children}</span>}
        {shape === 'round' && !icon && <span>{children}</span>}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-game-red-dark border-2 border-game-red-border text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </button>
    );
  }
);

FloatingButton.displayName = 'FloatingButton';
