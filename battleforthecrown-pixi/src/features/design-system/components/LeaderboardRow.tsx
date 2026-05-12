import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type LeaderboardRankTone = 'default' | 'gold' | 'silver' | 'bronze';
export type LeaderboardDeltaTone = 'up' | 'down' | 'flat';

export interface LeaderboardDelta {
  label: string;
  tone: LeaderboardDeltaTone;
}

export interface LeaderboardRowProps {
  avatarIcon: string;
  avatarTone?: 'default' | 'gold' | 'enemy';
  className?: string;
  delta: LeaderboardDelta;
  name: string;
  onClick?: () => void;
  points: string;
  rank: number;
  rankTone?: LeaderboardRankTone;
  scoreLabel?: string;
  self?: boolean;
  subtitle: string;
}

export interface LeaderboardHeaderProps {
  className?: string;
  deltaLabel?: string;
  playerLabel?: string;
  rankLabel?: string;
  scoreLabel?: string;
}

const rowToneClass: Record<LeaderboardRankTone, string> = {
  default: 'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)]',
  gold: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fff3c6,#e8c360)]',
  silver: 'border-[#7f8c8d] bg-[linear-gradient(to_bottom,#f0f3f5,#c1ccd1)]',
  bronze: 'border-[#7a4915] bg-[linear-gradient(to_bottom,#f0c89a,#a76928)]',
};

const medalClass: Record<Exclude<LeaderboardRankTone, 'default'>, string> = {
  gold: 'border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fff5b8,#b48800)]',
  silver: 'border-[#4d595e] bg-[radial-gradient(circle_at_30%_25%,#f7fafc,#7e8b91)]',
  bronze: 'border-[#492810] bg-[radial-gradient(circle_at_30%_25%,#f4cea3,#7a4915)]',
};

const avatarToneClass: Record<NonNullable<LeaderboardRowProps['avatarTone']>, string> = {
  default: 'bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#8b6f47)]',
  gold: 'bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)]',
  enemy: 'bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#a93226)]',
};

const deltaClass: Record<LeaderboardDeltaTone, string> = {
  up: 'bg-[rgba(110,191,73,.2)] text-[#3a6c1f]',
  down: 'bg-[rgba(231,76,60,.18)] text-[#a93226]',
  flat: 'bg-[rgba(0,0,0,.06)] text-[#6d5838]',
};

export function LeaderboardHeader({
  className,
  deltaLabel = 'Δ 24h',
  playerLabel = 'Seigneur',
  rankLabel = 'Rang',
  scoreLabel = 'Points',
}: LeaderboardHeaderProps) {
  return (
    <div className={cn('grid grid-cols-[42px_1fr_auto_auto] gap-2.5 px-2.5 pb-1 font-game text-[9.5px] font-bold uppercase tracking-[.14em] text-[#6d5838]', className)}>
      <span>{rankLabel}</span>
      <span>{playerLabel}</span>
      <span>{deltaLabel}</span>
      <span>{scoreLabel}</span>
    </div>
  );
}

export function LeaderboardRow({
  avatarIcon,
  avatarTone = 'default',
  className,
  delta,
  name,
  onClick,
  points,
  rank,
  rankTone = 'default',
  scoreLabel = 'points',
  self = false,
  subtitle,
}: LeaderboardRowProps) {
  const Tag = onClick ? 'button' : 'article';
  const medalTone = rankTone === 'default' ? null : rankTone;

  return (
    <Tag
      className={cn(
        'grid w-full grid-cols-[42px_1fr_auto_auto] items-center gap-2.5 rounded-[10px] border-2 px-2.5 py-[7px] text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
        rowToneClass[rankTone],
        self ? 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fef0c6,#e8c878)]' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="text-center font-game text-base font-extrabold tabular-nums text-[#3d2f1f]">
        {medalTone ? (
          <span className={cn('inline-flex size-8 items-center justify-center rounded-full border-2 font-game text-lg font-black text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]', medalClass[medalTone])}>
            {rank}
          </span>
        ) : rank}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#3d2f1f]', avatarToneClass[avatarTone])}>
          <img alt="" className="size-[22px]" src={publicAsset(avatarIcon)} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-game text-[12.5px] font-bold leading-[1.1] text-[#3d2f1f]">{name}</span>
          <span className="truncate font-game text-[10px] text-[#6d5838]">{subtitle}</span>
        </div>
      </div>
      <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-game text-[11px] font-bold tabular-nums', deltaClass[delta.tone])}>{delta.label}</span>
      <div className="min-w-20 text-right font-game text-sm font-extrabold tabular-nums text-[#3d2f1f]">
        {points}
        <small className="block text-[9.5px] font-semibold uppercase tracking-[.1em] text-[#6d5838]">{scoreLabel}</small>
      </div>
    </Tag>
  );
}
