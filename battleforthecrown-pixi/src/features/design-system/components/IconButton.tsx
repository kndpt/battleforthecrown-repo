import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type IconButtonTone = 'success' | 'danger' | 'info' | 'neutral' | 'warning';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  label: string;
  showLabel?: boolean;
  tone?: IconButtonTone;
}

const toneClass: Record<IconButtonTone, string> = {
  success: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
  danger: 'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  info: 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]',
  neutral: 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)]',
  warning: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]',
};

export function IconButton({
  className,
  disabled = false,
  icon,
  label,
  showLabel = true,
  tone = 'success',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex flex-col items-center gap-1.5 font-game text-[10px] text-[#5d4a32]',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-full border-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4)]',
          '[&_svg]:size-5 [&_svg]:fill-none [&_svg]:stroke-white [&_svg]:stroke-2 [&_svg]:drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]',
          toneClass[tone],
        )}
      >
        {icon}
      </span>
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
