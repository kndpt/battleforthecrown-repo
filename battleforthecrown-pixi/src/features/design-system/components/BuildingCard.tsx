import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type BuildingCardSurface = 'parchment' | 'wood' | 'stone' | 'default';
export type BuildingCardActionTone = 'success' | 'info' | 'neutral';

export interface BuildingCardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  actionDisabled?: boolean;
  actionLabel: string;
  actionTone?: BuildingCardActionTone;
  icon: string;
  iconMuted?: boolean;
  onAction?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  surface?: BuildingCardSurface;
  title: string;
}

const surfaceClass: Record<BuildingCardSurface, string> = {
  parchment: 'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f5e6d3)] text-[#1f2937]',
  wood: 'border-[#3d2f1f] bg-[linear-gradient(to_bottom,#a67c52,#7d5a3a)] text-[#f5f3e8]',
  stone: 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#b0b8c0,#7d8a92)] text-[#f5f3e8]',
  default: 'border-[#8b7355] bg-[linear-gradient(to_bottom,#d4c094,#c9a882)] text-[#1f2937]',
};

const actionToneClass: Record<BuildingCardActionTone, string> = {
  success: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
  info: 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]',
  neutral: 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)]',
};

export function BuildingCard({
  actionDisabled = false,
  actionLabel,
  actionTone = 'success',
  className,
  icon,
  iconMuted = false,
  onAction,
  surface = 'parchment',
  title,
  ...props
}: BuildingCardProps) {
  return (
    <article
      className={cn(
        'flex h-[200px] w-40 flex-col overflow-hidden rounded-[14px] border-4 shadow-[0_4px_0_rgba(0,0,0,.22),0_6px_14px_rgba(0,0,0,.28),inset_0_2px_0_rgba(255,255,255,.25)]',
        surfaceClass[surface],
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 items-center justify-center border-b-2 border-[rgba(0,0,0,.2)] bg-[linear-gradient(to_bottom_right,rgba(255,255,255,.1),rgba(0,0,0,.1))]">
        <img
          alt=""
          className={cn('size-[78px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,.3)]', iconMuted ? '[filter:grayscale(1)_opacity(.8)]' : '')}
          src={publicAsset(icon)}
        />
      </div>
      {/* A enrichir avant usage production: couts, durees, pre-requis et etat de file manquent dans la maquette source. */}
      <div className="px-1 py-1.5 text-center font-game text-xs font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]">{title}</div>
      <div className="flex justify-center px-1.5 pb-1.5">
        <button
          className={cn(
            'inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-2 px-1.5 py-[5px] font-game text-[11px] font-bold tracking-[.02em] text-white shadow-[0_2px_0_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.25)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
            actionToneClass[actionTone],
            actionDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
          disabled={actionDisabled}
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
