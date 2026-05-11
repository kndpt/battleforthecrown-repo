import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedControlOption<TValue extends string> {
  badge?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  value: TValue;
}

export interface SegmentedControlProps<TValue extends string> {
  ariaLabel: string;
  className?: string;
  onChange: (value: TValue) => void;
  options: SegmentedControlOption<TValue>[];
  size?: 'sm' | 'md';
  value: TValue;
}

export function SegmentedControl<TValue extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  size = 'md',
  value,
}: SegmentedControlProps<TValue>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'inline-flex overflow-hidden rounded-xl border-2 border-[#5d4a32] bg-[#3d2f1f] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[9px] font-game font-bold transition',
              size === 'sm' ? 'min-h-[30px] px-2 text-[11px]' : 'min-h-[38px] px-3 text-sm',
              active
                ? 'bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] text-[#3d2f1f] shadow-[0_1px_0_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.6)]'
                : 'text-[#f5e6d3] hover:bg-white/10 disabled:opacity-45',
            )}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            <span>{option.label}</span>
            {option.badge}
          </button>
        );
      })}
    </div>
  );
}
