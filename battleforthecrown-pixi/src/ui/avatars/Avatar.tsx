import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  [
    'relative',
    'inline-flex items-center justify-center',
    'font-game font-bold',
    'text-white text-shadow-game',
    'rounded-full',
    'border-2',
    'overflow-hidden',
    'transition-all duration-150',
    'shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-[#8b6f47] to-[#6d5838]',
          'border-[#5d4a32]',
        ],
        stone: [
          'bg-gradient-to-b from-game-stone-light to-game-stone-dark',
          'border-game-stone-border',
        ],
        gold: [
          'bg-gradient-to-b from-game-gold-light to-game-gold-dark',
          'border-game-gold-border',
        ],
        success: [
          'bg-gradient-to-b from-game-green-light to-game-green-dark',
          'border-game-green-border',
        ],
        info: [
          'bg-gradient-to-b from-game-blue-light to-game-blue-dark',
          'border-game-blue-border',
        ],
        danger: [
          'bg-gradient-to-b from-game-red-light to-game-red-dark',
          'border-game-red-border',
        ],
      },
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl',
        '3xl': 'w-24 h-24 text-3xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    src, 
    alt = '', 
    fallback, 
    variant = 'default', 
    size = 'md',
    className = '',
    ...props 
  }, ref) => {
    const getFallbackText = () => {
      if (fallback) return fallback.slice(0, 2).toUpperCase();
      if (alt) return alt.slice(0, 2).toUpperCase();
      return '?';
    };

    return (
      <div 
        ref={ref}
        className={avatarVariants({ variant, size, className })}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center">
          {getFallbackText()}
        </span>
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
