import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

type TimerVariant = 'gold' | 'blue' | 'red' | 'stone';
type TimerSize = 'xs' | 'sm' | 'md' | 'lg' | 'mega';

const variantClass: Record<TimerVariant, string> = {
  gold: 'border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878] text-[#5a4400] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]',
  blue: 'border-[#1f5288] bg-gradient-to-b from-[#cfe2f6] to-[#8eb2dc] text-[#102e58]',
  red: 'border-[#a93226] bg-gradient-to-b from-[#fbd5d0] to-[#e89c93] text-[#7a1d10]',
  stone: 'border-[#5d6d6e] bg-gradient-to-b from-[#dee3e6] to-[#aab4b8] text-[#2c3942]',
};

const sizeClass: Record<TimerSize, string> = {
  xs: 'gap-1 px-1.5 py-0.5 text-[10px] [&_img]:size-[13px]',
  sm: 'gap-1 px-[9px] py-1 text-[11px] [&_img]:size-[13px]',
  md: 'gap-1 px-[11px] py-[5px] text-[13px] [&_img]:size-[13px]',
  lg: 'gap-1.5 px-3.5 py-2 text-lg [&_img]:size-[18px]',
  mega: 'gap-2 px-[18px] py-2.5 text-[28px] tracking-[0.02em] [&_img]:size-6',
};

export interface TimerProps {
  children: ReactNode;
  className?: string;
  icon?: string;
  showIcon?: boolean;
  size?: TimerSize;
  urgent?: boolean;
  variant?: TimerVariant;
}

export function Timer({
  children,
  className,
  icon = '/assets/clock.png',
  showIcon = true,
  size = 'sm',
  urgent = false,
  variant = 'gold',
}: TimerProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border-2 font-game font-bold tabular-nums',
        urgent && 'animate-[bftc-pulse_1.2s_ease-in-out_infinite]',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {showIcon ? <img alt="" src={publicAsset(icon)} /> : null}
      {children}
    </span>
  );
}

export interface DigitTimerProps {
  parts: [string, string, string];
}

export function DigitTimer({ parts }: DigitTimerProps) {
  return (
    <span className="inline-flex items-baseline gap-[3px]">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="contents">
          {index > 0 ? <span className="font-game font-bold text-[#3d2f1f]">:</span> : null}
          <span className="rounded bg-[#1a1a1a] px-[5px] py-0.5 font-game text-lg font-extrabold tabular-nums text-white [text-shadow:0_0_6px_rgba(241,196,15,0.6)]">
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}
