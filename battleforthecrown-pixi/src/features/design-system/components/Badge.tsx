import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'default' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  size?: BadgeSize;
  tone?: BadgeTone;
}

const toneClass: Record<BadgeTone, string> = {
  default: 'border-[#3d2f1f] bg-gradient-to-b from-[#8b6f47] to-[#5d4a32]',
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a]',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6]',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00] [text-shadow:none]',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b]',
  neutral: 'border-[#5d6d6e] bg-gradient-to-b from-[#95a5a6] to-[#7f8c8d]',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'h-[19px] min-w-[19px] px-1 text-[10px]',
  md: 'h-[23px] min-w-[23px] px-[6px] text-[11.5px]',
  lg: 'h-7 min-w-7 px-2 text-sm',
};

export function Badge({ children, className, size = 'md', tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border-2 font-game font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_1px_rgba(0,0,0,0.25)] [text-shadow:1px_1px_2px_rgba(0,0,0,0.4)]',
        toneClass[tone],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
