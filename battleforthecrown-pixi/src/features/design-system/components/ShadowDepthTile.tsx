import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ShadowDepthTone = 'flat2' | 'card' | 'cardRim' | 'inset' | 'glow';

export interface ShadowDepthTileProps extends HTMLAttributes<HTMLDivElement> {
  description: string;
  label: string;
  tone: ShadowDepthTone;
}

const shadowClass: Record<ShadowDepthTone, string> = {
  flat2: 'shadow-[0_2px_0_rgba(0,0,0,.18)]',
  card: 'shadow-[0_4px_0_rgba(0,0,0,.22),0_6px_14px_rgba(0,0,0,.28)]',
  cardRim: 'shadow-[0_4px_0_rgba(0,0,0,.22),0_6px_14px_rgba(0,0,0,.28),inset_0_2px_0_rgba(255,255,255,.25)]',
  inset: 'bg-[linear-gradient(to_bottom,#5d4a32,#3c2619)] shadow-[inset_0_2px_4px_rgba(0,0,0,.30),inset_0_-2px_4px_rgba(0,0,0,.30)]',
  glow: 'shadow-[0_0_0_3px_rgba(246,213,123,.55),0_0_16px_rgba(250,224,120,.6)]',
};

export function ShadowDepthTile({ className, description, label, tone, ...props }: ShadowDepthTileProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)} {...props}>
      <div
        className={cn(
          'h-[60px] w-[90px] rounded-[10px] border-[3px] border-[#3d2f1f] bg-[linear-gradient(to_bottom,#a67c52,#7d5a3a)]',
          shadowClass[tone],
        )}
      />
      <span className="font-game text-[11px] font-bold text-[#1f2937]">{label}</span>
      <span className="max-w-[120px] text-center font-mono text-[9px] text-[#5d4a32]">{description}</span>
    </div>
  );
}
