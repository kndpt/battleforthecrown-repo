import { cva, type VariantProps } from 'class-variance-authority';

const progressBarVariants = cva(
  [
    'relative w-full overflow-hidden',
    'rounded-xl border-4',
    'bg-gradient-to-b',
    'shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]',
  ],
  {
    variants: {
      variant: {
        default: ['from-[#6f7b8b] to-[#505a69]','border-[#515c6c]'],
        success: ['from-[#6f8b6f] to-[#4a5a4a]','border-game-green-border'],
        info: ['from-[#6f7b8b] to-[#4a5a6a]','border-game-blue-border'],
        warning: ['from-[#8b7b6f] to-[#6a5a4a]','border-game-gold-border'],
        danger: ['from-[#8b6f6f] to-[#6a4a4a]','border-game-red-border'],
      },
      size: {
        sm: 'h-4',
        md: 'h-6',
        lg: 'h-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

const progressFillVariants = cva(
  [
    'h-full',
    'bg-gradient-to-r',
    'transition-all duration-500 ease-out',
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: ['from-[#95a5a6] to-[#7f8c8d]'],
        success: ['from-game-green-light to-game-green-dark'],
        info: ['from-game-blue-light to-game-blue-dark'],
        warning: ['from-game-gold-light to-game-gold-dark'],
        danger: ['from-game-red-light to-game-red-dark'],
      },
      animated: {
        true: [
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent',
          'before:animate-[shimmer_2s_infinite]',
        ],
        false: '',
      },
    },
    defaultVariants: { variant: 'default', animated: false },
  }
);

// ↓ ICI: le label suit la taille
const labelVariants = cva(
  [
    'absolute inset-0',
    'flex items-center justify-center',
    'font-game font-bold',
    'text-white text-shadow-game',
    'pointer-events-none',
  ],
  {
    variants: {
      size: {
        sm: 'text-[9px]',
        md: 'text-xs',
        lg: 'text-sm',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface ProgressBarProps extends VariantProps<typeof progressBarVariants> {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressBar = ({
  value,
  label,
  showPercentage = false,
  animated = false,
  variant,
  size,
  className,
}: ProgressBarProps) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      <div className={progressBarVariants({ variant, size, className })}>
        <div
          className={progressFillVariants({ variant, animated: animated ? true : false })}
          style={{ width: `${clampedValue}%` }}
        />
        {(label || showPercentage) && (
          <div className={labelVariants({ size })}>
            {label || `${Math.round(clampedValue)}%`}
          </div>
        )}
      </div>
    </div>
  );
};