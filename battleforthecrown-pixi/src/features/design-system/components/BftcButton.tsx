import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BftcButtonVariant = 'success' | 'info' | 'danger' | 'warning' | 'neutral';
export type BftcButtonSize = 'xs' | 'md' | 'lg';
export type BftcButtonState = 'default' | 'hover' | 'pressed' | 'disabled';

export interface BftcButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: BftcButtonSize;
  state?: BftcButtonState;
  variant?: BftcButtonVariant;
}

const variantClass: Record<BftcButtonVariant, string> = {
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a]',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6]',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b]',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00] [text-shadow:none]',
  neutral: 'border-[#5d6d6e] bg-gradient-to-b from-[#95a5a6] to-[#7f8c8d]',
};

const sizeClass: Record<BftcButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px]',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-lg',
};

const stateClass: Record<BftcButtonState, string> = {
  default: '',
  hover: 'brightness-110',
  pressed: 'translate-y-0.5 shadow-game-pressed',
  disabled: 'cursor-not-allowed opacity-50',
};

export function BftcButton({
  children,
  className,
  disabled,
  size = 'md',
  state = disabled ? 'disabled' : 'default',
  type = 'button',
  variant = 'success',
  ...props
}: BftcButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center gap-[6px] rounded-[10px] border-2 font-game font-bold tracking-[0.02em] text-white shadow-[0_2px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] [text-shadow:1px_1px_2px_rgba(0,0,0,0.6)]',
        variantClass[variant],
        sizeClass[size],
        stateClass[state],
        className,
      )}
      disabled={disabled || state === 'disabled'}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
