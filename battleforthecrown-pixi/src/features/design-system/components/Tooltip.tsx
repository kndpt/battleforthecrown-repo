import { ReactNode, useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type TooltipPosition = 'top' | 'right';
export type TooltipTone = 'parchment' | 'dark';

export interface TooltipStat {
  label: ReactNode;
  value: ReactNode;
}

export interface BftcTooltipProps {
  children: ReactNode;
  className?: string;
  flavor?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  position?: TooltipPosition;
  stats?: TooltipStat[];
  title: ReactNode;
  tone?: TooltipTone;
}

const toneClass: Record<TooltipTone, string> = {
  parchment: 'border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] text-[#3d2f1f]',
  dark: 'border-[#0a0a0a] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] text-[#f5e6d3]',
};

const arrowOuterClass: Record<TooltipPosition, string> = {
  top: 'left-1/2 top-full -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent border-t-[#5d4a32]',
  right:
    'right-full top-1/2 -translate-y-1/2 border-y-[7px] border-r-[7px] border-y-transparent border-r-[#5d4a32]',
};

const arrowInnerClass: Record<TooltipPosition, string> = {
  top: 'left-1/2 top-[calc(100%-2px)] -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent',
  right:
    'right-[calc(100%-2px)] top-1/2 -translate-y-1/2 border-y-[6px] border-r-[6px] border-y-transparent',
};

const positionClass: Record<TooltipPosition, string> = {
  top: 'bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2',
  right: 'left-[calc(100%+14px)] top-1/2 -translate-y-1/2',
};

export function BftcTooltip({
  children,
  className,
  flavor,
  onOpenChange,
  open,
  position = 'top',
  stats = [],
  title,
  tone = 'parchment',
}: BftcTooltipProps) {
  const tooltipId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const innerArrowColor =
    tone === 'dark' ? 'border-t-[#1a1a1a] border-r-[#1a1a1a]' : 'border-t-[#f5e6d3] border-r-[#f5e6d3]';
  const outerArrowColor = tone === 'dark' ? 'border-t-[#0a0a0a] border-r-[#0a0a0a]' : '';

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <span
      aria-describedby={isOpen ? tooltipId : undefined}
      className={cn('relative inline-flex flex-col items-center gap-2', className)}
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      tabIndex={0}
    >
      {isOpen ? (
        <span
          className={cn(
            'absolute z-20 min-w-[160px] rounded-[10px] border-2 px-2.5 py-2 font-game shadow-[0_6px_18px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.55)]',
            toneClass[tone],
            positionClass[position],
          )}
          id={tooltipId}
          role="tooltip"
        >
          <span className={cn('mb-0.5 block text-[13px] font-bold', tone === 'dark' && 'text-[#f6d57b]')}>
            {title}
          </span>
          {stats.length > 0 ? (
            <span className="grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5 text-[10.5px]">
              {stats.map((stat, index) => (
                <span className="contents" key={index}>
                  <span className={cn(tone === 'dark' ? 'text-[#d4c094]' : 'text-[#6d5838]')}>{stat.label}</span>
                  <span className="text-right font-bold tabular-nums">{stat.value}</span>
                </span>
              ))}
            </span>
          ) : null}
          {flavor ? <span className="mt-1 block text-[10px] italic leading-snug text-[#7d5a3a]">{flavor}</span> : null}
          <span className={cn('absolute size-0', arrowOuterClass[position], outerArrowColor)} />
          <span className={cn('absolute z-10 size-0', arrowInnerClass[position], innerArrowColor)} />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export interface TooltipTargetProps {
  icon: string;
  label?: ReactNode;
}

export function TooltipTarget({ icon, label }: TooltipTargetProps) {
  return (
    <>
      <span className="flex size-[54px] items-center justify-center rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_3px_0_rgba(0,0,0,0.18)]">
        <img alt="" className="size-10 object-contain" src={publicAsset(icon)} />
      </span>
      {label ? <span className="font-game text-[11px] font-semibold text-[#5d4a32]">{label}</span> : null}
    </>
  );
}
