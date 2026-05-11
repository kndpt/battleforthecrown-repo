import { cn } from '@/lib/cn';

type ProgressVariant = 'green' | 'gold' | 'red' | 'blue';

const fillClass: Record<ProgressVariant, string> = {
  green: 'from-[#6ebf49] to-[#4a8c2a]',
  gold: 'from-[#f1c40f] to-[#d4a017]',
  red: 'from-[#e74c3c] to-[#c0392b]',
  blue: 'from-[#5b9bd5] to-[#2e75b6]',
};

export interface ProgressBarProps {
  className?: string;
  label?: string;
  shimmer?: boolean;
  suffix?: string;
  value: number;
  variant?: ProgressVariant;
}

export function ProgressBar({
  className,
  label,
  shimmer = true,
  suffix,
  value,
  variant = 'green',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label || suffix ? (
        <div className="flex justify-between font-game text-[11px] font-semibold text-[#5d4a32]">
          <span>{label}</span>
          <b className="font-bold tabular-nums text-[#1f2937]">{suffix}</b>
        </div>
      ) : null}
      <div className="relative h-[18px] overflow-hidden rounded-[9px] border-2 border-black/20 bg-black/15 shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]">
        <div
          className={cn('relative h-full bg-gradient-to-b', fillClass[variant])}
          style={{ width: `${clampedValue}%` }}
        >
          {shimmer ? (
            <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
