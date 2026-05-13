import type { ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type ScoutReportVerdictTone = 'default' | 'danger';

export interface ScoutReportVerdict {
  label: string;
  tone?: ScoutReportVerdictTone;
  value: string;
}

export interface ScoutReportStat {
  hidden?: boolean;
  icon: string;
  label: string;
  lossValue?: string;
  value: string;
}

export interface ScoutReportSection {
  items: ScoutReportStat[];
  title: string;
}

export interface ScoutReportAction {
  disabled?: boolean;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export interface ScoutReportCardProps {
  action: ScoutReportAction;
  bannerIcon: string;
  className?: string;
  hideFooter?: boolean;
  hideHeader?: boolean;
  metaLabel?: string;
  note?: string;
  onClose?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  sections: ScoutReportSection[];
  targetName: string;
  targetPrefix: string;
  timeLabel: string;
  title: string;
  verdicts: ScoutReportVerdict[];
  villageLabel: string;
}

const verdictToneClass: Record<ScoutReportVerdictTone, string> = {
  default: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,rgba(241,196,15,.20),rgba(241,196,15,.06))] text-[#3d2f1f]',
  danger: 'border-[#a93226] bg-[linear-gradient(to_bottom,rgba(231,76,60,.18),rgba(231,76,60,.05))] text-[#a93226]',
};

export function ScoutReportCard({
  action,
  bannerIcon,
  className,
  hideFooter = false,
  hideHeader = false,
  metaLabel,
  note,
  onClose,
  sections,
  targetName,
  targetPrefix,
  timeLabel,
  title,
  verdicts,
  villageLabel,
}: ScoutReportCardProps) {
  return (
    <article
      className={cn(
        'flex w-[360px] flex-col overflow-hidden rounded-[14px] border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_4px_0_rgba(0,0,0,.22),0_6px_14px_rgba(0,0,0,.28)]',
        className,
      )}
    >
      {!hideHeader ? (
        <header className="flex min-h-[70px] items-center gap-3 border-b-2 border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#1f5288)] px-4 py-4 font-game text-[16px] font-extrabold uppercase tracking-[.06em] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]">
          <img alt="" className="size-[26px]" src={publicAsset(bannerIcon)} />
          <span>{title}</span>
          <span className="ml-auto" />
          {metaLabel ? (
            <span className="rounded-full border border-[rgba(255,255,255,.18)] bg-[rgba(0,0,0,.32)] px-2 py-[3px] text-[10px] font-bold normal-case tracking-[.02em]">
              {metaLabel}
            </span>
          ) : null}
          {onClose ? (
            <button
              aria-label="Fermer"
              className="flex size-7 items-center justify-center rounded-full bg-[rgba(0,0,0,.28)] text-white transition hover:bg-[rgba(0,0,0,.40)]"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" strokeWidth={3} />
            </button>
          ) : null}
        </header>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-b border-[rgba(0,0,0,.08)] px-3 py-[9px] font-game text-[11px] text-[#6d5838]">
        <div className="flex min-w-0 flex-col gap-px">
          <span>
            {targetPrefix} · <b className="text-[13px] font-extrabold tracking-[.02em] text-[#3d2f1f]">{targetName}</b>
          </span>
          <span className="text-[10.5px] tabular-nums text-[#6d5838]">{villageLabel}</span>
        </div>
        <span className="whitespace-nowrap text-[10.5px] text-[#6d5838]">{timeLabel}</span>
      </div>

      {note ? (
        <p className="border-b border-[rgba(0,0,0,.08)] bg-[rgba(0,0,0,.04)] px-3 py-2 font-game text-[11px] italic leading-[1.35] text-[#6d5838]">
          {note}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 border-b border-[rgba(0,0,0,.08)] px-3 py-2.5">
        {verdicts.map((verdict) => {
          const tone = verdict.tone ?? 'default';

          return (
            <div className={cn('flex flex-col gap-0.5 rounded-[10px] border-[1.5px] px-2.5 py-2 font-game', verdictToneClass[tone])} key={verdict.label}>
              <span className={cn('text-[9px] font-bold uppercase tracking-[.14em]', tone === 'danger' ? 'text-[#a93226]' : 'text-[#6d5838]')}>
                {verdict.label}
              </span>
              <span className={cn('text-xl font-extrabold leading-[1.1] tracking-[.01em] tabular-nums', tone === 'danger' ? 'text-[#a93226]' : 'text-[#3d2f1f]')}>
                {verdict.value}
              </span>
            </div>
          );
        })}
      </div>

      {sections.map((section) => (
        <section className="border-b border-[rgba(0,0,0,.08)] px-3 py-2.5 last:border-b-0" key={section.title}>
          <div className="flex items-center gap-2 font-game text-[10px] font-bold uppercase tracking-[.16em] text-[#6d5838] after:h-px after:flex-1 after:bg-[rgba(0,0,0,.12)]">
            {section.title}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {section.items.map((item) => (
              <div className="flex items-center gap-2 font-game text-[13px] tabular-nums text-[#3d2f1f]" key={`${section.title}-${item.label}`}>
                <img alt="" className="size-[22px] flex-none object-contain" src={publicAsset(item.icon)} />
                <span className="flex-1 text-[11px] text-[#6d5838]">{item.label}</span>
                {item.lossValue ? (
                  <span className="flex items-baseline gap-2">
                    <b className="text-sm font-extrabold">{item.value}</b>
                    <span className="text-sm font-extrabold text-[#6d5838]">→</span>
                    <b className="text-sm font-extrabold text-[#a93226]">{item.lossValue}</b>
                  </span>
                ) : (
                  <b className={cn('text-sm font-extrabold', item.hidden ? 'select-none text-[#7f8c8d] blur-[4px]' : '')}>{item.value}</b>
                )}
                {item.hidden ? <span className="text-[11px]">🔒</span> : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      {!hideFooter ? (
        <footer className="mt-auto bg-[rgba(0,0,0,.04)] p-3">
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border-2 border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] px-4 py-2.5 font-game text-sm font-bold uppercase tracking-[.06em] text-white shadow-[0_2px_0_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.25)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)] disabled:cursor-not-allowed disabled:opacity-[.5]"
            disabled={action.disabled}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        </footer>
      ) : null}
    </article>
  );
}
