import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type AvatarSize = 's24' | 's32' | 's44' | 's64' | 's88';
export type AvatarTone = 'default' | 'red' | 'blue' | 'green' | 'purple' | 'stone';
export type AvatarStatus = 'offline' | 'online' | 'attack' | 'defense';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  crownIcon?: string;
  icon?: string;
  initials?: string;
  levelLabel?: string;
  size?: AvatarSize;
  stacked?: boolean;
  status?: AvatarStatus;
  tone?: AvatarTone;
}

export interface AvatarStackItem extends Omit<AvatarProps, 'stacked'> {
  id: string;
}

export interface AvatarStackProps extends HTMLAttributes<HTMLDivElement> {
  items: AvatarStackItem[];
  moreLabel?: string;
}

export interface AvatarProfileLineProps extends HTMLAttributes<HTMLDivElement> {
  avatar: AvatarProps;
  name: string;
  subtitle: string;
}

const sizeClass: Record<AvatarSize, string> = {
  s24: 'size-6 border-[1.5px] text-[10px]',
  s32: 'size-8 border-2 text-[12px]',
  s44: 'size-11 border-[3px] text-base',
  s64: 'size-16 border-[3px] text-[22px]',
  s88: 'size-[88px] border-4 text-[32px]',
};

const toneSurfaceClass: Record<AvatarTone, string> = {
  default: 'bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)] text-[#3a2a00]',
  red: 'bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#5a1612)] text-[#fef9f0] [text-shadow:1px_1px_0_rgba(0,0,0,.5)]',
  blue: 'bg-[radial-gradient(circle_at_30%_25%,#cfe2f6,#102e58)] text-[#fef9f0] [text-shadow:1px_1px_0_rgba(0,0,0,.5)]',
  green: 'bg-[radial-gradient(circle_at_30%_25%,#d6ecc4,#1d4a1d)] text-[#fef9f0] [text-shadow:1px_1px_0_rgba(0,0,0,.5)]',
  purple: 'bg-[radial-gradient(circle_at_30%_25%,#d8c3ef,#2c0e4d)] text-[#f6d57b] [text-shadow:1px_1px_0_rgba(0,0,0,.5)]',
  stone: 'bg-[radial-gradient(circle_at_30%_25%,#e8e8e8,#3d4f60)] text-[#fef9f0] [text-shadow:1px_1px_0_rgba(0,0,0,.5)]',
};

const toneBorderClass: Record<AvatarTone, string> = {
  default: 'border-[#704c0a]',
  red: 'border-[#3d2f1f]',
  blue: 'border-[#0a1f3d]',
  green: 'border-[#0d2f0d]',
  purple: 'border-[#1a052f]',
  stone: 'border-[#1f2933]',
};

const statusClass: Record<AvatarStatus, string> = {
  offline: 'bg-[#7f8c8d]',
  online: 'bg-[#6ebf49] shadow-[0_0_6px_rgba(46,134,84,.6)]',
  attack: 'bg-[#e74c3c] shadow-[0_0_6px_rgba(169,50,38,.6)]',
  defense: 'bg-[#5b9bd5] shadow-[0_0_6px_rgba(44,95,163,.6)]',
};

export function Avatar({
  children,
  className,
  crownIcon,
  icon,
  initials,
  levelLabel,
  size = 's44',
  stacked = false,
  status,
  tone = 'default',
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border-solid font-game font-black shadow-[inset_0_2px_0_rgba(255,255,255,.4),0_3px_6px_rgba(0,0,0,.25)]',
        sizeClass[size],
        toneSurfaceClass[tone],
        stacked ? 'border-[#fef9f0] shadow-[0_0_0_2px_#fef9f0,0_2px_4px_rgba(0,0,0,.25)]' : toneBorderClass[tone],
        className,
      )}
      {...props}
    >
      {icon ? <img alt="" className="size-[60%] object-contain" src={publicAsset(icon)} /> : (children ?? initials)}
      {status ? (
        <span
          aria-hidden="true"
          className={cn('absolute bottom-[-2%] right-[-2%] size-[30%] rounded-full border-2 border-[#fef9f0]', statusClass[status])}
        />
      ) : null}
      {crownIcon ? (
        <img
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-[-22%] h-auto w-[55%] -translate-x-1/2 -rotate-[8deg] drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]"
          src={publicAsset(crownIcon)}
        />
      ) : null}
      {levelLabel ? (
        <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-[#9e7b0d] bg-[linear-gradient(to_bottom,#3d2f1f,#1a1a1a)] px-1.5 py-px font-game text-[10px] font-extrabold text-[#f6d57b]">
          {levelLabel}
        </span>
      ) : null}
    </div>
  );
}

export function AvatarStack({ className, items, moreLabel, ...props }: AvatarStackProps) {
  return (
    <div className={cn('inline-flex', className)} {...props}>
      {items.map(({ id, ...avatar }, index) => (
        <Avatar key={id} stacked className={index === 0 ? '' : 'ml-[-8px]'} {...avatar} />
      ))}
      {moreLabel ? (
        <span className="ml-[-8px] inline-flex size-11 items-center justify-center rounded-full border-[3px] border-[#fef9f0] bg-[#3d2f1f] font-game text-[12px] font-extrabold text-[#f6d57b] shadow-[0_0_0_0_#fef9f0,0_2px_4px_rgba(0,0,0,.25)]">
          {moreLabel}
        </span>
      ) : null}
    </div>
  );
}

export function AvatarProfileLine({ avatar, className, name, subtitle, ...props }: AvatarProfileLineProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2.5 py-2',
        className,
      )}
      {...props}
    >
      <Avatar {...avatar} size={avatar.size ?? 's44'} />
      <div>
        <div className="font-game text-[13px] font-bold text-[#3d2f1f]">{name}</div>
        <div className="font-game text-[11px] text-[#6d5838]">{subtitle}</div>
      </div>
    </div>
  );
}
