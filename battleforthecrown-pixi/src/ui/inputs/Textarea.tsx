import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const textareaVariants = cva(
  [
    'w-full rounded-md border-2',
    'font-game',
    'transition-all duration-200',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'resize-y',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white border-gray-300',
          'text-gray-800',
          'focus:border-gray-400 focus:ring-gray-300',
        ],
        parchment: [
          'bg-gradient-to-br from-[#f5e6d3] to-[#e8d5b7]',
          'border-[#8b7355]',
          'text-gray-800',
          'focus:border-[#6f5d42] focus:ring-[#d4c094]',
        ],
        success: [
          'bg-game-green-light/20 border-game-green-border',
          'text-gray-800',
          'focus:border-game-green-dark focus:ring-game-green-light',
        ],
        error: [
          'bg-game-red-light/20 border-game-red-border',
          'text-gray-800',
          'focus:border-game-red-dark focus:ring-game-red-light',
        ],
      },
      size: {
        sm: 'px-2 py-1.5 text-sm min-h-[60px]',
        md: 'px-3 py-2 text-base min-h-[100px]',
        lg: 'px-4 py-3 text-lg min-h-[150px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = 'default', size = 'md', className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={textareaVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
