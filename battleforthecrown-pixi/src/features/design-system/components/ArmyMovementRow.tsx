import { BftcButton } from './BftcButton';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type ArmyMovementTone = 'attack' | 'defend' | 'return' | 'scout';

const toneClass: Record<ArmyMovementTone, string> = {
  attack: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c]/25 to-black/40',
  defend: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5]/30 to-black/40',
  return: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49]/25 to-black/40',
  scout: 'border-[#7f8c8d] bg-gradient-to-b from-[#95a5a6]/25 to-black/40',
};

const progressVariant: Record<ArmyMovementTone, 'red' | 'blue' | 'green' | 'gold'> = {
  attack: 'red',
  defend: 'blue',
  return: 'green',
  scout: 'gold',
};

export interface ArmyMovementRowProps {
  actionLabel?: string;
  className?: string;
  icon: string;
  incoming?: boolean;
  onAction?: () => void;
  progress: number;
  subtitle: string;
  time: string;
  title: string;
  tone: ArmyMovementTone;
}

export function ArmyMovementRow({ actionLabel, className, icon, incoming, onAction, progress, subtitle, time, title, tone }: ArmyMovementRowProps) {
  return (
    <article className={cn('grid grid-cols-[36px_1fr_auto] items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-[#f5e6d3] shadow-[inset_0_1px_0_rgba(255,255,255,.18)]', toneClass[tone], incoming ? 'animate-[bftc-pulse_1.5s_ease-in-out_infinite]' : '', className)}>
      <div className="grid size-9 place-items-center rounded-full border-2 border-black/30 bg-black/25">
        <img alt="" className="size-6 object-contain" src={publicAsset(icon)} />
      </div>
      <div className="min-w-0">
        <h3 className="font-game text-[12.5px] font-bold leading-tight text-white text-shadow-game">{title}</h3>
        <p className="font-game text-[10.5px] text-[#e0d4b8]">{subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 font-game text-[13px] font-bold tabular-nums text-white text-shadow-game">
          <img alt="" className="size-3" src={publicAsset('/assets/clock.png')} />
          {time}
        </span>
        {actionLabel ? <BftcButton onClick={onAction} size="xs" variant="neutral">{actionLabel}</BftcButton> : null}
      </div>
      <ProgressBar className="col-span-full h-1.5" value={progress} variant={progressVariant[tone]} />
    </article>
  );
}
