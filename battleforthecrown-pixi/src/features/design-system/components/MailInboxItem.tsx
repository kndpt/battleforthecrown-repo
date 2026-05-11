import { Badge } from './Badge';
import { Avatar, type AvatarProps } from './Avatar';
import { cn } from '@/lib/cn';

export type MailInboxType = 'report' | 'attack' | 'scout' | 'system' | 'player';

const typeTone: Record<MailInboxType, 'default' | 'danger' | 'info' | 'warning' | 'neutral'> = {
  report: 'default',
  attack: 'danger',
  scout: 'info',
  system: 'warning',
  player: 'neutral',
};

export interface MailInboxItemProps {
  avatar?: AvatarProps;
  badge?: string;
  className?: string;
  onClick?: () => void;
  preview: string;
  sender: string;
  subject: string;
  time: string;
  type: MailInboxType;
  unread?: boolean;
}

export function MailInboxItem({
  avatar,
  badge,
  className,
  onClick,
  preview,
  sender,
  subject,
  time,
  type,
  unread,
}: MailInboxItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(
        'relative flex w-full items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
        unread ? 'border-[#1f5288] bg-gradient-to-b from-[#c7dffb] to-[#8fb6e0]' : 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]',
        className,
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {unread ? <span className="absolute left-1 top-1 size-2 rounded-full bg-[#e74c3c]" /> : null}
      <Avatar {...(avatar ?? { initials: sender.slice(0, 2).toUpperCase(), tone: 'stone' })} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-game text-xs font-bold text-[#6d5838]">{sender}</span>
          {badge ? <Badge size="sm" tone={typeTone[type]}>{badge}</Badge> : null}
        </span>
        <span className="block truncate font-game text-sm font-extrabold text-[#1f2937]">{subject}</span>
        <span className="block truncate font-game text-[11px] text-[#6d5838]">{preview}</span>
      </span>
      <span className="self-start whitespace-nowrap font-game text-[10px] font-bold text-[#6d5838]">{time}</span>
    </Component>
  );
}
