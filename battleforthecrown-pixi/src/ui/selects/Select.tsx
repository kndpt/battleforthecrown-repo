'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

const selectVariants = cva(
  [
    'font-game font-semibold',
    'relative w-full',
    'border-2 rounded-lg',
    'cursor-pointer outline-none',
    'transition-all duration-150',
    'appearance-none',
    'pr-10',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'bg-no-repeat',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-white to-gray-50',
          'border-[#d4c094]',
          'text-gray-800',
          'hover:border-[#c4b084]',
          'focus:border-[#b4a074] focus:ring-2 focus:ring-[#d4c094]/30',
        ],
        parchment: [
          'bg-gradient-to-b from-[#f4e4c1] to-[#e8d4a8]',
          'border-[#d4c094]',
          'text-gray-800',
          'hover:border-[#c4b084]',
          'focus:border-[#b4a074] focus:ring-2 focus:ring-[#d4c094]/30',
        ],
        success: [
          'bg-gradient-to-b from-game-green-light/20 to-game-green-dark/20',
          'border-game-green-border',
          'text-gray-800',
          'hover:border-game-green-dark',
          'focus:border-game-green-dark focus:ring-2 focus:ring-game-green-light/30',
        ],
        info: [
          'bg-gradient-to-b from-game-blue-light/20 to-game-blue-dark/20',
          'border-game-blue-border',
          'text-gray-800',
          'hover:border-game-blue-dark',
          'focus:border-game-blue-dark focus:ring-2 focus:ring-game-blue-light/30',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-2.5 text-lg',
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
    'absolute right-3 top-1/2 -translate-y-1/2',
    'pointer-events-none',
    'transition-transform duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'text-gray-600',
        parchment: 'text-gray-700',
        success: 'text-game-green-dark',
        info: 'text-game-blue-dark',
      },
    },
  }
);

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size = 'md', options, placeholder, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          className={selectVariants({ variant, size, className })}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={iconVariants({ variant })}
          size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
