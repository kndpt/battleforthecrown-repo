import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';
import { BASE_MODAL_DEFAULT_MAX_HEIGHT, BASE_MODAL_DEFAULT_WIDTH, BaseModal } from './BaseModal';

export type ReinforcementReportTone = 'returned' | 'stationed';

export interface ReinforcementReportAction {
  disabled?: boolean;
  id: string;
  label: string;
  tone: 'danger' | 'neutral';
}

export interface ReinforcementReportPlace {
  coord: string;
  icon: string;
  label: string;
  name: string;
}

export interface ReinforcementReportUnit {
  icon: string;
  label: string;
  quantity: string;
}

export interface ReinforcementReportModalLabels {
  reportPrefix: string;
  unitsTitle: string;
}

export interface ReinforcementReportModalProps {
  actions: ReinforcementReportAction[];
  banner: string;
  className?: string;
  destination: ReinforcementReportPlace;
  heroIcon: string;
  labels: ReinforcementReportModalLabels;
  maxHeight?: number | string;
  onAction?: (action: ReinforcementReportAction) => void;
  origin: ReinforcementReportPlace;
  reportId: string;
  roleLabel: string;
  tone: ReinforcementReportTone;
  units: ReinforcementReportUnit[];
  when: string;
  width?: number | string;
}

const toneClass = {
  returned: {
    accent: 'gray' as const,
    banner: 'text-[#5d6d6e]',
    heroBg: 'bg-[linear-gradient(160deg,#465457_0%,#162024_100%)]',
    heroGlow:
      'bg-[radial-gradient(ellipse_at_50%_40%,rgba(149,165,166,.5)_0%,rgba(149,165,166,0)_70%)]',
    role:
      'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    route:
      'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)]',
  },
  stationed: {
    accent: 'green' as const,
    banner: 'text-[#2d6b16]',
    heroBg: 'bg-[linear-gradient(160deg,#1f3d18_0%,#0d1a07_100%)]',
    heroGlow:
      'bg-[radial-gradient(ellipse_at_50%_40%,rgba(126,199,78,.55)_0%,rgba(126,199,78,0)_70%)]',
    role:
      'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    route:
      'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
  },
};

const actionClass: Record<ReinforcementReportAction['tone'], string> = {
  danger:
    'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
  neutral:
    'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
};

function ReportActionButton({
  action,
  onAction,
}: {
  action: ReinforcementReportAction;
  onAction?: (action: ReinforcementReportAction) => void;
}) {
  return (
    <button
      className={cn(
        'inline-flex w-full items-center justify-center rounded-[10px] border-2 px-4 py-[9px] font-game text-sm font-bold shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] enabled:cursor-pointer enabled:hover:brightness-110 enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
        actionClass[action.tone],
      )}
      disabled={action.disabled}
      onClick={() => onAction?.(action)}
      type="button"
    >
      {action.label}
    </button>
  );
}

function ReportHero({
  banner,
  heroIcon,
  roleLabel,
  tone,
}: Pick<
  ReinforcementReportModalProps,
  'banner' | 'heroIcon' | 'roleLabel' | 'tone'
>) {
  const style = toneClass[tone];

  return (
    <div className="flex items-center gap-3 px-3.5 pb-2 pt-3">
      <div
        className={cn(
          'relative flex h-[86px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-[2.5px] border-[#3c2619] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_4px_0_rgba(0,0,0,.18)]',
          style.heroBg,
        )}
      >
        <span className={cn('absolute inset-0', style.heroGlow)} />
        <img
          alt=""
          className="relative z-[1] w-[74%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,.55)]"
          src={publicAsset(heroIcon)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div
          className={cn(
            'font-game text-2xl font-black leading-none [text-shadow:0_1px_0_rgba(255,255,255,.55)]',
            style.banner,
          )}
        >
          {banner}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded-full border-[1.5px] px-[7px] py-[2.5px] font-game text-[10px] font-extrabold uppercase shadow-[inset_0_1px_0_rgba(255,255,255,.35)]',
              style.role,
            )}
          >
            {roleLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoutePlace({
  align = 'left',
  place,
}: {
  align?: 'left' | 'right';
  place: ReinforcementReportPlace;
}) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div
        className={cn(
          'mb-1 flex items-center gap-1.5 font-game text-[9.5px] font-extrabold uppercase text-[#6d5838]',
          align === 'right' && 'justify-end',
        )}
      >
        <img alt="" className="size-4 object-contain" src={publicAsset(place.icon)} />
        {place.label}
      </div>
      <div className="truncate font-game text-[12px] font-extrabold text-[#3d2f1f]">
        {place.name}
      </div>
      <div className="font-game text-[10px] font-semibold text-[#6d5838]">
        {place.coord}
      </div>
    </div>
  );
}

function RouteStrip({
  destination,
  origin,
  tone,
}: {
  destination: ReinforcementReportPlace;
  origin: ReinforcementReportPlace;
  tone: ReinforcementReportTone;
}) {
  return (
    <div className="mx-3.5 mt-0.5 flex flex-col gap-2 rounded-[14px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(0,0,0,.05)]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <RoutePlace place={origin} />
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-full border-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(0,0,0,.2)]',
            toneClass[tone].route,
          )}
          aria-hidden
        >
          <ArrowRight size={17} strokeWidth={3} />
        </div>
        <RoutePlace align="right" place={destination} />
      </div>
    </div>
  );
}

function UnitManifest({
  title,
  units,
}: {
  title: string;
  units: ReinforcementReportUnit[];
}) {
  return (
    <div className="mx-3.5 flex flex-col gap-2 rounded-[14px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 py-2.5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(0,0,0,.05)]">
      <div className="font-game text-[9.5px] font-extrabold uppercase text-[#6d5838]">
        {title}
      </div>
      {units.length === 0 ? (
        <div className="rounded-[10px] border border-[rgba(60,38,25,.16)] bg-[rgba(255,250,238,.55)] px-3 py-2 font-game text-xs font-bold text-[#6d5838]">
          Aucune troupe consignée.
        </div>
      ) : (
        <div className="grid gap-1.5">
          {units.map((unit) => (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[10px] border border-[rgba(60,38,25,.16)] bg-[rgba(255,250,238,.55)] px-2.5 py-2"
              key={`${unit.label}-${unit.quantity}`}
            >
              <img
                alt=""
                className="size-7 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]"
                src={publicAsset(unit.icon)}
              />
              <span className="min-w-0 truncate font-game text-[12px] font-bold text-[#3d2f1f]">
                {unit.label}
              </span>
              <span className="font-game text-sm font-extrabold text-[#2d6b16] tabular-nums">
                {unit.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReinforcementReportModal({
  actions,
  banner,
  className,
  destination,
  heroIcon,
  labels,
  maxHeight = BASE_MODAL_DEFAULT_MAX_HEIGHT,
  onAction,
  origin,
  reportId,
  roleLabel,
  tone,
  units,
  when,
  width = BASE_MODAL_DEFAULT_WIDTH,
}: ReinforcementReportModalProps) {
  const footer = (
    <div className="flex flex-col gap-[9px]">
      <div className="flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase text-[#f0e0c0]">
          {labels.reportPrefix} {reportId}
        </span>
        <span className="font-game text-[9px] font-bold text-[#cdb88a]">{when}</span>
      </div>
      <div className="flex gap-2">
        {actions.map((action) => (
          <ReportActionButton action={action} key={action.id} onAction={onAction} />
        ))}
      </div>
    </div>
  );

  return (
    <BaseModal
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      className={className}
      footer={footer}
      footerClassName="flex flex-col gap-[9px]"
      maxHeight={maxHeight}
      tone={toneClass[tone].accent}
      width={width}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <ReportHero
          banner={banner}
          heroIcon={heroIcon}
          roleLabel={roleLabel}
          tone={tone}
        />
        <RouteStrip
          destination={destination}
          origin={origin}
          tone={tone}
        />
        <div className="h-2.5 shrink-0" />
        <UnitManifest title={labels.unitsTitle} units={units} />
        <div className="h-3 shrink-0" />
      </div>
    </BaseModal>
  );
}
