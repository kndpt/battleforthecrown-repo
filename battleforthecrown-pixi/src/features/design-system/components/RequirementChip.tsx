import type { HTMLAttributes, ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type RequirementChipState = 'locked' | 'soon' | 'current' | 'done';

export interface RequirementChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  icon: string;
  state?: RequirementChipState;
  status?: string;
}

const stateClass: Record<RequirementChipState, string> = {
  locked: 'border-[#5d6d6e] bg-gradient-to-b from-[#bfc7cb] to-[#7f8c8d] text-[#1f2933]',
  soon: 'border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878] text-[#5a4400]',
  current: 'border-[#1f5288] bg-gradient-to-b from-[#cfe2f6] to-[#8eb2dc] text-[#102e58]',
  done: 'border-[#3a6c1f] bg-gradient-to-b from-[#a8d28d] to-[#4a8c2a] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]',
};

export function RequirementChip({
  children,
  className,
  icon,
  state = 'locked',
  status,
  ...props
}: RequirementChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 pl-1.5 font-game text-xs font-semibold',
        stateClass[state],
        status ? 'w-full pr-3' : '',
        className,
      )}
      {...props}
    >
      <img alt="" className="size-[18px] object-contain" src={publicAsset(icon)} />
      {children}
      {status ? <span className="ml-auto font-game text-[11px] font-bold">{status}</span> : null}
    </span>
  );
}
