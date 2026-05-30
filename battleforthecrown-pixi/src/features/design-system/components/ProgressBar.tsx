import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { clamp } from '@/lib/math';

export type ProgressBarTone = 'green' | 'gold' | 'red';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  label: string;
  suffix: string;
  tone?: ProgressBarTone;
  value: number;
}

const toneClass: Record<ProgressBarTone, string> = {
  green: 'bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a]',
  gold: 'bg-gradient-to-b from-[#f1c40f] to-[#d4a017]',
  red: 'bg-gradient-to-b from-[#e74c3c] to-[#c0392b]',
};

export function ProgressBar({ animated = true, className, label, suffix, tone = 'green', value, ...props }: ProgressBarProps) {
  const boundedValue = clamp(value, 0, 100);

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} {...props}>
      <div className="flex justify-between font-game text-[11px] font-semibold text-[#5d4a32]">
        <span>{label}</span>
        <b className="font-game font-bold tabular-nums text-[#1f2937]">{suffix}</b>
      </div>
      <div className="relative h-[18px] overflow-hidden rounded-[9px] border-2 border-[rgba(0,0,0,.18)] bg-[rgba(0,0,0,.15)] shadow-[inset_0_2px_3px_rgba(0,0,0,.25)]">
        <div className={cn('relative h-full overflow-hidden', toneClass[tone])} style={{ width: `${boundedValue}%` }}>
          {animated ? <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(to_right,transparent,rgba(255,255,255,.35),transparent)]" /> : null}
        </div>
      </div>
    </div>
  );
}
