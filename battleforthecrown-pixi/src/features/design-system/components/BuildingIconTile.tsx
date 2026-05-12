import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface BuildingIconTileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  icon: string;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export function BuildingIconTile({ className, icon, label, onClick, ...props }: BuildingIconTileProps) {
  const content = (
    <>
      <span className="flex size-[78px] items-center justify-center rounded-[14px] border-[3px] border-[#5d4a32] bg-[radial-gradient(circle_at_50%_35%,#f4e4c1,#c9a882_80%)] shadow-[0_3px_0_rgba(0,0,0,.25),inset_0_2px_0_rgba(255,255,255,.3)]">
        <img alt="" className="size-[62px] object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]" src={publicAsset(icon)} />
      </span>
      <span className="font-game text-[11px] font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={label}
        className={cn('flex flex-col items-center gap-1.5', className)}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)} {...props}>
      {content}
    </div>
  );
}
