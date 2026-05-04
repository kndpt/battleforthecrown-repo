import { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  [
    'w-full',
    'px-4 py-2.5',
    'font-game',
    'rounded-xl',
    'border-4',
    'outline-none',
    'transition-all duration-200',
    'placeholder:text-gray-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white/90',
          'border-[#8b6f47]',
          'text-gray-800',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
          'focus:border-[#6d5838]',
          'focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_0_0_3px_rgba(139,111,71,0.2)]',
        ],
        parchment: [
          'bg-[#fef9f0]',
          'border-[#d4c094]',
          'text-gray-800',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]',
          'focus:border-[#c9a882]',
          'focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_0_0_3px_rgba(212,192,148,0.25)]',
        ],
        success: [
          'bg-white/90',
          'border-game-green-border',
          'text-gray-800',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
          'focus:border-game-green-dark',
          'focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_0_0_3px_rgba(74,140,42,0.2)]',
        ],
        error: [
          'bg-white/90',
          'border-game-red-border',
          'text-gray-800',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
          'focus:border-game-red-dark',
          'focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_0_0_3px_rgba(169,50,38,0.2)]',
        ],
      },
      size: {
        sm: 'text-sm px-3 py-2',
        md: 'text-base px-4 py-2.5',
        lg: 'text-lg px-5 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={inputVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
