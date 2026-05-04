import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
  [
    'inline-block',
    'border-4 border-solid rounded-full',
    'animate-spin',
  ],
  {
    variants: {
      variant: {
        default: 'border-[#d4c094] border-t-[#5d4a32]',
        success: 'border-game-green-light border-t-game-green-dark',
        error: 'border-game-red-light border-t-game-red-dark',
        warning: 'border-game-gold-light border-t-game-gold-dark',
        info: 'border-game-blue-light border-t-game-blue-dark',
        neutral: 'border-game-stone-light border-t-game-stone-dark',
      },
      size: {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16 border-[6px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  label?: string;
}

export const Spinner = ({ 
  variant = 'default', 
  size = 'md',
  className = '',
  label,
}: SpinnerProps) => {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className={spinnerVariants({ variant, size, className })}
        role="status"
        aria-label={label || 'Chargement...'}
      />
      {label && (
        <span className="font-game text-sm text-gray-700">
          {label}
        </span>
      )}
    </div>
  );
};

Spinner.displayName = 'Spinner';
