import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type RadiusTileTone = 'sm' | 'md' | 'lg' | 'xl' | 'pill';

export interface RadiusTileProps extends HTMLAttributes<HTMLDivElement> {
  description: string;
  label: string;
  tone: RadiusTileTone;
}

const radiusClass: Record<RadiusTileTone, string> = {
  sm: 'rounded-[6px]',
  md: 'rounded-[10px]',
  lg: 'rounded-[14px]',
  xl: 'rounded-[18px]',
  pill: 'rounded-full',
};

export function RadiusTile({ className, description, label, tone, ...props }: RadiusTileProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)} {...props}>
      <div
        className={cn(
          'size-20 border-[3px] border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#d4c094)] shadow-[0_3px_0_rgba(0,0,0,.18)]',
          radiusClass[tone],
        )}
      />
      <span className="font-game text-xs font-bold text-[#1f2937]">{label}</span>
      <span className="font-mono text-[10px] text-[#5d4a32]">{description}</span>
    </div>
  );
}
