import type { HTMLAttributes } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface HeaderBarStat {
  icon: string;
  label: string;
  value: string;
}

export interface HeaderBarProps extends HTMLAttributes<HTMLElement> {
  avatarInitials: string;
  level: string | number;
  onProfileClick?: () => void;
  population: HeaderBarStat;
  primaryStats: [HeaderBarStat, HeaderBarStat];
  resources: [HeaderBarStat, HeaderBarStat, HeaderBarStat];
}

function HeaderPill({ className, icon, label, value }: HeaderBarStat & { className?: string }) {
  return (
    <div
      aria-label={`${label} ${value}`}
      className={cn(
        'inline-flex min-w-0 items-center justify-center gap-[5px] rounded-full border-2 border-[rgba(255,255,255,.15)] bg-[rgba(0,0,0,.35)] px-2 py-0.5 font-game text-[11px] font-bold text-white shadow-none [font-variant-numeric:tabular-nums] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
        className,
      )}
    >
      <img alt="" className="size-3.5 shrink-0" src={publicAsset(icon)} />
      <span className="min-w-0 truncate">{value}</span>
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
        <div className="grid min-w-0 grid-cols-2 gap-2">
          {primaryStats.map((stat) => (
            <HeaderPill key={stat.label} {...stat} />
          ))}
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
