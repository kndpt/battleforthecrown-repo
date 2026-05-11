import { BftcButton } from './BftcButton';
import { CostPill, CostRow } from './CostRow';
import { PanelSurface } from './PanelSurface';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type CombatReportOutcome = 'win' | 'loss';

export interface CombatReportSide {
  name: string;
  location: string;
}

export interface CombatReportTroopLoss {
  icon: string;
  lost: string;
  sent: string;
}

export interface CombatReportTroopColumn {
  title: string;
  troops: CombatReportTroopLoss[];
}

export interface CombatReportLootItem {
  icon: string;
  value: string;
}

export interface CombatReportAction {
  label: string;
  onClick?: () => void;
  variant?: 'neutral' | 'info' | 'danger';
}

export interface CombatReportLine {
  label: string;
  tone?: 'danger' | 'neutral';
  value: string;
}

export interface CombatReportCardProps {
  actions?: CombatReportAction[];
  attacker: CombatReportSide;
  defender: CombatReportSide;
  icon: string;
  lines?: CombatReportLine[];
  loot?: CombatReportLootItem[];
  lootTitle?: string;
  outcome: CombatReportOutcome;
  title: string;
  troopColumns?: CombatReportTroopColumn[];
  versusLabel?: string;
}

const bannerClass: Record<CombatReportOutcome, string> = {
  win: 'from-[#6ebf49] to-[#4a8c2a]',
  loss: 'from-[#e74c3c] to-[#c0392b]',
};

export function CombatReportCard({
  actions = [],
  attacker,
  defender,
  icon,
  lines = [],
  loot = [],
  lootTitle = 'Butin ramené',
  outcome,
  title,
  troopColumns = [],
  versusLabel = 'VS',
}: CombatReportCardProps) {
  return (
    <PanelSurface className="overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_rgba(0,0,0,0.18)]">
      <div
        className={cn(
          'flex items-center gap-2.5 bg-gradient-to-b px-3 py-2 font-game text-base font-extrabold uppercase tracking-[0.08em] text-white text-shadow-game',
          bannerClass[outcome],
        )}
      >
        <img alt="" className="size-6" src={publicAsset(icon)} />
        {title}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-black/10 px-3 py-2.5">
        <ReportSide side={attacker} />
        <div className="font-game text-lg font-black text-[#a93226] [text-shadow:0_1px_0_#fff]">
          {versusLabel}
        </div>
        <ReportSide align="right" side={defender} />
      </div>
      {troopColumns.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5 border-b border-black/10 px-3 py-2">
          {troopColumns.map((column) => (
            <ReportTroopColumn key={column.title} column={column} />
          ))}
        </div>
      ) : null}
      {lines.map((line) => (
        <div
          key={line.label}
          className="flex items-center justify-between border-b border-black/10 px-3 py-2 font-game text-[11.5px] text-[#6d5838]"
        >
          <span>{line.label}</span>
          <b className={cn('font-bold text-[#3d2f1f]', line.tone === 'danger' && 'text-[#a93226]')}>
            {line.value}
          </b>
        </div>
      ))}
      {loot.length > 0 ? (
        <div className="px-3 py-2.5">
          <div className="mb-1 font-game text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6d5838]">
            {lootTitle}
          </div>
          <CostRow>
            {loot.map((item) => (
              <CostPill key={`${item.icon}-${item.value}`} icon={item.icon} value={item.value} />
            ))}
          </CostRow>
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex justify-end gap-1.5 bg-black/[0.04] px-3 py-2">
          {actions.map((action) => (
            <BftcButton
              key={action.label}
              className="px-2.5 py-1 text-[11px]"
              onClick={action.onClick}
              variant={action.variant ?? 'neutral'}
            >
              {action.label}
            </BftcButton>
          ))}
        </div>
      ) : null}
    </PanelSurface>
  );
}

function ReportSide({ align, side }: { align?: 'right'; side: CombatReportSide }) {
  return (
    <div className={align === 'right' ? 'text-right' : undefined}>
      <div className="font-game text-xs font-bold text-[#3d2f1f]">{side.name}</div>
      <div className="font-game text-[10px] text-[#6d5838]">{side.location}</div>
    </div>
  );
}

function ReportTroopColumn({ column }: { column: CombatReportTroopColumn }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-game text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#6d5838]">
        {column.title}
      </div>
      {column.troops.map((troop) => (
        <div
          key={`${troop.icon}-${troop.sent}-${troop.lost}`}
          className="flex items-center gap-1 font-game text-[11px] tabular-nums text-[#3d2f1f]"
        >
          <img alt="" className="size-[18px]" src={publicAsset(troop.icon)} />
          <span className="font-bold">{troop.sent}</span>
          <span>→</span>
          <span className="font-bold text-[#a93226]">{troop.lost}</span>
        </div>
      ))}
    </div>
  );
}

export interface CombatReportMiniItem {
  badge: string;
  lost?: boolean;
  subtitle: string;
  title: string;
  value: string;
}

export interface CombatReportMiniListProps {
  items: CombatReportMiniItem[];
}

export function CombatReportMiniList({ items }: CombatReportMiniListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <CombatReportMini key={`${item.badge}-${item.title}`} item={item} />
      ))}
    </div>
  );
}

function CombatReportMini({ item }: { item: CombatReportMiniItem }) {
  return (
    <PanelSurface className="flex items-center gap-2 rounded-[10px] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-lg border-2 font-game text-sm font-black text-white text-shadow-game',
          item.lost
            ? 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b]'
            : 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a]',
        )}
      >
        {item.badge}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-game text-xs font-bold leading-[1.1] text-[#3d2f1f]">{item.title}</div>
        <div className="truncate font-game text-[10.5px] text-[#6d5838]">{item.subtitle}</div>
      </div>
      <span
        className={cn(
          'rounded-full border border-black/20 bg-black/[0.06] px-1.5 py-0.5 font-game text-[10px] font-bold',
          item.lost ? 'text-[#a93226]' : 'text-[#3d2f1f]',
        )}
      >
        {item.value}
      </span>
    </PanelSurface>
  );
}
