import { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const sliderVariants = cva(
  [
    'w-full appearance-none bg-transparent cursor-pointer',
    'focus:outline-none',
    // Track styling
    '[&::-webkit-slider-runnable-track]:rounded-full',
    '[&::-webkit-slider-runnable-track]:border-2',
    '[&::-moz-range-track]:rounded-full',
    '[&::-moz-range-track]:border-2',
    // Thumb styling
    '[&::-webkit-slider-thumb]:appearance-none',
    '[&::-webkit-slider-thumb]:rounded-full',
    '[&::-webkit-slider-thumb]:border-2',
    '[&::-webkit-slider-thumb]:cursor-pointer',
    '[&::-webkit-slider-thumb]:transition-all',
    '[&::-webkit-slider-thumb]:hover:scale-110',
    '[&::-moz-range-thumb]:appearance-none',
    '[&::-moz-range-thumb]:rounded-full',
    '[&::-moz-range-thumb]:border-2',
    '[&::-moz-range-thumb]:cursor-pointer',
    '[&::-moz-range-thumb]:transition-all',
    '[&::-moz-range-thumb]:hover:scale-110',
    '[&::-moz-range-thumb]:border-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: [
          '[&::-webkit-slider-runnable-track]:bg-[#d4c094]',
          '[&::-webkit-slider-runnable-track]:border-[#8b7355]',
          '[&::-moz-range-track]:bg-[#d4c094]',
          '[&::-moz-range-track]:border-[#8b7355]',
          '[&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-[#f5e6d3] [&::-webkit-slider-thumb]:to-[#d4c094]',
          '[&::-webkit-slider-thumb]:border-[#8b7355]',
          '[&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
          '[&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-[#f5e6d3] [&::-moz-range-thumb]:to-[#d4c094]',
          '[&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
        ],
        success: [
          '[&::-webkit-slider-runnable-track]:bg-game-green-light',
          '[&::-webkit-slider-runnable-track]:border-game-green-border',
          '[&::-moz-range-track]:bg-game-green-light',
          '[&::-moz-range-track]:border-game-green-border',
          '[&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-game-green-light [&::-webkit-slider-thumb]:to-game-green-dark',
          '[&::-webkit-slider-thumb]:border-game-green-border',
          '[&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
          '[&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-game-green-light [&::-moz-range-thumb]:to-game-green-dark',
          '[&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
        ],
        info: [
          '[&::-webkit-slider-runnable-track]:bg-game-blue-light',
          '[&::-webkit-slider-runnable-track]:border-game-blue-border',
          '[&::-moz-range-track]:bg-game-blue-light',
          '[&::-moz-range-track]:border-game-blue-border',
          '[&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-game-blue-light [&::-webkit-slider-thumb]:to-game-blue-dark',
          '[&::-webkit-slider-thumb]:border-game-blue-border',
          '[&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
          '[&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-game-blue-light [&::-moz-range-thumb]:to-game-blue-dark',
          '[&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
        ],
        warning: [
          '[&::-webkit-slider-runnable-track]:bg-game-gold-light',
          '[&::-webkit-slider-runnable-track]:border-game-gold-border',
          '[&::-moz-range-track]:bg-game-gold-light',
          '[&::-moz-range-track]:border-game-gold-border',
          '[&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-game-gold-light [&::-webkit-slider-thumb]:to-game-gold-dark',
          '[&::-webkit-slider-thumb]:border-game-gold-border',
          '[&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
          '[&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-game-gold-light [&::-moz-range-thumb]:to-game-gold-dark',
          '[&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
        ],
        danger: [
          '[&::-webkit-slider-runnable-track]:bg-game-red-light',
          '[&::-webkit-slider-runnable-track]:border-game-red-border',
          '[&::-moz-range-track]:bg-game-red-light',
          '[&::-moz-range-track]:border-game-red-border',
          '[&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-game-red-light [&::-webkit-slider-thumb]:to-game-red-dark',
          '[&::-webkit-slider-thumb]:border-game-red-border',
          '[&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
          '[&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-game-red-light [&::-moz-range-thumb]:to-game-red-dark',
          '[&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]',
        ],
      },
      size: {
        sm: [
          '[&::-webkit-slider-runnable-track]:h-1',
          '[&::-moz-range-track]:h-1',
          '[&::-webkit-slider-thumb]:w-3',
          '[&::-webkit-slider-thumb]:h-3',
          '[&::-webkit-slider-thumb]:-mt-1',
          '[&::-moz-range-thumb]:w-3',
          '[&::-moz-range-thumb]:h-3',
        ],
        md: [
          '[&::-webkit-slider-runnable-track]:h-2',
          '[&::-moz-range-track]:h-2',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:-mt-1.5',
          '[&::-moz-range-thumb]:w-5',
          '[&::-moz-range-thumb]:h-5',
        ],
        lg: [
          '[&::-webkit-slider-runnable-track]:h-3',
          '[&::-moz-range-track]:h-3',
          '[&::-webkit-slider-thumb]:w-6',
          '[&::-webkit-slider-thumb]:h-6',
          '[&::-webkit-slider-thumb]:-mt-1.5',
          '[&::-moz-range-thumb]:w-6',
          '[&::-moz-range-thumb]:h-6',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof sliderVariants> {
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number | string | readonly string[]) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ 
    variant = 'default', 
    size = 'md', 
    className = '', 
    label,
    showValue = false,
    value,
    valueFormatter,
    min = 0,
    max = 100,
    ...props 
  }, ref) => {
    const numValue = typeof value === 'string' ? parseInt(value) : value || 0;
    const displayValue = valueFormatter ? valueFormatter(numValue) : numValue;

    return (
      <div className="w-full space-y-2">
        {(label || showValue) && (
          <div className="flex justify-between items-center">
            {label && (
              <label className="font-game text-sm text-gray-700">
                {label}
              </label>
            )}
            {showValue && (
              <span className="font-game text-sm font-semibold text-gray-800">
                {displayValue}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          value={value}
          className={sliderVariants({ variant, size, className })}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
