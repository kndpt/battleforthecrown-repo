import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type SurfaceTileTone = 'appBackdrop' | 'flatParchment' | 'landingRadial' | 'bottomNav';

export interface SurfaceTileProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  label: string;
  tone: SurfaceTileTone;
}

const toneClass: Record<SurfaceTileTone, string> = {
  appBackdrop: 'border-[#0c0c1a] bg-[#1a1a2e] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.7)]',
  flatParchment: 'border-[#a98c64] bg-[#d2b48c] text-[#2a2118] [text-shadow:none]',
  landingRadial: 'border-[#8b7355] bg-[linear-gradient(135deg,#e8d5b7,#f5e6d3,#d4c094)] text-[#3a2a18] [text-shadow:none]',
  bottomNav: 'border-[#8b7355] bg-[linear-gradient(to_top,#3c2619_0%,#4e3822_45%,#6b4b2b_100%)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.7)]',
};

export function SurfaceTile({ className, code, label, tone, ...props }: SurfaceTileProps) {
  return (
    <div
      className={cn(
        'flex h-40 min-w-[140px] flex-1 flex-col justify-end rounded-[14px] border-2 px-3 py-2.5 font-game text-[13px] font-bold',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      <span>{label}</span>
      <code className="block font-mono text-[10px] font-medium opacity-[.85]">{code}</code>
    </div>
  );
}
