import { Crown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type AvatarTone = 'default' | 'red' | 'blue' | 'green' | 'purple' | 'stone';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'attack' | 'defense' | 'offline';

const toneClass: Record<AvatarTone, string> = {
  default: 'from-[#fef9f0] to-[#e8d4a8] border-[#8b7355]',
  red: 'from-[#f4b0a8] to-[#c0392b] border-[#a93226]',
  blue: 'from-[#c7dffb] to-[#2e75b6] border-[#1f5288]',
  green: 'from-[#b7dd9d] to-[#4a8c2a] border-[#3a6c1f]',
  purple: 'from-[#d8c4f0] to-[#7d5ab8] border-[#5c3d8f]',
  stone: 'from-[#cfd8dc] to-[#7f8c8d] border-[#5d6d6e]',
};

const sizeClass: Record<AvatarSize, string> = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-11',
  lg: 'size-16',
  xl: 'size-[88px]',
};

const statusClass: Record<AvatarStatus, string> = {
  online: 'bg-[#6ebf49]',
  attack: 'bg-[#e74c3c]',
  defense: 'bg-[#5b9bd5]',
  offline: 'bg-[#95a5a6]',
};

export interface AvatarProps {
  alt?: string;
  className?: string;
  crown?: boolean;
  icon?: string;
  initials?: string;
  level?: number;
  size?: AvatarSize;
  status?: AvatarStatus;
  tone?: AvatarTone;
}

export function Avatar({
  alt = '',
  className,
  crown,
  icon,
  initials,
  level,
  size = 'md',
  status,
  tone = 'default',
}: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'grid place-items-center overflow-hidden rounded-full border-2 bg-gradient-to-b font-game font-extrabold text-[#3d2f1f]',
          'shadow-[0_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.55)]',
          sizeClass[size],
          toneClass[tone],
        )}
      >
        {icon ? (
          <img alt={alt} className="size-[72%] object-contain drop-shadow-[0_2px_1px_rgba(0,0,0,0.28)]" src={publicAsset(icon)} />
        ) : (
          <span className={cn(size === 'xs' || size === 'sm' ? 'text-[10px]' : 'text-base')}>{initials}</span>
        )}
      </div>
      {status ? (
        <span
          className={cn(
            'absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#fef9f0] shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
            size === 'xs' ? 'size-2' : '',
            statusClass[status],
          )}
        />
      ) : null}
      {crown ? (
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#5a4400] shadow-[0_2px_0_rgba(0,0,0,0.25)]">
          <Crown size={12} />
        </span>
      ) : null}
      {level !== undefined ? (
        <span className="absolute -bottom-1 left-1/2 min-w-6 -translate-x-1/2 rounded-full border-2 border-[#5d4a32] bg-[#1a1a1a] px-1 text-center font-game text-[9px] font-bold tabular-nums text-[#f6d57b]">
          {level}
        </span>
      ) : null}
    </div>
  );
}
