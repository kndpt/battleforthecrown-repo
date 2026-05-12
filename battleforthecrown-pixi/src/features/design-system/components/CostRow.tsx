import type { HTMLAttributes, ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type CostPillSize = 'md' | 'lg';

export interface CostPillProps extends HTMLAttributes<HTMLSpanElement> {
  current?: string;
  icon: string;
  insufficient?: boolean;
  size?: CostPillSize;
  value: string;
}

export interface CostRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const sizeClass: Record<CostPillSize, string> = {
  md: 'px-2 py-[3px] pl-1 text-[13px] [&_img]:size-[18px]',
  lg: 'px-[11px] py-[5px] pl-[5px] text-[15px] [&_img]:size-[22px]',
};

export function CostPill({
  className,
  current,
  icon,
  insufficient = false,
  size = 'md',
  value,
  ...props
}: CostPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-[1.5px] bg-[rgba(0,0,0,.06)] font-game font-bold tabular-nums text-[#3d2f1f] border-black/18',
        insufficient
          ? 'border-[#a93226] bg-gradient-to-b from-[rgba(231,76,60,.18)] to-[rgba(231,76,60,.08)] text-[#a93226]'
          : '',
        sizeClass[size],
        className,
      )}
      {...props}
    >
      <img alt="" className="object-contain" src={publicAsset(icon)} />
      {value}
      {current ? <span className={cn('font-medium opacity-[.7]', insufficient ? 'text-[#e74c3c]' : '')}>/ {current}</span> : null}
    </span>
  );
}

export function CostRow({ children, className, ...props }: CostRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} {...props}>
      {children}
    </div>
  );
}
