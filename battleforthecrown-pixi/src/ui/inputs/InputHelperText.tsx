import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const helperTextVariants = cva(
  [
    'block',
    'mt-1.5',
    'text-sm',
    'font-game',
  ],
  {
    variants: {
      variant: {
        default: 'text-gray-600',
        success: 'text-game-green-dark',
        error: 'text-game-red-dark',
        warning: 'text-[#ff8d22]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputHelperTextProps extends VariantProps<typeof helperTextVariants> {
  children: ReactNode;
  className?: string;
}

export const InputHelperText = ({ 
  children, 
  variant, 
  className 
}: InputHelperTextProps) => {
  return (
    <span className={helperTextVariants({ variant, className })}>
      {children}
    </span>
  );
};
