import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type AchievementTier = 'gold' | 'silver' | 'bronze' | 'locked';

const tierClass: Record<AchievementTier, string> = {
  gold: 'bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)] border-[#704c0a] text-[#704c0a]',
  silver: 'bg-[radial-gradient(circle_at_30%_25%,#f7fafc,#7e8b91)] border-[#4d595e] text-[#4d595e]',
  bronze: 'bg-[radial-gradient(circle_at_30%_25%,#f4cea3,#7a4915)] border-[#492810] text-[#492810]',
  locked: 'bg-gradient-to-b from-[#cdcdcd] to-[#7f8c8d] border-[#3d4f60] text-[#7f8c8d] grayscale',
};

export interface AchievementCardProps {
  className?: string;
  icon: string;
  name: string;
  points?: string;
  progress?: { label: string; value: number };
  tier: AchievementTier;
  tierLabel: string;
}

export function AchievementCard({ className, icon, name, points, progress, tier, tierLabel }: AchievementCardProps) {
  const locked = tier === 'locked';

  return (
    <article className={cn('relative flex flex-col items-center rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] px-2 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]', locked ? 'opacity-60' : '', className)}>
      {!locked && points ? <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] px-1.5 py-0.5 font-game text-[10px] font-extrabold text-[#3a2a00]">+{points}</span> : null}
      <div className={cn('relative grid size-[60px] place-items-center rounded-full border-[3px] shadow-[inset_0_2px_0_rgba(255,255,255,.5),0_3px_6px_rgba(0,0,0,.25)] after:absolute after:inset-[-4px] after:rounded-full after:border-2 after:border-current after:opacity-55 after:content-[""]', tierClass[tier])}>
        <img alt="" className="size-9 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,.4)]" src={publicAsset(icon)} />
      </div>
      <div className="mt-1.5 text-center font-game text-[11px] font-bold leading-tight text-[#3d2f1f]">{name}</div>
      <div className={cn('mt-0.5 font-game text-[9.5px] font-extrabold uppercase tracking-[0.14em]', tierClass[tier].split(' ').at(-1))}>{tierLabel}</div>
      {progress ? (
        <div className="mt-1.5 w-full">
          <ProgressBar className="h-1.5" value={progress.value} variant="gold" />
          <div className="mt-0.5 text-center font-game text-[9.5px] tabular-nums text-[#6d5838]">{progress.label}</div>
        </div>
      ) : null}
    </article>
  );
}
