import type { HTMLAttributes } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface HeaderBarStat {
  icon: string;
  label: string;
  value: string;
  fillRatio?: number;
  onClick?: () => void;
}

export interface HeaderBarProps extends HTMLAttributes<HTMLElement> {
  avatarInitials: string;
  level: string | number;
  onProfileClick?: () => void;
  profileExpanded?: boolean;
  population: HeaderBarStat;
  primaryStats: [HeaderBarStat, HeaderBarStat];
  resources: [HeaderBarStat, HeaderBarStat, HeaderBarStat];
}

type PillVariant = 'resource' | 'primary-brown' | 'primary-gold';

const PILL_VARIANT_CLASS: Record<PillVariant, string> = {
  resource:
    'gap-3 rounded-[16px] border-4 border-[rgba(255,255,255,.12)] bg-[rgba(0,0,0,.34)] px-5 text-[28px] text-white [text-shadow:2px_2px_3px_rgba(0,0,0,.65)]',
  'primary-brown':
    'gap-3 rounded-full border-4 border-[rgba(255,255,255,.12)] bg-[linear-gradient(to_bottom,#8b7248,#6e5736)] px-5 text-[28px] text-white [text-shadow:2px_2px_3px_rgba(0,0,0,.65)]',
  'primary-gold':
    'gap-3 rounded-full border-4 border-[#b38e09] bg-[linear-gradient(to_bottom,#ffef7c,#d1a321)] px-5 text-[28px] text-[#3a2a00] [box-shadow:inset_0_2px_0_rgba(255,255,255,.38)]',
};

const PILL_ICON_CLASS: Record<PillVariant, string> = {
  resource: 'size-9',
  'primary-brown': 'size-9',
  'primary-gold': 'size-9',
};

function HeaderPill({
  className,
  icon,
  label,
  value,
  fillRatio,
  onClick,
  variant = 'resource',
}: HeaderBarStat & { className?: string; variant?: PillVariant }) {
  const ratio = fillRatio === undefined ? undefined : Math.max(0, Math.min(1, fillRatio));
  const isAtCapacity = ratio !== undefined && ratio >= 1;
  const baseClass = cn(
    'relative inline-flex min-w-0 items-center justify-center overflow-hidden font-game font-bold [font-variant-numeric:tabular-nums]',
    PILL_VARIANT_CLASS[variant],
    onClick && 'cursor-pointer transition-transform active:scale-95',
    className,
  );
  const content = (
    <>
      {ratio !== undefined && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-0 left-0 h-[6px] rounded-full transition-[width] duration-300',
            isAtCapacity
              ? 'bg-gradient-to-r from-[#f2b84b] to-[#f06f4a]'
              : 'bg-gradient-to-r from-[#f0c04e] to-[#fff1a5]',
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      )}
      <img alt="" className={cn('relative z-10 shrink-0', PILL_ICON_CLASS[variant])} src={publicAsset(icon)} />
      <span className="relative z-10 min-w-0 truncate">{value}</span>
    </>
  );
  if (onClick) {
    return (
      <button aria-label={`${label} ${value}`} className={baseClass} onClick={onClick} type="button">
        {content}
      </button>
    );
  }
  return (
    <div aria-label={`${label} ${value}`} className={baseClass}>
      {content}
    </div>
  );
}

export function HeaderBar({
  avatarInitials,
  className,
  level,
  onProfileClick,
  profileExpanded,
  population,
  primaryStats,
  resources,
  ...props
}: HeaderBarProps) {
  const avatar = (
    <span className="relative flex size-[100px] shrink-0 items-center justify-center rounded-full border-4 border-[#5d4a32] bg-[linear-gradient(to_bottom,#8b6f47,#6d5838)] font-game text-[32px] font-bold text-white [text-shadow:2px_2px_3px_rgba(0,0,0,.65)]">
      {avatarInitials}
      <span className="absolute -bottom-1 -right-2 flex size-[48px] items-center justify-center rounded-full border-4 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#ffef7c,#cfa11f)] font-game text-[21px] font-bold text-[#3a2a00] [box-shadow:0_3px_0_rgba(0,0,0,.28)]">
        {level}
      </span>
    </span>
  );

  return (
    <header
      className={cn(
        'flex h-[172px] w-[850px] shrink-0 items-center gap-5 bg-[#442918] px-4',
        className,
      )}
      {...props}
    >
      {onProfileClick ? (
        <button
          aria-expanded={profileExpanded}
          aria-label="Profil joueur"
          className="shrink-0"
          onClick={onProfileClick}
          type="button"
        >
          {avatar}
        </button>
      ) : avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center justify-start gap-5">
          <HeaderPill className="h-[58px] min-w-[140px]" key={primaryStats[0].label} variant="primary-brown" {...primaryStats[0]} />
          <HeaderPill className="h-[58px] min-w-[180px]" key={primaryStats[1].label} variant="primary-gold" {...primaryStats[1]} />
        </div>
        <div className="flex min-w-0 items-center gap-4">
          {resources.map((stat) => (
            <HeaderPill className="h-[58px] w-[165px] shrink-0" key={stat.label} {...stat} />
          ))}
          <HeaderPill className="h-[58px] w-[165px] shrink-0" {...population} />
        </div>
      </div>
    </header>
  );
}
