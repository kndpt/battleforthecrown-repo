import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

type RequirementState = 'locked' | 'done' | 'soon' | 'current';

const stateClass: Record<RequirementState, string> = {
  locked: 'border-[#5d6d6e] bg-gradient-to-b from-[#bfc7cb] to-[#7f8c8d] text-[#1f2933]',
  done: 'border-[#3a6c1f] bg-gradient-to-b from-[#a8d28d] to-[#4a8c2a] text-white text-shadow-game',
  soon: 'border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878] text-[#5a4400]',
  current: 'border-[#1f5288] bg-gradient-to-b from-[#cfe2f6] to-[#8eb2dc] text-[#102e58]',
};

export interface RequirementChipProps {
  children: ReactNode;
  className?: string;
  icon: string;
  state?: RequirementState;
  status?: ReactNode;
}

export function RequirementChip({
  children,
  className,
  icon,
  state = 'locked',
  status,
}: RequirementChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 py-1 pl-1.5 pr-2.5 font-game text-xs font-semibold',
        stateClass[state],
        className,
      )}
    >
      <img alt="" className="size-[18px] object-contain" src={publicAsset(icon)} />
      {children}
      {status ? <span className="ml-auto text-[11px] font-bold">{status}</span> : null}
    </span>
  );
}
