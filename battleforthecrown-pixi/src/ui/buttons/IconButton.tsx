import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';

const iconButtonVariants = cva(
  [
    'font-game font-bold text-white',
    'border-2 rounded-full cursor-pointer outline-none',
    'transition-all duration-100 ease-in-out',
    'text-shadow-game',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'flex items-center justify-center gap-2',
  ],
  {
    variants: {
      variant: {
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
        danger: [
          'bg-gradient-to-b from-game-red-light to-game-red-dark',
          'border-game-red-border',
          'shadow-game-inset-red',
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
        neutral: [
          'bg-gradient-to-b from-game-stone-light to-game-stone-dark',
          'border-game-stone-border',
          'shadow-game-inset',
          'hover:brightness-110',
          'active:translate-y-0.5 active:shadow-game-pressed',
        ],
      },
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-14 h-14 text-xl',
      },
    },
    defaultVariants: {
      variant: 'success',
      size: 'md',
    },
  }
);

const iconSizeMap = {
  xs: 13,
  sm: 14,
  md: 18,
  lg: 22,
  xl: 26,
};

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: LucideIcon;
  label?: string; // Aria-label pour l'accessibilité
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size = 'md', icon: Icon, label, ...props }, ref) => {
    const iconSize = iconSizeMap[size || 'md'];
    
    return (
      <button
        ref={ref}
        className={iconButtonVariants({ variant, size, className })}
        aria-label={label}
        title={label}
        {...props}
      >
        <Icon size={iconSize} strokeWidth={2.5} />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
