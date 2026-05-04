import { InputHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';

const checkboxVariants = cva(
  [
    'peer',
    'appearance-none',
    'border-2 rounded',
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
          'checked:bg-gradient-to-b checked:from-[#8b6f47] checked:to-[#6d5838]',
          'checked:border-[#5d4a32]',
          'focus:ring-[#d4c094]/30',
          'hover:border-[#c4b084]',
        ],
        parchment: [
          'border-[#d4c094]',
          'bg-[#f4e4c1]',
          'checked:bg-gradient-to-b checked:from-[#8b6f47] checked:to-[#6d5838]',
          'checked:border-[#5d4a32]',
          'focus:ring-[#d4c094]/30',
          'hover:border-[#c4b084]',
        ],
        success: [
          'border-game-green-border',
          'checked:bg-gradient-to-b checked:from-game-green-light checked:to-game-green-dark',
          'checked:border-game-green-border',
          'focus:ring-game-green-light/30',
          'hover:border-game-green-dark',
        ],
        error: [
          'border-game-red-border',
          'checked:bg-gradient-to-b checked:from-game-red-light checked:to-game-red-dark',
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

const iconVariants = cva(
  [
    'absolute',
    'pointer-events-none',
    'text-white',
    'opacity-0 peer-checked:opacity-100',
    'transition-opacity duration-150',
  ],
  {
    variants: {
      size: {
        sm: 'w-3 h-3 top-[2px] left-[2px]',
        md: 'w-4 h-4 top-[2px] left-[2px]',
        lg: 'w-5 h-5 top-[2px] left-[2px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, size = 'md', label, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="inline-flex items-center gap-2">
        <div className="relative inline-block">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={checkboxVariants({ variant, size, className })}
            {...props}
          />
          <Check className={iconVariants({ size })} strokeWidth={3} />
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className="font-game text-gray-800 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
