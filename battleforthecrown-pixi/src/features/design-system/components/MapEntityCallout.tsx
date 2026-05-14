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

export interface MapEntityCalloutSectionRow {
  icon?: string;
  label: string;
  value: string;
}

export interface MapEntityCalloutSection {
  title: string;
  rows: MapEntityCalloutSectionRow[];
}

export interface MapEntityCalloutProps {
  actions?: MapEntityCalloutAction[];
  className?: string;
  coordinates: string;
  sections?: MapEntityCalloutSection[];
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
  sections = [],
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
        'relative inline-flex min-w-[300px] max-w-[420px] flex-col rounded-[10px] border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#3d2f1f,#1a1a1a)] px-3.5 py-3 font-game text-[#fef9f0] shadow-[0_8px_18px_rgba(0,0,0,.5)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 text-[15px] font-extrabold text-[#f6d57b]">
        <span className="flex min-w-0 items-center gap-1.5">
          {titleIcon ? <span aria-hidden>{titleIcon}</span> : null}
          <span className="truncate">{title}</span>
        </span>
        <span className="shrink-0 font-mono text-[12px] font-semibold text-[#cdb88a]">
          {coordinates}
        </span>
      </div>

      <div className="mt-0.5 text-[12px] text-[#cdb88a]">{subtitle}</div>

      {(tier || stats.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tier ? (
            <span className="inline-flex items-center gap-[3px] rounded-full border border-[#9e7b0d] bg-[rgba(241,196,15,.18)] px-2 py-0.5 text-[12px] font-extrabold text-[#f6d57b]">
              {tier.label}
            </span>
          ) : null}
          {stats.map((stat) => (
            <span
              className="inline-flex items-center gap-[3px] text-[12px] text-[#fef9f0] tabular-nums"
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

      {sections.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[#6d552f] pt-2.5">
          {sections.map((section) => (
            <section
              className="rounded-[7px] border border-[#6d552f] bg-[rgba(255,244,221,.06)] px-2.5 py-2"
              key={section.title}
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f6d57b]">
                {section.title}
              </div>
              <div className="mt-1.5 grid gap-1">
                {section.rows.map((row) => (
                  <div
                    className="flex items-center justify-between gap-3 text-[12px]"
                    key={`${row.label}-${row.value}`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-[#cdb88a]">
                      {row.icon ? (
                        row.icon.startsWith('/')
                          ? <img alt="" className="size-[14px] shrink-0" src={publicAsset(row.icon)} />
                          : <span aria-hidden className="shrink-0">{row.icon}</span>
                      ) : null}
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span className="text-right font-bold text-[#fef9f0] tabular-nums">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {actions.map((action) => (
            <button
              className={cn(
                'flex min-h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-[6px] border-[1.5px] border-[rgba(0,0,0,.4)] px-2 py-1.5 font-game text-[12px] font-bold text-[#fef9f0] shadow-none [text-shadow:1px_1px_1px_rgba(0,0,0,.5)] disabled:cursor-not-allowed disabled:opacity-50',
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
