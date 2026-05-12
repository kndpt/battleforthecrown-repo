import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BorderStrokeTone = 'wood2' | 'deep3' | 'parch4' | 'dashed';

export interface BorderStrokeTileProps extends HTMLAttributes<HTMLDivElement> {
  description: string;
  label: string;
  tone: BorderStrokeTone;
}

const toneClass: Record<BorderStrokeTone, string> = {
  wood2: 'border-2 border-[#8b7355]',
  deep3: 'border-[3px] border-[#3d2f1f]',
  parch4: 'border-4 border-[#8b7355]',
  dashed: 'border-[3px] border-dashed border-[#b45309]',
};

export function BorderStrokeTile({ className, description, label, tone, ...props }: BorderStrokeTileProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)} {...props}>
      <div className={cn('h-[50px] w-[90px] rounded-[10px] bg-[linear-gradient(to_bottom,#fef9f0,#d4c094)]', toneClass[tone])} />
      <span className="font-game text-[11px] font-bold text-[#1f2937]">{label}</span>
      <span className="font-mono text-[10px] text-[#5d4a32]">{description}</span>
    </div>
  );
}
