import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'default' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

const toneClass: Record<BadgeTone, string> = {
  default: 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] text-[#3d2f1f]',
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] text-white text-shadow-game',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] text-white text-shadow-game',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white text-shadow-game',
  neutral: 'border-[#5d6d6e] bg-gradient-to-b from-[#95a5a6] to-[#7f8c8d] text-white text-shadow-game',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[9px]',
  md: 'px-2 py-0.5 text-[10px]',
  lg: 'px-2.5 py-1 text-xs',
};

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  size?: BadgeSize;
  tone?: BadgeTone;
}

export function Badge({ children, className, size = 'md', tone = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border-2 font-game font-bold uppercase tracking-[0.08em]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]',
        toneClass[tone],
        sizeClass[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
