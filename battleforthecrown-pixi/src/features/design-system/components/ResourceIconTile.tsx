import type { HTMLAttributes } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type ResourceIconTileTone = 'default' | 'premium';

export interface ResourceIconTileProps extends HTMLAttributes<HTMLDivElement> {
  icon: string;
  label: string;
  tone?: ResourceIconTileTone;
}

const toneClass: Record<ResourceIconTileTone, string> = {
  default: 'border-[#8b7355]',
  premium: 'border-[#9e7b0d]',
};

export function ResourceIconTile({ className, icon, label, tone = 'default', ...props }: ResourceIconTileProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)} {...props}>
      <div
        className={cn(
          'flex size-[62px] items-center justify-center rounded-full border-[3px] bg-[rgba(0,0,0,.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,.4)]',
          toneClass[tone],
        )}
      >
        <img
          alt=""
          className="size-[42px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]"
          src={publicAsset(icon)}
        />
      </div>
      <span className="font-game text-[11px] font-bold text-[#f5e6d3] [text-shadow:1px_1px_2px_rgba(0,0,0,.7)]">{label}</span>
    </div>
  );
}
