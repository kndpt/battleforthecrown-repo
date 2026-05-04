import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-game font-bold',
    'text-white text-shadow-game',
    'rounded-full',
    'border-2',
    'transition-all duration-150',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-[#8b6f47] to-[#6d5838]',
          'border-[#5d4a32]',
        ],
        success: [
          'bg-gradient-to-b from-game-green-light to-game-green-dark',
          'border-game-green-border',
        ],
        error: [
          'bg-gradient-to-b from-game-red-light to-game-red-dark',
          'border-game-red-border',
        ],
        warning: [
          'bg-gradient-to-b from-game-gold-light to-game-gold-dark',
          'border-game-gold-border',
        ],
        info: [
          'bg-gradient-to-b from-game-blue-light to-game-blue-dark',
          'border-game-blue-border',
        ],
        neutral: [
          'bg-gradient-to-b from-game-stone-light to-game-stone-dark',
          'border-game-stone-border',
        ],
      },
      size: {
        sm: 'min-w-[19px] h-[19px] px-1 text-[10px]',
        md: 'min-w-[22px] h-[22px] px-1.5 text-xs',
        lg: 'min-w-[28px] h-[28px] px-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
}: BadgeProps) => {
  return (
    <span className={badgeVariants({ variant, size, className })}>
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
