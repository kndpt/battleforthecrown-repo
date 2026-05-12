import { BftcButton, type BftcButtonVariant } from './BftcButton';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type PlayerProfileRelation = 'self' | 'ally' | 'enemy' | 'neutral';
export type PlayerProfileVariant = 'card' | 'compact';
export type PlayerProfileAvatarTone = 'default' | 'enemy' | 'ally' | 'neutral';
export type PlayerProfileTribeTone = 'gold' | 'red' | 'stone';

export interface PlayerProfileTribe {
  name: string;
  tag: string;
  tone?: PlayerProfileTribeTone;
}

export interface PlayerProfileStat {
  icon?: string;
  label?: string;
  value: string;
}

export interface PlayerProfileAction {
  label: string;
  onClick?: () => void;
  variant?: BftcButtonVariant;
}

export interface PlayerProfileCardProps {
  actions?: PlayerProfileAction[];
  avatarIcon: string;
  avatarTone?: PlayerProfileAvatarTone;
  className?: string;
  compactValue?: string;
  name: string;
  online?: boolean;
  relation?: PlayerProfileRelation;
  showCrown?: boolean;
  selfLabel?: string;
  stats?: PlayerProfileStat[];
  tribe?: PlayerProfileTribe;
  variant?: PlayerProfileVariant;
}

const relationBarClass: Record<PlayerProfileRelation, string> = {
  self: 'bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]',
  ally: 'bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
  enemy: 'bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  neutral: '',
};

const avatarToneClass: Record<PlayerProfileAvatarTone, string> = {
  default: 'bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#8b6f47)]',
  enemy: 'bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#a93226)]',
  ally: 'bg-[radial-gradient(circle_at_30%_25%,#cfe2f6,#2e75b6)]',
  neutral: 'bg-[radial-gradient(circle_at_30%_25%,#dee3e6,#7f8c8d)]',
};

const tribeToneClass: Record<PlayerProfileTribeTone, string> = {
  gold: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] text-[#3a2a00]',
  red: 'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] text-white',
  stone: 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#bfc7cb,#7f8c8d)] text-[#1f2933]',
};

function PlayerAvatar({
  avatarIcon,
  compact = false,
  online,
  showCrown,
  tone,
}: {
  avatarIcon: string;
  compact?: boolean;
  online?: boolean;
  showCrown?: boolean;
  tone: PlayerProfileAvatarTone;
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center border-[#3d2f1f] shadow-[inset_0_2px_0_rgba(255,255,255,.5),0_2px_4px_rgba(0,0,0,.3)]',
        avatarToneClass[tone],
        compact ? 'size-9 rounded-[9px] border-2' : 'size-16 rounded-[14px] border-[3px]',
      )}
    >
      <img alt="" className={compact ? 'size-[26px]' : 'size-[46px]'} src={publicAsset(avatarIcon)} />
      {showCrown && !compact ? (
        <span className="absolute -right-1.5 -top-2.5 size-6 bg-[url('/assets/casual-icons/crown.png')] bg-contain bg-center bg-no-repeat drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]" />
      ) : null}
      {online && !compact ? <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-[2.5px] border-[#fef9f0] bg-[#6ebf49]" /> : null}
    </div>
  );
}

function TribeLine({ compact = false, tribe }: { compact?: boolean; tribe?: PlayerProfileTribe }) {
  if (!tribe) return null;

  if (compact) {
    return <div className="font-game text-[10px] text-[#6d5838]">[{tribe.tag}] {tribe.name}</div>;
  }

  return (
    <div className="inline-flex items-center gap-1 font-game text-[11px] text-[#6d5838]">
      Tribu
      <span className={cn('rounded-full border-[1.5px] px-1.5 py-px font-game text-[10px] font-bold [text-shadow:none]', tribeToneClass[tribe.tone ?? 'gold'])}>
        {tribe.tag}
      </span>
      · {tribe.name}
    </div>
  );
}

function ProfileStats({ compact = false, stats = [] }: { compact?: boolean; stats?: PlayerProfileStat[] }) {
  if (stats.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap font-game text-[#6d5838]', compact ? 'm-0 gap-2 text-[10px]' : 'mt-1 gap-2.5 text-[11px]')}>
      {stats.map((stat) => (
        <span key={`${stat.icon ?? stat.label ?? ''}-${stat.value}`}>
          {stat.icon ? <img alt="" className="mr-0.5 inline size-[13px] align-middle" src={publicAsset(stat.icon)} /> : null}
          {stat.label ? `${stat.label} ` : null}
          <b className="font-bold tabular-nums text-[#3d2f1f]">{stat.value}</b>
        </span>
      ))}
    </div>
  );
}

export function PlayerProfileCard({
  actions = [],
  avatarIcon,
  avatarTone = 'default',
  className,
  compactValue,
  name,
  online = false,
  relation = 'neutral',
  showCrown = false,
  selfLabel,
  stats = [],
  tribe,
  variant = 'card',
}: PlayerProfileCardProps) {
  if (variant === 'compact') {
    return (
      <article
        className={cn(
          'flex items-center gap-2 rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2.5 py-1.5',
          className,
        )}
      >
        <PlayerAvatar avatarIcon={avatarIcon} compact tone={avatarTone} />
        <div className="min-w-0">
          <div className="font-game text-xs font-bold text-[#3d2f1f]">{name}</div>
          <TribeLine compact tribe={tribe} />
        </div>
        {compactValue ? <div className="ml-auto font-game text-[13px] font-extrabold tabular-nums text-[#3d2f1f]">{compactValue}</div> : null}
      </article>
    );
  }

  return (
    <article
      className={cn(
        'relative grid grid-cols-[64px_1fr] gap-3 overflow-hidden rounded-[14px] border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_4px_0_rgba(0,0,0,.16)]',
        className,
      )}
    >
      {relation !== 'neutral' ? <span className={cn('absolute bottom-0 left-0 top-0 w-[5px]', relationBarClass[relation])} /> : null}
      <PlayerAvatar avatarIcon={avatarIcon} online={online} showCrown={showCrown} tone={avatarTone} />
      <div className="flex min-w-0 flex-col gap-[3px]">
        <div className="flex items-center gap-1.5 font-game text-[15px] font-bold text-[#3d2f1f]">
          {name}
          {selfLabel ? <span className="text-[10px] font-semibold text-[#9e7b0d]">· {selfLabel}</span> : null}
        </div>
        <TribeLine tribe={tribe} />
        <ProfileStats stats={stats} />
      </div>
      {actions.length > 0 ? (
        <div className="col-span-full mt-1 flex gap-1.5">
          {actions.map((action) => (
            <BftcButton className="flex-1 justify-center px-2.5 py-[5px] text-[11px]" key={action.label} onClick={action.onClick} variant={action.variant ?? 'neutral'}>
              {action.label}
            </BftcButton>
          ))}
        </div>
      ) : null}
    </article>
  );
}
