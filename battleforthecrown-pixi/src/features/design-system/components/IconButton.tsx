import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type IconButtonTone = 'success' | 'info' | 'danger' | 'warning' | 'neutral';

const toneClass: Record<IconButtonTone, string> = {
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a]',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6]',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b]',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017]',
  neutral: 'border-[#5d6d6e] bg-gradient-to-b from-[#95a5a6] to-[#7f8c8d]',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  showLabel?: boolean;
  tone?: IconButtonTone;
}

export function IconButton({ className, icon, label, showLabel = true, tone = 'neutral', ...props }: IconButtonProps) {
  return (
    <span className={cn('inline-flex flex-col items-center gap-1.5 font-game text-[10px] font-semibold text-[#5d4a32]', className)}>
      <button
        aria-label={label}
        className={cn(
          'grid size-11 place-items-center rounded-full border-2 text-white shadow-game-inset transition hover:brightness-110 active:translate-y-0.5',
          toneClass[tone],
        )}
        type="button"
        {...props}
      >
        {icon}
      </button>
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}
