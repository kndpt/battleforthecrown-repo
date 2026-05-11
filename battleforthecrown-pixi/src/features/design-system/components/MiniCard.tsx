import { BftcButton, type BftcButtonProps } from './BftcButton';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type MiniCardTone = 'parchment' | 'wood' | 'stone' | 'default';

const toneClass: Record<MiniCardTone, string> = {
  parchment: 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3]',
  wood: 'border-[#3d2f1f] bg-gradient-to-b from-[#a67c52] to-[#7d5a3a]',
  stone: 'border-[#5d6d6e] bg-gradient-to-b from-[#b0b8c0] to-[#7d8a92]',
  default: 'border-[#8b7355] bg-gradient-to-b from-[#d4c094] to-[#c9a882]',
};

export interface MiniCardProps {
  actionLabel: string;
  actionVariant?: BftcButtonProps['variant'];
  className?: string;
  icon: string;
  locked?: boolean;
  onAction?: () => void;
  title: string;
  tone?: MiniCardTone;
}

export function MiniCard({ actionLabel, actionVariant = 'success', className, icon, locked, onAction, title, tone = 'parchment' }: MiniCardProps) {
  return (
    <article className={cn('flex h-[200px] w-40 flex-col overflow-hidden rounded-[14px] border-4 shadow-[0_4px_0_rgba(0,0,0,.22),0_6px_14px_rgba(0,0,0,.28),inset_0_2px_0_rgba(255,255,255,.25)]', toneClass[tone], className)}>
      <div className="flex flex-1 items-center justify-center border-b-2 border-black/20 bg-gradient-to-br from-white/10 to-black/10">
        <img alt="" className={cn('size-[78px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,.3)]', locked ? 'grayscale opacity-70' : '')} src={publicAsset(icon)} />
      </div>
      <h3 className="px-1 py-1.5 text-center font-game text-xs font-bold text-white text-shadow-game">{title}</h3>
      <div className="px-1.5 pb-1.5">
        <BftcButton className="w-full text-[11px]" disabled={locked} onClick={onAction} size="xs" variant={locked ? 'neutral' : actionVariant}>
          {actionLabel}
        </BftcButton>
      </div>
    </article>
  );
}
