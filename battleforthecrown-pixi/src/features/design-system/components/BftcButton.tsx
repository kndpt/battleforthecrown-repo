import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BftcButtonVariant = 'success' | 'info' | 'danger' | 'warning' | 'neutral';
type BftcButtonSize = 'xs' | 'md' | 'lg';

const variantClass: Record<BftcButtonVariant, string> = {
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] text-white text-shadow-game',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] text-white text-shadow-game',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white text-shadow-game',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]',
  neutral: 'border-[#5d6d6e] bg-gradient-to-b from-[#95a5a6] to-[#7f8c8d] text-white text-shadow-game',
};

const sizeClass: Record<BftcButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px]',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-lg',
};

export interface BftcButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: BftcButtonSize;
  variant?: BftcButtonVariant;
}

export function BftcButton({
  children,
  className,
  size = 'md',
  variant = 'success',
  ...props
}: BftcButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-2 font-game font-bold tracking-[0.02em]',
        'shadow-[0_2px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] transition duration-100 ease-in-out',
        'hover:brightness-110 active:translate-y-0.5 active:shadow-game-pressed disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
