import type { ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type SegmentedControlSize = 'compact' | 'default' | 'tabs';
export type SegmentedControlTone = 'parchment' | 'dark';

export interface SegmentedControlOption {
  badge?: string;
  icon?: string;
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  size?: SegmentedControlSize;
  tone?: SegmentedControlTone;
  value: string;
}

const sizeClass: Record<SegmentedControlSize, string> = {
  compact: 'px-[9px] py-[3px] text-[11px]',
  default: 'px-3.5 py-[5px] text-xs',
  tabs: 'px-[18px] py-2 text-[13px]',
};

export function SegmentedControl({
  ariaLabel,
  className,
  onChange,
  options,
  size = 'default',
  tone = 'parchment',
  value,
}: SegmentedControlProps) {
  const dark = tone === 'dark';

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'inline-flex gap-[3px] rounded-[10px] border-2 p-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,.18)]',
        dark ? 'border-[#0a0a0a] bg-[rgba(0,0,0,.4)]' : 'border-[#8b7355] bg-[rgba(0,0,0,.08)]',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            className={cn(
              'inline-flex cursor-pointer appearance-none items-center gap-[5px] rounded-[7px] border-0 bg-transparent font-game font-bold',
              dark ? 'text-[#cdb88a]' : 'text-[#6d5838]',
              sizeClass[size],
              active
                ? dark
                  ? 'bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]'
                  : 'bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_1px_0_rgba(0,0,0,.18)]'
                : '',
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon ? <img alt="" className="size-5 object-contain" src={publicAsset(option.icon)} /> : null}
            {option.label}
            {option.badge ? (
              <span className="ml-0.5 rounded-full border border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] px-1.5 py-px text-[10px] font-extrabold text-white">
                {option.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function DarkSegmentedStage({ children }: { children: ReactNode }) {
  return <div className="rounded-[10px] bg-gradient-to-b from-[#3c2619] to-[#5d4a32] px-3 py-2.5">{children}</div>;
}
