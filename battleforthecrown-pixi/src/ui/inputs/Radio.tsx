import { InputHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const radioVariants = cva(
  [
    'peer',
    'appearance-none',
    'border-2 rounded-full',
    'cursor-pointer',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-[#d4c094]',
          'checked:border-[#5d4a32]',
          'focus:ring-[#d4c094]/30',
          'hover:border-[#c4b084]',
        ],
        parchment: [
          'border-[#d4c094]',
          'bg-[#f4e4c1]',
          'checked:border-[#5d4a32]',
          'focus:ring-[#d4c094]/30',
          'hover:border-[#c4b084]',
        ],
        success: [
          'border-game-green-border',
          'checked:border-game-green-border',
          'focus:ring-game-green-light/30',
          'hover:border-game-green-dark',
        ],
        error: [
          'border-game-red-border',
          'checked:border-game-red-border',
          'focus:ring-game-red-light/30',
          'hover:border-game-red-dark',
        ],
      },
      size: {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const dotVariants = cva(
  [
    'absolute',
    'rounded-full',
    'pointer-events-none',
    'opacity-0 peer-checked:opacity-100',
    'transition-opacity duration-150',
  ],
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-[#8b6f47] to-[#6d5838]',
        parchment: 'bg-gradient-to-b from-[#8b6f47] to-[#6d5838]',
        success: 'bg-gradient-to-b from-game-green-light to-game-green-dark',
        error: 'bg-gradient-to-b from-game-red-light to-game-red-dark',
      },
      size: {
        sm: 'w-2 h-2 top-[3px] left-[3px]',
        md: 'w-2.5 h-2.5 top-[4px] left-[4px]',
        lg: 'w-3 h-3 top-[5px] left-[5px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof radioVariants> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, variant, size = 'md', label, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="inline-flex items-center gap-2">
        <div className="relative inline-block">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={radioVariants({ variant, size, className })}
            {...props}
          />
          <div className={dotVariants({ variant, size })} />
        </div>
        {label && (
          <label
            htmlFor={radioId}
            className="font-game text-gray-800 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
