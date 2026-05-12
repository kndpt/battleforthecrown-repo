import type { HTMLAttributes, ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type TimerTone = 'gold' | 'blue' | 'red' | 'stone';
export type TimerSize = 'xs' | 'sm' | 'md' | 'lg' | 'mega';

export interface TimerProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  icon?: string;
  showIcon?: boolean;
  size?: TimerSize;
  tone?: TimerTone;
  urgent?: boolean;
}

export interface DigitTimerProps extends HTMLAttributes<HTMLSpanElement> {
  parts: [string, string, string];
}

const toneClass: Record<TimerTone, string> = {
  gold: 'border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878] text-[#5a4400] [text-shadow:0_1px_0_rgba(255,255,255,.5)]',
  blue: 'border-[#1f5288] bg-gradient-to-b from-[#cfe2f6] to-[#8eb2dc] text-[#102e58]',
  red: 'border-[#a93226] bg-gradient-to-b from-[#fbd5d0] to-[#e89c93] text-[#7a1d10]',
  stone: 'border-[#5d6d6e] bg-gradient-to-b from-[#dee3e6] to-[#aab4b8] text-[#2c3942]',
};

const sizeClass: Record<TimerSize, string> = {
  xs: 'px-[6px] py-0.5 text-[10px]',
  sm: 'px-[9px] py-1 text-[11px]',
  md: 'px-[11px] py-[5px] text-[13px]',
  lg: 'px-3.5 py-2 text-lg',
  mega: 'px-[18px] py-2.5 text-[28px] tracking-[0.02em]',
};

const iconClass: Record<TimerSize, string> = {
  xs: 'size-[13px]',
  sm: 'size-[13px]',
  md: 'size-[13px]',
  lg: 'size-[18px]',
  mega: 'size-6',
};

export function Timer({
  children,
  className,
  icon = '/assets/clock.png',
  showIcon = true,
  size = 'sm',
  tone = 'gold',
  urgent = false,
  ...props
}: TimerProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] rounded-full border-2 font-game font-bold tabular-nums',
        toneClass[tone],
        sizeClass[size],
        urgent ? 'animate-pulse' : '',
        className,
      )}
      {...props}
    >
      {showIcon ? <img alt="" className={cn('object-contain', iconClass[size])} src={publicAsset(icon)} /> : null}
      {children}
    </span>
  );
}

export function DigitTimer({ className, parts, ...props }: DigitTimerProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-[3px]', className)} {...props}>
      {parts.map((part, index) => (
        <span className="contents" key={`${part}-${index}`}>
          {index > 0 ? <span className="font-game font-bold text-[#3d2f1f]">:</span> : null}
          <span className="rounded bg-[#1a1a1a] px-[5px] py-0.5 font-game text-lg font-extrabold tabular-nums text-white [text-shadow:0_0_6px_rgba(241,196,15,.6)]">
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}
