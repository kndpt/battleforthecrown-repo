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
  population: HeaderBarStat;
  primaryStats: [HeaderBarStat, HeaderBarStat];
  resources: [HeaderBarStat, HeaderBarStat, HeaderBarStat];
}

type PillVariant = 'resource' | 'primary-brown' | 'primary-gold';

const PILL_VARIANT_CLASS: Record<PillVariant, string> = {
  resource:
    'gap-[5px] rounded-full border-2 border-[rgba(255,255,255,.15)] bg-[rgba(0,0,0,.35)] px-2 py-0.5 text-[11px] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
  'primary-brown':
    'gap-1.5 rounded-full border border-[#3d2f1f] bg-[linear-gradient(to_bottom,#7a5a3a,#4e3826)] px-2.5 py-0.5 text-[12px] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.65)]',
  'primary-gold':
    'gap-1.5 rounded-full border border-[#8a6a14] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] px-2.5 py-0.5 text-[12px] text-[#3a2a00]',
};

const PILL_ICON_CLASS: Record<PillVariant, string> = {
  resource: 'size-3.5',
  'primary-brown': 'size-4',
  'primary-gold': 'size-4',
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
            'pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-300',
            isAtCapacity
              ? 'bg-gradient-to-r from-red-500/35 to-red-400/45'
              : 'bg-gradient-to-r from-white/25 to-white/10',
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
  population,
  primaryStats,
  resources,
  ...props
}: HeaderBarProps) {
  const avatar = (
    <span className="relative flex size-[42px] shrink-0 items-center justify-center rounded-full border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#8b6f47,#6d5838)] font-game text-[13px] font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]">
      {avatarInitials}
      <span className="absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] font-game text-[9px] font-bold text-[#3a2a00]">
        {level}
      </span>
    </span>
  );

  return (
    <header
      className={cn(
        'flex w-full items-center gap-2 rounded-[10px] border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,rgba(60,38,25,.85),rgba(78,56,34,.85))] p-2',
        className,
      )}
      {...props}
    >
      {onProfileClick ? (
        <button aria-label="Profil joueur" className="shrink-0" onClick={onProfileClick} type="button">
          {avatar}
        </button>
      ) : avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center justify-start gap-2">
          <HeaderPill key={primaryStats[0].label} variant="primary-brown" {...primaryStats[0]} />
          <HeaderPill key={primaryStats[1].label} variant="primary-gold" {...primaryStats[1]} />
        </div>
        <div className="grid min-w-0 grid-cols-[repeat(4,minmax(0,1fr))] gap-1.5">
          {resources.map((stat) => (
            <HeaderPill className="px-1.5" key={stat.label} {...stat} />
          ))}
          <HeaderPill className="px-1.5" {...population} />
        </div>
      </div>
    </header>
  );
}
