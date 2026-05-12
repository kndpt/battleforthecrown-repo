import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type MapEntityCalloutActionTone = 'attack' | 'scout' | 'support';

export interface MapEntityCalloutAction {
  disabled?: boolean;
  /** Emoji or public asset path. */
  icon?: string;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  tone: MapEntityCalloutActionTone;
}

export interface MapEntityCalloutStat {
  icon?: string;
  label?: string;
  value: string;
}

export interface MapEntityCalloutTier {
  label: string;
}

export interface MapEntityCalloutProps {
  actions?: MapEntityCalloutAction[];
  className?: string;
  coordinates: string;
  stats?: MapEntityCalloutStat[];
  subtitle: string;
  tier?: MapEntityCalloutTier;
  title: string;
  titleIcon?: string;
}

const actionToneClass: Record<MapEntityCalloutActionTone, string> = {
  attack: 'bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  scout: 'bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]',
  support: 'bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
};

export function MapEntityCallout({
  actions = [],
  className,
  coordinates,
  stats = [],
  subtitle,
  tier,
  title,
  titleIcon,
}: MapEntityCalloutProps) {
  const renderActionIcon = (icon: string) => (
    icon.startsWith('/')
      ? <img alt="" className="size-[15px]" src={publicAsset(icon)} />
      : <span aria-hidden>{icon}</span>
  );

  return (
    <article
      className={cn(
        'relative inline-flex min-w-[180px] max-w-[360px] flex-col rounded-[10px] border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#3d2f1f,#1a1a1a)] px-[10px] py-2 font-game text-[#fef9f0] shadow-[0_6px_14px_rgba(0,0,0,.5)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold text-[#f6d57b]">
        <span className="flex min-w-0 items-center gap-1.5">
          {titleIcon ? <span aria-hidden>{titleIcon}</span> : null}
          <span className="truncate">{title}</span>
        </span>
        <span className="font-mono text-[10.5px] font-semibold text-[#cdb88a]">
          {coordinates}
        </span>
      </div>

      <div className="mt-px text-[11px] text-[#cdb88a]">{subtitle}</div>

      {(tier || stats.length > 0) && (
        <div className="mt-[5px] flex flex-wrap gap-2">
          {tier ? (
            <span className="inline-flex items-center gap-[3px] rounded-full border border-[#9e7b0d] bg-[rgba(241,196,15,.18)] px-[6px] py-px text-[10.5px] font-extrabold text-[#f6d57b]">
              {tier.label}
            </span>
          ) : null}
          {stats.map((stat) => (
            <span
              className="inline-flex items-center gap-[3px] text-[10.5px] text-[#fef9f0] tabular-nums"
              key={`${stat.label ?? stat.value}-${stat.value}`}
            >
              {stat.icon ? (
                <img alt="" className="size-[11px]" src={publicAsset(stat.icon)} />
              ) : stat.label ? (
                <span>{stat.label}</span>
              ) : null}
              {stat.value}
            </span>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-[7px] flex gap-[5px]">
          {actions.map((action) => (
            <button
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-[6px] border-[1.5px] border-[rgba(0,0,0,.4)] px-[6px] py-1 font-game text-[10.5px] font-bold text-[#fef9f0] shadow-none [text-shadow:1px_1px_1px_rgba(0,0,0,.5)] disabled:cursor-not-allowed disabled:opacity-50',
                actionToneClass[action.tone],
              )}
              disabled={action.disabled}
              key={`${action.tone}-${action.label}`}
              onClick={action.onClick}
              type="button"
            >
              {action.icon ? renderActionIcon(action.icon) : null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
