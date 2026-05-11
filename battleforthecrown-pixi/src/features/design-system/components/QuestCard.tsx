import { BftcButton, type BftcButtonProps } from './BftcButton';
import { CostPill, CostRow } from './CostRow';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface QuestReward {
  icon: string;
  value: string;
}

export interface QuestCardProps {
  actionLabel?: string;
  actionVariant?: BftcButtonProps['variant'];
  description?: string;
  icon: string;
  locked?: boolean;
  name: string;
  onAction?: () => void;
  progress?: { label: string; value: number };
  ready?: boolean;
  rewards?: QuestReward[];
}

export function QuestCard({ actionLabel, actionVariant = 'success', description, icon, locked, name, onAction, progress, ready, rewards = [] }: QuestCardProps) {
  return (
    <article className={cn('grid grid-cols-[46px_1fr_auto] items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]', ready ? 'border-[#3a6c1f] bg-gradient-to-b from-[#d6ecc4] to-[#a8d28d] animate-[bftc-quest-glow_1.6s_ease-in-out_infinite]' : 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]')}>
      <div className={cn('grid size-[46px] place-items-center rounded-[10px] border-2 border-black/20 bg-gradient-to-br from-white/40 to-black/20', locked ? 'opacity-50' : '')}>
        <img alt="" className="size-[34px] object-contain" src={publicAsset(icon)} />
      </div>
      <div className="min-w-0">
        <h3 className={cn('font-game text-[13px] font-bold text-[#3d2f1f]', locked ? 'text-[#7f8c8d]' : '')}>{name}</h3>
        {description ? <p className="font-game text-[11px] leading-4 text-[#6d5838]">{description}</p> : null}
        {progress ? (
          <div className="mt-1">
            <ProgressBar className="h-2" value={progress.value} variant="gold" />
            <div className="mt-0.5 font-game text-[10.5px] font-bold tabular-nums text-[#3d2f1f]">{progress.label}</div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1">
        {rewards.length > 0 ? <CostRow>{rewards.map((reward) => <CostPill key={`${reward.icon}-${reward.value}`} icon={reward.icon} value={reward.value} />)}</CostRow> : null}
        {actionLabel ? <BftcButton onClick={onAction} size="xs" variant={actionVariant}>{actionLabel}</BftcButton> : null}
      </div>
    </article>
  );
}

export interface FeaturedQuestCardProps {
  actionLabel: string;
  description: string;
  eyebrow: string;
  icon: string;
  onAction?: () => void;
  rewards: QuestReward[];
  title: string;
}

export function FeaturedQuestCard({ actionLabel, description, eyebrow, icon, onAction, rewards, title }: FeaturedQuestCardProps) {
  return (
    <article className="grid grid-cols-[72px_1fr] gap-3 rounded-[14px] border-[3px] border-[#9e7b0d] bg-gradient-to-br from-[#fef0c6] to-[#e8c878] p-3.5 text-[#3a2a00] shadow-[0_6px_14px_rgba(0,0,0,.2),inset_0_2px_0_rgba(255,255,255,.5)]">
      <div className="grid size-[72px] place-items-center rounded-[14px] border-[3px] border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fff5b8,#a87b25)] shadow-[inset_0_2px_0_rgba(255,255,255,.5)]">
        <img alt="" className="size-[54px] object-contain" src={publicAsset(icon)} />
      </div>
      <div>
        <div className="font-game text-[10px] font-bold uppercase tracking-[0.18em] text-[#704c0a]">{eyebrow}</div>
        <h3 className="my-0.5 font-game text-[17px] font-extrabold">{title}</h3>
        <p className="font-game text-[11.5px] leading-4 text-[#5a4400]">{description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-[#704c0a] bg-black/10 px-2 py-0.5 font-game text-[11px] font-bold">Récompense :</span>
          {rewards.map((reward) => <CostPill key={`${reward.icon}-${reward.value}`} icon={reward.icon} value={reward.value} />)}
          <BftcButton className="ml-auto" onClick={onAction} size="xs" variant="info">{actionLabel}</BftcButton>
        </div>
      </div>
    </article>
  );
}
