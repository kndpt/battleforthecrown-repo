import { Badge } from './Badge';
import { Avatar, type AvatarProps } from './Avatar';
import { cn } from '@/lib/cn';

export interface LeaderboardRowProps {
  avatar: AvatarProps;
  className?: string;
  delta?: 'up' | 'down' | 'flat';
  name: string;
  onClick?: () => void;
  points: string;
  rank: number;
  self?: boolean;
  tribe?: string;
}

const medalClass: Record<number, string> = {
  1: 'border-[#9e7b0d] bg-gradient-to-b from-[#f7d86b] to-[#d4a017]',
  2: 'border-[#7f8c8d] bg-gradient-to-b from-[#eef2f3] to-[#95a5a6]',
  3: 'border-[#a67c52] bg-gradient-to-b from-[#d7b287] to-[#a67c52]',
};

const deltaLabel = {
  up: '▲',
  down: '▼',
  flat: '•',
};

export function LeaderboardRow({
  avatar,
  className,
  delta = 'flat',
  name,
  onClick,
  points,
  rank,
  self,
  tribe,
}: LeaderboardRowProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
        self
          ? 'border-[#1f5288] bg-gradient-to-b from-[#c7dffb] to-[#8fb6e0]'
          : 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]',
        className,
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full border-2 font-game text-sm font-extrabold tabular-nums text-[#3d2f1f]',
          medalClass[rank] ?? 'border-[#8b7355] bg-[#f5e6d3]',
        )}
      >
        {rank}
      </span>
      <Avatar {...avatar} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-game text-sm font-extrabold text-[#1f2937]">{name}</span>
        <span className="block font-game text-[10px] font-bold text-[#6d5838]">{tribe ? `[${tribe}]` : 'Sans tribu'}</span>
      </span>
      <span className={cn('font-game text-xs font-extrabold', delta === 'up' ? 'text-[#3a6c1f]' : delta === 'down' ? 'text-[#a93226]' : 'text-[#6d5838]')}>
        {deltaLabel[delta]}
      </span>
      <Badge tone={self ? 'info' : 'default'}>{points}</Badge>
    </Component>
  );
}
