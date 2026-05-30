import { BftcButton, type BftcButtonVariant } from './BftcButton';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';
import { clamp } from '@/lib/math';

export interface QuestReward {
  icon: string;
  value: string;
}

export type QuestMissionState = 'default' | 'ready' | 'done' | 'locked';

export interface FeaturedQuestCardProps {
  actionLabel?: string;
  className?: string;
  description: string;
  eyebrow: string;
  icon: string;
  onAction?: () => void;
  rewardLabel?: string;
  rewards: QuestReward[];
  title: string;
}

export interface QuestMissionCardProps {
  actionLabel?: string;
  actionVariant?: BftcButtonVariant;
  className?: string;
  description?: string;
  icon: string;
  onAction?: () => void;
  progressLabel?: string;
  progressPercent?: number;
  rewards: QuestReward[];
  state?: QuestMissionState;
  title: string;
}

const missionStateClass: Record<QuestMissionState, string> = {
  default: 'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)]',
  ready: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#d6ecc4,#a8d28d)] [animation:bftc-quest-glow_1.6s_ease-in-out_infinite]',
  done: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#d6ecc4,#a8d28d)]',
  locked: 'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)]',
};

function QuestRewardPill({ icon, value, variant = 'default' }: QuestReward & { variant?: 'default' | 'featured' | 'locked' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[3px] rounded-full font-game font-bold tabular-nums',
        variant === 'featured'
          ? 'border-[1.5px] border-[#704c0a] bg-[rgba(255,255,255,.45)] py-[3px] pl-1 pr-2 text-[11px] text-[#3a2a00]'
          : 'border-[1.5px] border-[rgba(0,0,0,.18)] bg-[rgba(0,0,0,.06)] py-0.5 pl-[3px] pr-1.5 text-[10.5px] text-[#3d2f1f]',
        variant === 'locked' ? 'opacity-[.5]' : '',
      )}
    >
      <img alt="" className={variant === 'featured' ? 'size-[15px]' : 'size-3.5'} src={publicAsset(icon)} />
      {value}
    </span>
  );
}

export function FeaturedQuestCard({
  actionLabel,
  className,
  description,
  eyebrow,
  icon,
  onAction,
  rewardLabel = 'Récompense :',
  rewards,
  title,
}: FeaturedQuestCardProps) {
  return (
    <section
      className={cn(
        'grid grid-cols-[72px_1fr] gap-3 rounded-[14px] border-[3px] border-[#9e7b0d] bg-[linear-gradient(135deg,#fef0c6,#e8c878)] p-3.5 text-[#3a2a00] shadow-[0_6px_14px_rgba(0,0,0,.2),inset_0_2px_0_rgba(255,255,255,.5)]',
        className,
      )}
    >
      <div className="flex size-[72px] items-center justify-center rounded-[14px] border-[3px] border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fff5b8,#a87b25)] shadow-[inset_0_2px_0_rgba(255,255,255,.5)]">
        <img alt="" className="size-[54px]" src={publicAsset(icon)} />
      </div>
      <div>
        <div className="font-game text-[10px] font-bold uppercase tracking-[.18em] text-[#704c0a]">{eyebrow}</div>
        <h3 className="my-0.5 font-game text-[17px] font-extrabold text-[#3a2a00]">{title}</h3>
        <p className="font-game text-[11.5px] leading-[1.35] text-[#5a4400]">{description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border-[1.5px] border-[#704c0a] bg-[rgba(0,0,0,.08)] px-[9px] py-[3px] font-game text-[11px] font-bold text-[#3a2a00]">
            {rewardLabel}
          </span>
          {rewards.map((reward) => (
            <QuestRewardPill key={`${reward.icon}-${reward.value}`} variant="featured" {...reward} />
          ))}
          {actionLabel ? (
            <BftcButton className="ml-auto px-3.5 py-1.5 text-xs" onClick={onAction} variant="info">
              {actionLabel}
            </BftcButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function QuestMissionCard({
  actionLabel,
  actionVariant = 'success',
  className,
  description,
  icon,
  onAction,
  progressLabel,
  progressPercent,
  rewards,
  state = 'default',
  title,
}: QuestMissionCardProps) {
  const locked = state === 'locked';
  const boundedProgress = clamp(progressPercent ?? 0, 0, 100);

  return (
    <article
      className={cn(
        'grid grid-cols-[46px_1fr_auto] items-center gap-2.5 rounded-xl border-2 px-[11px] py-[9px] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]',
        missionStateClass[state],
        className,
      )}
    >
      <div className={cn('flex size-[46px] items-center justify-center rounded-[10px] border-2 border-[rgba(0,0,0,.22)] bg-[linear-gradient(135deg,rgba(255,255,255,.4),rgba(0,0,0,.18))]', locked ? 'opacity-[.5]' : '')}>
        <img alt="" className="size-[34px]" src={publicAsset(icon)} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className={cn('font-game text-[13px] font-bold text-[#3d2f1f]', locked ? 'text-[#7f8c8d]' : '')}>{title}</div>
        {description ? <div className={cn('font-game text-[11px] leading-[1.3] text-[#6d5838]', locked ? 'italic' : '')}>{description}</div> : null}
        {progressPercent !== undefined ? (
          <div className="relative h-2 overflow-hidden rounded border border-[rgba(0,0,0,.25)] bg-[rgba(0,0,0,.22)]">
            <div className="h-full bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]" style={{ width: `${boundedProgress}%` }} />
          </div>
        ) : null}
        {progressLabel ? <div className="font-game text-[10.5px] font-bold tabular-nums text-[#3d2f1f]">{progressLabel}</div> : null}
      </div>
      <div className="flex flex-col items-end gap-[3px]">
        <div className="flex gap-[3px]">
          {rewards.map((reward) => (
            <QuestRewardPill key={`${reward.icon}-${reward.value}`} variant={locked ? 'locked' : 'default'} {...reward} />
          ))}
        </div>
        {actionLabel ? (
          <BftcButton className="px-2.5 py-1 text-[10.5px]" onClick={onAction} variant={actionVariant}>
            {actionLabel}
          </BftcButton>
        ) : null}
      </div>
    </article>
  );
}
