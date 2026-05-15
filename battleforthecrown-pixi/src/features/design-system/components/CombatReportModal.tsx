import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';
import { BaseModal } from './BaseModal';

export type CombatReportOutcome = 'lose' | 'win';
export type CombatReportActionId = 'details' | 'retaliate' | 'share' | string;
export type CombatReportUnitSide = 'attacker' | 'defender';
export type CombatReportHighlightKind = 'loot' | 'lootLost';

export interface CombatReportParticipant {
  coord: string;
  name: string;
  place: string;
}

export interface CombatReportUnit {
  icon: string;
  lost: number;
  name: string;
  sent: number;
}

export interface CombatReportHighlightChip {
  icon: string;
  remainingValue?: string;
  value: string;
}

export interface CombatReportHighlight {
  chips: CombatReportHighlightChip[];
  kind: CombatReportHighlightKind;
  title: string;
}

export interface CombatReportAction {
  disabled?: boolean;
  id: CombatReportActionId;
  label: string;
  tone: 'danger' | 'neutral' | 'success';
}

export interface CombatReportModalLabels {
  attackerTitle: string;
  defenderTitle: string;
  lossesTitle: string;
  reportPrefix: string;
}

export interface CombatReportModalProps {
  actions: CombatReportAction[];
  attacker: CombatReportParticipant;
  attackerUnits: CombatReportUnit[];
  battleId: string;
  banner: string;
  className?: string;
  defender: CombatReportParticipant;
  defenderUnits: CombatReportUnit[];
  highlight?: CombatReportHighlight;
  isPlayerAttacker: boolean;
  labels: CombatReportModalLabels;
  maxHeight?: number | string;
  motto: string;
  onAction?: (action: CombatReportAction) => void;
  outcome: CombatReportOutcome;
  roleLabel: string;
  type: string;
  when: string;
  width?: number | string;
}

const outcomeTone = {
  lose: {
    accent: 'red' as const,
    banner: 'text-[#a93226]',
    heroBg: 'bg-[linear-gradient(160deg,#4a1410_0%,#1d0606_100%)]',
    heroGlow:
      'bg-[radial-gradient(ellipse_at_50%_40%,rgba(231,76,60,.55)_0%,rgba(231,76,60,0)_70%)]',
    heroIcon: '/assets/icons/hand-red.png',
    role:
      'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    tint:
      'bg-[radial-gradient(ellipse_at_50%_35%,rgba(231,76,60,.22)_0%,rgba(231,76,60,0)_65%)]',
    vs: 'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  },
  win: {
    accent: 'green' as const,
    banner: 'text-[#2d6b16]',
    heroBg: 'bg-[linear-gradient(160deg,#1f3d18_0%,#0d1a07_100%)]',
    heroGlow:
      'bg-[radial-gradient(ellipse_at_50%_40%,rgba(126,199,78,.55)_0%,rgba(126,199,78,0)_70%)]',
    heroIcon: '/assets/casual-icons/crown.png',
    role:
      'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    tint:
      'bg-[radial-gradient(ellipse_at_50%_35%,rgba(126,199,78,.22)_0%,rgba(126,199,78,0)_65%)]',
    vs: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
  },
};

const actionClass: Record<CombatReportAction['tone'], string> = {
  danger:
    'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
  neutral:
    'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
  success:
    'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
};

const formatCount = (value: number) => value.toLocaleString('fr-FR');

function PixelActionButton({
  action,
  onAction,
}: {
  action: CombatReportAction;
  onAction?: (action: CombatReportAction) => void;
}) {
  return (
    <button
      className={cn(
        'inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-2 px-[18px] py-[9px] font-game text-sm font-bold tracking-[.04em] shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] enabled:cursor-pointer enabled:hover:brightness-110 enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
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
  battleId,
  banner,
  isPlayerAttacker,
  motto,
  outcome,
  roleLabel,
  them,
  type,
  when,
}: {
  battleId: string;
  banner: string;
  isPlayerAttacker: boolean;
  motto: string;
  outcome: CombatReportOutcome;
  roleLabel: string;
  them: CombatReportParticipant;
  type: string;
  when: string;
}) {
  const tone = outcomeTone[outcome];

  return (
    <div className="flex items-stretch gap-3 px-3.5 pb-2 pt-3">
      <div
        className={cn(
          'relative flex h-[86px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-[2.5px] border-[#3c2619] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_4px_0_rgba(0,0,0,.18)]',
          tone.heroBg,
        )}
      >
        <span className={cn('absolute inset-0', tone.heroGlow)} />
        <img
          alt=""
          className="relative z-[1] w-[64%] drop-shadow-[0_4px_6px_rgba(0,0,0,.55)]"
          src={publicAsset(tone.heroIcon)}
        />
        <span className="absolute bottom-1 left-1 z-[2] rounded border border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] px-[5px] py-0.5 font-game text-[7.5px] font-extrabold tracking-[.18em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]">
          {battleId}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="font-game text-[9px] font-bold uppercase tracking-[.28em] text-[#6d5838]">
          {type} · {when}
        </div>
        <div
          className={cn(
            'font-game text-2xl font-black leading-none tracking-[.02em] [text-shadow:0_1px_0_rgba(255,255,255,.55)]',
            tone.banner,
          )}
        >
          {banner}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded-full border-[1.5px] px-[7px] py-[2.5px] font-game text-[9.5px] font-extrabold uppercase tracking-[.14em] shadow-[inset_0_1px_0_rgba(255,255,255,.35)]',
              tone.role,
            )}
          >
            {roleLabel}
          </span>
          <span className="font-game text-[10.5px] font-bold text-[#6d5838]">
            vs {them.name}
          </span>
          <span className="sr-only">
            {isPlayerAttacker ? 'Vous êtes attaquant' : 'Vous êtes défenseur'}
          </span>
        </div>
        <div className="mt-0.5 border-l-2 border-[rgba(60,38,25,.25)] pl-2 font-game text-[10.5px] italic text-[#6d5838]">
          {motto}
        </div>
      </div>
    </div>
  );
}

function VersusStrip({
  left,
  outcome,
  right,
}: {
  left: CombatReportParticipant;
  outcome: CombatReportOutcome;
  right: CombatReportParticipant;
}) {
  return (
    <div className="mx-3.5 mt-0.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[10px] border border-[rgba(60,38,25,.2)] bg-[linear-gradient(to_bottom,rgba(60,38,25,.06),rgba(60,38,25,.12))] px-2.5 py-[7px]">
      <div className="min-w-0">
        <div className="truncate font-game text-[11.5px] font-extrabold tracking-[.02em] text-[#3d2f1f]">
          {left.name}
        </div>
        <div className="font-game text-[9.5px] font-semibold tracking-[.04em] text-[#6d5838]">
          {left.place} · {left.coord}
        </div>
      </div>
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-full border-2 font-game text-xs font-black tracking-[.04em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]',
          outcomeTone[outcome].vs,
        )}
      >
        VS
      </div>
      <div className="min-w-0 text-right">
        <div className="truncate font-game text-[11.5px] font-extrabold tracking-[.02em] text-[#3d2f1f]">
          {right.name}
        </div>
        <div className="font-game text-[9.5px] font-semibold tracking-[.04em] text-[#6d5838]">
          {right.place} · {right.coord}
        </div>
      </div>
    </div>
  );
}

function UnitColumn({
  title,
  units,
}: {
  title: string;
  units: CombatReportUnit[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-[#6d5838]">
        {title}
      </div>
      {units.map((unit) => (
        <div
          className="flex items-center gap-1.5 font-game text-xs text-[#3d2f1f] tabular-nums"
          key={`${unit.name}-${unit.sent}-${unit.lost}`}
        >
          <img
            alt=""
            className="size-[22px] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]"
            src={publicAsset(unit.icon)}
          />
          <span className="font-bold">{formatCount(unit.sent)}</span>
          <span className="text-[#6d5838]">→</span>
          <span className="font-extrabold text-[#a93226]">−{formatCount(unit.lost)}</span>
        </div>
      ))}
    </div>
  );
}

function UnitRoster({
  attackerTitle,
  attackerUnits,
  defenderTitle,
  defenderUnits,
}: {
  attackerTitle: string;
  attackerUnits: CombatReportUnit[];
  defenderTitle: string;
  defenderUnits: CombatReportUnit[];
}) {
  return (
    <div className="relative mx-3.5 grid grid-cols-2 gap-3.5 rounded-[14px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 py-[11px] pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(0,0,0,.05)]">
      <UnitColumn title={attackerTitle} units={attackerUnits} />
      <UnitColumn title={defenderTitle} units={defenderUnits} />
      <span className="absolute bottom-3 left-1/2 top-3 w-px -translate-x-1/2 bg-[rgba(60,38,25,.16)]" />
    </div>
  );
}

function HighlightStrip({ highlight }: { highlight: CombatReportHighlight }) {
  const amountClass =
    highlight.kind === 'lootLost' ? 'text-[#a93226]' : 'text-[#4a8c2a]';

  return (
    <div className="mx-3.5 flex flex-col gap-[7px] rounded-[14px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 py-2.5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(0,0,0,.05)]">
      <div className="font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-[#6d5838]">
        {highlight.title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {highlight.chips.map((chip) => (
          <span
            className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-[rgba(0,0,0,.18)] bg-[rgba(0,0,0,.06)] py-[3px] pl-1 pr-2 font-game text-xs font-bold text-[#3d2f1f] tabular-nums"
            key={`${chip.icon}-${chip.value}`}
          >
            <img
              alt=""
              className="size-4 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]"
              src={publicAsset(chip.icon)}
            />
            <span className={cn('font-extrabold', amountClass)}>{chip.value}</span>
            {chip.remainingValue ? (
              <>
                <span className="text-[#6d5838]">/</span>
                <span className="font-extrabold text-[#111827]">{chip.remainingValue}</span>
              </>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CombatReportModal({
  actions,
  attacker,
  attackerUnits,
  battleId,
  banner,
  className,
  defender,
  defenderUnits,
  highlight,
  isPlayerAttacker,
  labels,
  maxHeight = 680,
  motto,
  onAction,
  outcome,
  roleLabel,
  type,
  when,
  width = 334,
}: CombatReportModalProps) {
  const them = isPlayerAttacker ? defender : attacker;
  const footer = (
    <div className="flex flex-col gap-[9px]">
      <div className="flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase tracking-[.18em] text-[#f0e0c0]">
          {labels.reportPrefix} {battleId}
        </span>
        <span className="font-game text-[9px] font-bold tracking-[.14em] text-[#cdb88a]">
          {when}
        </span>
      </div>
      <div className="flex gap-2">
        {actions.map((action) => (
          <PixelActionButton action={action} key={action.id} onAction={onAction} />
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
      tone={outcomeTone[outcome].accent}
      width={width}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <ReportHero
          battleId={battleId}
          banner={banner}
          isPlayerAttacker={isPlayerAttacker}
          motto={motto}
          outcome={outcome}
          roleLabel={roleLabel}
          them={them}
          type={type}
          when={when}
        />
        <VersusStrip left={attacker} outcome={outcome} right={defender} />

        <div className="mx-3.5 mb-2 mt-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
          <span className="font-game text-[9px] font-extrabold uppercase tracking-[.28em] text-[#6d5838]">
            {labels.lossesTitle}
          </span>
          <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
        </div>

        <UnitRoster
          attackerTitle={labels.attackerTitle}
          attackerUnits={attackerUnits}
          defenderTitle={labels.defenderTitle}
          defenderUnits={defenderUnits}
        />

        {highlight ? (
          <>
            <div className="h-2.5 shrink-0" />
            <HighlightStrip highlight={highlight} />
          </>
        ) : null}
        <div className="h-3 shrink-0" />
      </div>
    </BaseModal>
  );
}

export function CombatReportPhoneFrame({
  children,
  outcome,
}: {
  children: ReactNode;
  outcome: CombatReportOutcome;
}) {
  return (
    <div className="relative h-[720px] w-[360px] overflow-hidden rounded-[36px] border-[8px] border-[#0c0c1a] bg-[#1a1a2e] shadow-[0_30px_60px_rgba(0,0,0,.6),inset_0_0_0_2px_#2a2a45]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#7c9756_0%,#a8b977_28%,#cdbf8e_60%,#b89968_100%)]">
        <div className="absolute inset-x-0 top-0 h-[62px] border-b-2 border-[#8b7355] bg-[linear-gradient(to_bottom,rgba(60,38,25,.94),rgba(78,56,34,.94))]" />
        <img
          alt=""
          className="absolute left-[60px] top-[200px] w-[140px] opacity-[.72]"
          src={publicAsset('/assets/castle.png')}
        />
        <img
          alt=""
          className="absolute left-[200px] top-[380px] w-[110px] opacity-[.65]"
          src={publicAsset('/assets/barracks.png')}
        />
        <img
          alt=""
          className="absolute left-[30px] top-[440px] w-[90px] opacity-[.65]"
          src={publicAsset('/assets/watchtower.png')}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 border-t-2 border-[#8b7355] bg-[linear-gradient(to_top,rgba(60,38,25,.95),rgba(78,56,34,.9))]" />
        <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] [backdrop-filter:blur(2px)]" />
        <div className={cn('absolute inset-0 pointer-events-none', outcomeTone[outcome].tint)} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-2.5">{children}</div>
    </div>
  );
}
