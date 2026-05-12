import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ColorSwatchTileProps extends HTMLAttributes<HTMLDivElement> {
  color: string;
  label: string;
  value: string;
}

export function ColorSwatchTile({ className, color, label, style, value, ...props }: ColorSwatchTileProps) {
  return (
    <div className={cn('flex w-[62px] flex-col items-stretch', className)} {...props}>
      <div
        className="h-14 rounded-[8px_8px_4px_4px] border border-[rgba(0,0,0,.12)] shadow-[inset_0_-8px_12px_rgba(0,0,0,.06)]"
        style={{ background: color, ...style }}
      />
      <div className="flex flex-col items-center pt-1.5 font-game">
        <b className="text-[11px] font-bold text-[#1f2937]">{label}</b>
        <code className="font-mono text-[9px] text-[#5d4a32]">{value}</code>
      </div>
    </div>
  );
}
