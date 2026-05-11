import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

type CostSize = 'md' | 'lg';

export interface CostPillProps {
  current?: string;
  icon: string;
  insufficient?: boolean;
  size?: CostSize;
  value: string;
}

const sizeClass: Record<CostSize, string> = {
  md: 'gap-1 py-[3px] pl-1 pr-2 text-[13px] [&_img]:size-[18px]',
  lg: 'gap-1 py-[5px] pl-[5px] pr-[11px] text-[15px] [&_img]:size-[22px]',
};

export function CostPill({
  current,
  icon,
  insufficient = false,
  size = 'md',
  value,
}: CostPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-game font-bold tabular-nums',
        insufficient
          ? 'border-[#a93226] bg-gradient-to-b from-[#e74c3c]/20 to-[#e74c3c]/10 text-[#a93226]'
          : 'border-black/20 bg-black/[0.06] text-[#3d2f1f]',
        sizeClass[size],
      )}
    >
      <img alt="" src={publicAsset(icon)} />
      {value}
      {current ? (
        <span className={cn('font-medium opacity-70', insufficient && 'text-[#e74c3c]')}>
          / {current}
        </span>
      ) : null}
    </span>
  );
}

export interface CostRowProps {
  children: ReactNode;
  className?: string;
}

export function CostRow({ children, className }: CostRowProps) {
  return <div className={cn('flex flex-wrap items-center gap-1.5', className)}>{children}</div>;
}
