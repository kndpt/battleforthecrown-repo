import { BftcButton } from './BftcButton';
import { CostPill } from './CostRow';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface ScoutReportRow {
  hidden?: boolean;
  icon: string;
  label: string;
  value: string;
}

export interface ScoutReportColumn {
  rows: ScoutReportRow[];
  title: string;
}

export interface ScoutReportDefense {
  danger?: boolean;
  icon?: string;
  label: string;
}

export interface ScoutReportProps {
  actions?: { label: string; onClick?: () => void; variant?: 'success' | 'info' | 'danger' | 'warning' | 'neutral' }[];
  columns: ScoutReportColumn[];
  defenses?: ScoutReportDefense[];
  note?: string;
  subtitle: string;
  tag: string;
  target: string;
  time: string;
  title: string;
}

export function ScoutReport({ actions = [], columns, defenses = [], note, subtitle, tag, target, time, title }: ScoutReportProps) {
  return (
    <section className="w-full overflow-hidden rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
      <header className="flex items-center gap-2 border-b-2 border-[#1f2933] bg-gradient-to-b from-[#7a92a8] to-[#3d4f60] px-3 py-2 font-game text-sm font-extrabold text-white text-shadow-game">
        <img alt="" className="size-[22px]" src={publicAsset('/assets/position.png')} />
        {title}
        <span className="ml-auto rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[11px]">{tag}</span>
      </header>
      <div className="flex justify-between gap-2 border-b border-black/10 px-3 py-2 font-game text-[11px] text-[#6d5838]">
        <span>{subtitle} · <b className="text-xs text-[#3d2f1f]">{target}</b></span>
        <span>{time}</span>
      </div>
      {note ? <div className="border-b border-black/10 bg-black/[0.04] px-3 py-1.5 font-game text-[11px] italic text-[#6d5838]">{note}</div> : null}
      <div className="grid gap-2.5 p-3 md:grid-cols-2">
        {columns.map((column) => (
          <div key={column.title} className="rounded-[10px] border border-black/10 bg-white/40 px-2.5 py-2">
            <h5 className="mb-1.5 font-game text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d5838]">{column.title}</h5>
            {column.rows.map((row) => (
              <div key={row.label} className={cn('flex items-center justify-between py-0.5 font-game text-xs tabular-nums text-[#3d2f1f]', row.hidden ? 'text-[#7f8c8d]' : '')}>
                <span className="flex items-center gap-1.5"><img alt="" className="size-[18px]" src={publicAsset(row.icon)} />{row.label}</span>
                <b className={cn('font-bold', row.hidden ? 'blur-[3px] select-none' : '')}>{row.value}</b>
              </div>
            ))}
          </div>
        ))}
      </div>
      {defenses.length ? (
        <div className="flex flex-wrap gap-1.5 border-t border-black/10 px-3 pb-2.5 pt-1.5">
          <span className="self-center font-game text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d5838]">Défenses ·</span>
          {defenses.map((defense) => defense.icon ? <CostPill key={defense.label} icon={defense.icon} insufficient={defense.danger} value={defense.label} /> : <span key={defense.label} className="rounded-full border border-[#a93226] bg-[#e74c3c]/10 px-2 py-1 font-game text-[11px] font-bold text-[#a93226]">{defense.label}</span>)}
        </div>
      ) : null}
      {actions.length ? <footer className="flex justify-end gap-1.5 bg-black/[0.04] px-3 py-2">{actions.map((action) => <BftcButton key={action.label} onClick={action.onClick} size="xs" variant={action.variant}>{action.label}</BftcButton>)}</footer> : null}
    </section>
  );
}
