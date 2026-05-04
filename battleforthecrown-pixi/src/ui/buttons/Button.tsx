import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  [
    'font-game font-bold text-white',
    'border-2 rounded-md cursor-pointer outline-none',
    'transition-all duration-100 ease-in-out',
    'text-shadow-game',
    'disabled:opacity-50 disabled:cursor-not-allowed',
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
        xs: 'px-2 py-1 text-xs',
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg',
        xl: 'px-10 py-4 text-xl',
      },
    },
    defaultVariants: {
      variant: 'success',
      size: 'sm',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
