import { Badge } from './Badge';
import { BftcButton } from './BftcButton';
import { Avatar, type AvatarProps } from './Avatar';
import { cn } from '@/lib/cn';

export type PlayerRelation = 'self' | 'ally' | 'enemy' | 'neutral';

const relationClass: Record<PlayerRelation, string> = {
  self: 'border-[#9e7b0d]',
  ally: 'border-[#3a6c1f]',
  enemy: 'border-[#a93226]',
  neutral: 'border-[#8b7355]',
};

const relationBadge: Record<PlayerRelation, { label: string; tone: 'warning' | 'success' | 'danger' | 'default' }> = {
  self: { label: 'Vous', tone: 'warning' },
  ally: { label: 'Allié', tone: 'success' },
  enemy: { label: 'Ennemi', tone: 'danger' },
  neutral: { label: 'Neutre', tone: 'default' },
};

export interface PlayerProfileStat {
  label: string;
  value: string;
}

export interface PlayerProfileAction {
  label: string;
  onClick?: () => void;
  variant?: 'success' | 'info' | 'danger' | 'warning' | 'neutral';
}

export interface PlayerProfileCardProps {
  actions?: PlayerProfileAction[];
  avatar: AvatarProps;
  className?: string;
  name: string;
  rank?: string;
  relation?: PlayerRelation;
  stats: PlayerProfileStat[];
  tribe?: string;
}

export function PlayerProfileCard({
  actions = [],
  avatar,
  className,
  name,
  rank,
  relation = 'neutral',
  stats,
  tribe,
}: PlayerProfileCardProps) {
  const badge = relationBadge[relation];

  return (
    <article
      className={cn(
        'rounded-[16px] border-[3px] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-3 shadow-[0_4px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]',
        relationClass[relation],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar {...avatar} size={avatar.size ?? 'lg'} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate font-game text-xl font-extrabold text-[#1f2937]">{name}</h3>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <div className="mt-0.5 font-game text-[11px] font-bold text-[#6d5838]">
            {tribe ? `[${tribe}]` : 'Sans tribu'}{rank ? ` · ${rank}` : ''}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border-2 border-[#b8a082] bg-white/45 px-2 py-1">
            <div className="font-game text-[9px] font-bold uppercase tracking-[0.08em] text-[#6d5838]">{stat.label}</div>
            <div className="font-game text-sm font-extrabold tabular-nums text-[#1f2937]">{stat.value}</div>
          </div>
        ))}
      </div>
      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <BftcButton key={action.label} onClick={action.onClick} size="xs" variant={action.variant ?? 'success'}>
              {action.label}
            </BftcButton>
          ))}
        </div>
      ) : null}
    </article>
  );
}
