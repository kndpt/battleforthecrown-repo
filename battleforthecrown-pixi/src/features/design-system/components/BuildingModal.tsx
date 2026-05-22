import type { ReactNode } from 'react';
import { BASE_MODAL_DEFAULT_MAX_HEIGHT, BASE_MODAL_DEFAULT_WIDTH, BaseModal } from './BaseModal';
import { Timer } from './Timer';
import { publicAsset } from '@/lib/publicAsset';

export type BuildingModalActionTone = 'danger' | 'neutral' | 'success' | 'warning';
export type BuildingModalNoticeTone = 'danger' | 'info' | 'warning';

export interface BuildingModalAccent {
  border: string;
  dark: string;
  haloTint: string;
  light: string;
}

export interface BuildingModalBadge {
  icon?: string;
  label: string;
}

export interface BuildingModalLabels {
  close: string;
  subtitle: string;
}

export interface BuildingModalAction {
  disabled?: boolean;
  id: string;
  label: string;
  tone: BuildingModalActionTone;
}

export interface BuildingModalConstruction {
  progressPercent: number;
  remainingLabel: string;
  title?: string;
}

export interface BuildingModalNotice {
  body?: string;
  title: string;
  tone: BuildingModalNoticeTone;
}

export interface BuildingModalProps {
  accent: BuildingModalAccent;
  actions?: BuildingModalAction[];
  buildingIcon: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  construction?: BuildingModalConstruction;
  eyebrow: string;
  footer?: ReactNode;
  footerContent?: ReactNode;
  footerClassName?: string;
  footerHint?: ReactNode;
  labels?: Partial<BuildingModalLabels>;
  level: number;
  maxHeight?: number | string;
  name: string;
  notice?: BuildingModalNotice;
  onAction?: (action: BuildingModalAction) => void;
  summaryBadges?: BuildingModalBadge[];
  summaryLabel?: string;
  tagline?: string;
  width?: number | string;
}

const defaultLabels: BuildingModalLabels = {
  close: 'Fermer',
  subtitle: 'Bâtiment',
};

const actionToneStyles: Record<BuildingModalActionTone, { background: string; borderColor: string; color: string; textShadow: string }> = {
  danger: {
    background: 'linear-gradient(to bottom, #e74c3c, #c0392b)',
    borderColor: '#a93226',
    color: '#fff',
    textShadow: '1px 1px 2px rgba(0,0,0,.6)',
  },
  neutral: {
    background: 'linear-gradient(to bottom, #95a5a6, #7f8c8d)',
    borderColor: '#5d6d6e',
    color: '#fff',
    textShadow: '1px 1px 2px rgba(0,0,0,.6)',
  },
  success: {
    background: 'linear-gradient(to bottom, #6ebf49, #4a8c2a)',
    borderColor: '#3a6c1f',
    color: '#fff',
    textShadow: '1px 1px 2px rgba(0,0,0,.6)',
  },
  warning: {
    background: 'linear-gradient(to bottom, #f1c40f, #d4a017)',
    borderColor: '#9e7b0d',
    color: '#3a2a00',
    textShadow: 'none',
  },
};

const noticeToneClass: Record<BuildingModalNoticeTone, string> = {
  danger: 'border-[#a93226] bg-[linear-gradient(to_bottom,rgba(231,76,60,.16),rgba(231,76,60,.08))] text-[#7a241c]',
  info: 'border-[#1f5288] bg-[linear-gradient(to_bottom,rgba(91,155,213,.16),rgba(91,155,213,.08))] text-[#1f5288]',
  warning: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,rgba(241,196,15,.18),rgba(241,196,15,.08))] text-[#5a4400]',
};

function BuildingModalBadgePill({
  accent,
  badge,
}: {
  accent: BuildingModalAccent;
  badge: BuildingModalBadge;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border-[1.5px] py-[2.5px] pl-1 pr-[7px] font-game text-[9.5px] font-extrabold uppercase tracking-[.14em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]"
      style={{
        background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
        borderColor: accent.border,
      }}
    >
      {badge.icon ? <img alt="" className="size-[13px]" src={publicAsset(badge.icon)} /> : null}
      {badge.label}
    </span>
  );
}

export function BuildingModalHero({
  accent,
  buildingIcon,
  labels,
  level,
  name,
  summaryBadges = [],
  summaryLabel,
  tagline,
}: {
  accent: BuildingModalAccent;
  buildingIcon: string;
  labels: BuildingModalLabels;
  level: number;
  name: string;
  summaryBadges?: BuildingModalBadge[];
  summaryLabel?: string;
  tagline?: string;
}) {
  return (
    <div className="flex items-stretch gap-3 px-3.5 pb-2 pt-3">
      <div
        className="relative h-[90px] w-[86px] shrink-0 overflow-hidden rounded-[14px] border-[2.5px] border-[#3c2619] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_4px_0_rgba(0,0,0,.18)]"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${accent.haloTint} 0%, rgba(60,38,25,0) 60%), linear-gradient(160deg, #5f3d2b 0%, #2e1c12 100%)`,
        }}
      >
        <img
          alt={name}
          className="absolute left-1/2 top-[52%] w-[108%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,.45)]"
          src={publicAsset(buildingIcon)}
        />
        <span
          className="absolute bottom-1 left-1 inline-flex items-center gap-[3px] rounded-[5px] border-[1.5px] px-1.5 py-0.5 font-game text-[9px] font-extrabold tracking-[.16em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]"
          style={{
            background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
            borderColor: accent.border,
          }}
        >
          NIV. {level}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="font-game text-[9px] font-bold uppercase tracking-[.28em] text-[#6d5838]">{labels.subtitle}</div>
        <div className="font-game text-[21px] font-black leading-[1.05] tracking-[.01em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
          {name}
        </div>
        {(summaryBadges.length > 0 || summaryLabel) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {summaryBadges.map((badge) => (
              <BuildingModalBadgePill accent={accent} badge={badge} key={badge.label} />
            ))}
            {summaryLabel ? <span className="font-game text-[10.5px] font-bold text-[#6d5838]">{summaryLabel}</span> : null}
          </div>
        )}
        {tagline ? (
          <div className="mt-0.5 border-l-2 border-[rgba(60,38,25,.25)] pl-2 font-game text-[10.5px] italic text-[#6d5838]">
            {tagline}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BuildingModalActionButton({
  action,
  full,
  onAction,
}: {
  action: BuildingModalAction;
  full?: boolean;
  onAction?: (action: BuildingModalAction) => void;
}) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-[10px] border-2 px-[18px] py-[9px] font-game text-sm font-bold tracking-[.04em] shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] transition-[transform,filter] duration-100',
        full ? 'w-full' : 'w-auto',
        action.disabled ? 'cursor-not-allowed opacity-[.5]' : 'cursor-pointer hover:brightness-[1.08] active:translate-y-0.5 active:shadow-[0_1px_0_rgba(0,0,0,.22),inset_0_2px_4px_rgba(0,0,0,.4)]',
      ].join(' ')}
      disabled={action.disabled}
      onClick={() => onAction?.(action)}
      style={actionToneStyles[action.tone]}
      type="button"
    >
      {action.label}
    </button>
  );
}

export function BuildingModalConstructionPanel({
  cancelAction,
  construction,
  onAction,
}: {
  cancelAction?: BuildingModalAction;
  construction: BuildingModalConstruction;
  onAction?: (action: BuildingModalAction) => void;
}) {
  const progressPercent = Math.max(0, Math.min(100, construction.progressPercent));

  return (
    <div className="rounded-xl border border-[rgba(241,196,15,.42)] bg-[linear-gradient(to_bottom,rgba(60,38,25,.78),rgba(38,24,16,.88))] px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_2px_0_rgba(0,0,0,.18)]">
      <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="min-w-0">
          <div className="font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-[#f0e0c0]">
            {construction.title ?? 'Construction en cours'}
          </div>
          <Timer className="mt-1" size="xs" tone="gold">
            {construction.remainingLabel}
          </Timer>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] px-2 py-0.5 font-game text-[10px] font-extrabold text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">
            {progressPercent.toFixed(0)}%
          </span>
          {cancelAction ? (
            <button
              aria-label={cancelAction.label}
              className="flex size-8 cursor-pointer items-center justify-center rounded-[9px] border-2 border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] font-game text-lg font-black leading-none text-white shadow-[0_2px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)] disabled:cursor-not-allowed disabled:opacity-[.5]"
              disabled={cancelAction.disabled}
              onClick={() => onAction?.(cancelAction)}
              title={cancelAction.label}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border-[1.5px] border-[rgba(0,0,0,.38)] bg-[rgba(255,255,255,.18)] shadow-[inset_0_1px_2px_rgba(0,0,0,.45)]">
        <div
          className="absolute inset-y-0 left-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45),inset_0_-2px_4px_rgba(0,0,0,.18)]"
          style={{
            background: 'linear-gradient(to bottom, #f1c40f, #d4a017)',
            width: `${progressPercent}%`,
          }}
        />
      </div>
    </div>
  );
}

export function BuildingModalNoticePanel({ notice }: { notice: BuildingModalNotice }) {
  return (
    <div
      className={[
        'mx-3.5 mt-3 rounded-xl border-2 px-3 py-2.5 font-game shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
        noticeToneClass[notice.tone],
      ].join(' ')}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[.18em]">{notice.title}</div>
      {notice.body ? <div className="mt-1 text-[11px] font-bold leading-snug opacity-[.82]">{notice.body}</div> : null}
    </div>
  );
}

export function BuildingModal({
  accent,
  actions,
  buildingIcon,
  children,
  className,
  construction,
  footer,
  footerContent,
  footerClassName,
  footerHint,
  labels: labelsProp,
  level,
  maxHeight = BASE_MODAL_DEFAULT_MAX_HEIGHT,
  name,
  notice,
  onAction,
  summaryBadges,
  summaryLabel,
  tagline,
  width = BASE_MODAL_DEFAULT_WIDTH,
}: BuildingModalProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const constructionAction = construction ? actions?.find((action) => action.id === 'cancel-construction') : undefined;
  const footerActions = construction ? actions?.filter((action) => action.id !== 'cancel-construction') : actions;

  return (
    <BaseModal
      accentColor={accent.dark}
      accentLightColor={accent.light}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
      className={className}
      footer={
        footer ??
        (footerContent || construction || (footerActions && footerActions.length > 0) || footerHint ? (
          <div className="flex flex-col gap-[9px]">
            {footerContent}
            {construction ? (
              <BuildingModalConstructionPanel
                cancelAction={constructionAction}
                construction={construction}
                onAction={onAction}
              />
            ) : null}
            {footerActions && footerActions.length > 0 ? (
              <div className="flex gap-2">
                {footerActions.map((action) => (
                  <BuildingModalActionButton action={action} full key={action.id} onAction={onAction} />
                ))}
              </div>
            ) : null}
            {footerHint ? <div className="text-center font-game text-[10px] font-bold text-[#f0e0c0]">{footerHint}</div> : null}
          </div>
        ) : null)
      }
      footerClassName={footerClassName}
      maxHeight={maxHeight}
      width={width}
    >
      <BuildingModalHero
        accent={accent}
        buildingIcon={buildingIcon}
        labels={labels}
        level={level}
        name={name}
        summaryBadges={summaryBadges}
        summaryLabel={summaryLabel}
        tagline={tagline}
      />
      {notice ? <BuildingModalNoticePanel notice={notice} /> : null}
      {children}
    </BaseModal>
  );
}
