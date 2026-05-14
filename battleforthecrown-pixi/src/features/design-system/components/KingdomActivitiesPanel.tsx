import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ArmyMovementRow, type ArmyMovementRowProps, type ArmyMovementTone } from './ArmyMovementRow';
import { GameBottomSheetPanel } from './GameBottomSheetPanel';

export type CaptureWindowState = 'open' | 'soon' | 'completed' | 'interrupted';
export type CaptureTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
export type ExpeditionActivityKind = 'attack' | 'reinforce' | 'scout' | 'conquest';
export type ExpeditionActivityPhase = 'en_route' | 'resolved' | 'returning';
export type KingdomActivityTab = 'expeditions' | 'captures';
export type KingdomActivitiesPanelState = 'idle' | 'loading' | 'error';
export type KingdomActivityHudBadgeTone = 'gold' | 'green' | 'red' | 'blue' | 'stone';

export interface CaptureWindowCardProps extends HTMLAttributes<HTMLElement> {
  coordinates: string;
  endTime: string;
  endTimeLabel: string;
  nobleEyebrow: string;
  nobleName: string;
  originLabelPrefix: string;
  originName: string;
  progress: number;
  state: CaptureWindowState;
  statusLabel: string;
  targetName: string;
  tier: CaptureTier;
  tierSubLabel: string;
  timeRemaining: string;
}

export interface CaptureWindowListProps extends HTMLAttributes<HTMLDivElement> {
  emptyQuote: string;
  emptyTitle: string;
  items: CaptureWindowCardProps[];
  state?: KingdomActivitiesPanelState;
  loadingLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export interface ExpeditionActivityCardProps extends Omit<ArmyMovementRowProps, 'surface' | 'tone'> {
  kind: ExpeditionActivityKind;
  phase: ExpeditionActivityPhase;
}

export interface ExpeditionActivityListProps extends HTMLAttributes<HTMLDivElement> {
  emptyQuote: string;
  emptyTitle: string;
  items: ExpeditionActivityCardProps[];
  state?: KingdomActivitiesPanelState;
  loadingLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export interface KingdomActivitiesPanelLabels {
  captureEmptyQuote: string;
  captureEmptyTitle: string;
  captureErrorLabel: string;
  captureLoadingLabel: string;
  captureRetryLabel: string;
  capturesTab: string;
  closeLabel: string;
  expeditionEmptyQuote: string;
  expeditionEmptyTitle: string;
  expeditionErrorLabel: string;
  expeditionLoadingLabel: string;
  expeditionRetryLabel: string;
  expeditionsTab: string;
  headerEyebrow: string;
  headerTitle: string;
}

export interface KingdomActivitiesPanelProps extends HTMLAttributes<HTMLDivElement> {
  activeTab: KingdomActivityTab;
  captureCount: number;
  captureState?: KingdomActivitiesPanelState;
  captures: CaptureWindowCardProps[];
  embedded?: boolean;
  expeditionCount: number;
  expeditionState?: KingdomActivitiesPanelState;
  expeditions: ExpeditionActivityCardProps[];
  labels: KingdomActivitiesPanelLabels;
  onClose?: () => void;
  onRetryCaptures?: () => void;
  onRetryExpeditions?: () => void;
  onTabChange: (tab: KingdomActivityTab) => void;
}

export interface KingdomActivityHudBadgeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  count: number;
  icon?: ReactNode;
  label: string;
  tone: KingdomActivityHudBadgeTone;
}

export interface KingdomActivityHudBadgesProps extends HTMLAttributes<HTMLDivElement> {
  badges: KingdomActivityHudBadgeProps[];
}

const captureStateStyle: Record<CaptureWindowState, {
  bar: string;
  glow?: string;
  muted?: boolean;
  pill: string;
  pillDot: string;
  pillText: string;
  stripe: string;
  stripeBorder: string;
  time: string;
}> = {
  open: {
    bar: 'bg-[linear-gradient(90deg,#f1c40f,#d4a017)]',
    pill: 'border-[#9e7b0d] bg-[linear-gradient(180deg,#f1c40f,#d4a017)] text-[#3a2a00]',
    pillDot: 'bg-[#3a2a00]',
    pillText: 'shadow-none',
    stripe: 'bg-[linear-gradient(180deg,#f1c40f,#d4a017)]',
    stripeBorder: 'border-r-[#9e7b0d]',
    time: 'text-[#3d2f1f]',
  },
  soon: {
    bar: 'bg-[linear-gradient(90deg,#6ebf49,#4a8c2a)]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(60,38,25,.10),0_2px_0_rgba(0,0,0,.18),0_4px_10px_rgba(0,0,0,.18),0_0_0_2px_rgba(110,191,73,.35),0_0_18px_rgba(110,191,73,.45)]',
    pill: 'border-[#3a6c1f] bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)] text-white animate-[bftc-capture-pulse_1.6s_ease-in-out_infinite]',
    pillDot: 'bg-white',
    pillText: '[text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    stripe: 'bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)]',
    stripeBorder: 'border-r-[#3a6c1f]',
    time: 'text-[#4a8c2a]',
  },
  completed: {
    bar: 'bg-[linear-gradient(90deg,#8a7ad8,#5b4cb0)]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(60,38,25,.10),0_2px_0_rgba(0,0,0,.18),0_4px_10px_rgba(0,0,0,.18),0_0_0_2px_rgba(91,76,176,.3)]',
    pill: 'border-[#3a6c1f] bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)] text-white',
    pillDot: 'bg-white',
    pillText: '[text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    stripe: 'bg-[linear-gradient(180deg,#8a7ad8,#5b4cb0)]',
    stripeBorder: 'border-r-[#3f3290]',
    time: 'text-[#5b4cb0]',
  },
  interrupted: {
    bar: 'bg-[linear-gradient(90deg,#e74c3c,#c0392b)]',
    muted: true,
    pill: 'border-[#a93226] bg-[linear-gradient(180deg,#e74c3c,#c0392b)] text-white',
    pillDot: 'bg-white',
    pillText: '[text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
    stripe: 'bg-[linear-gradient(180deg,#e74c3c,#c0392b)]',
    stripeBorder: 'border-r-[#a93226]',
    time: 'text-[#c0392b]',
  },
};

const tierStyle: Record<CaptureTier, { background: string; border: string; text: string }> = {
  T1: {
    background: 'bg-[linear-gradient(180deg,#b89970,#6d5838)]',
    border: 'border-[#3c2619]',
    text: 'text-[#f0e0c0]',
  },
  T2: {
    background: 'bg-[linear-gradient(180deg,#d4b585,#8b6f47)]',
    border: 'border-[#3c2619]',
    text: 'text-white',
  },
  T3: {
    background: 'bg-[linear-gradient(180deg,#f1c40f,#d4a017)]',
    border: 'border-[#9e7b0d]',
    text: 'text-[#3a2a00]',
  },
  T4: {
    background: 'bg-[linear-gradient(180deg,#f1a40f,#c0392b)]',
    border: 'border-[#7d2218]',
    text: 'text-[#fff8d0]',
  },
  T5: {
    background: 'bg-[linear-gradient(180deg,#f6d57b,#5b4cb0)]',
    border: 'border-[#3f3290]',
    text: 'text-[#fff8d0]',
  },
};

const expeditionArmyTone: Record<ExpeditionActivityKind, ArmyMovementTone> = {
  attack: 'attack',
  conquest: 'conquest',
  reinforce: 'reinforce',
  scout: 'scout',
};

const hudToneClass: Record<KingdomActivityHudBadgeTone, string> = {
  blue: 'border-[#1f5288] bg-[linear-gradient(180deg,#5b9bd5,#2e75b6)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
  gold: 'border-[#9e7b0d] bg-[linear-gradient(180deg,#f1c40f,#d4a017)] text-[#3a2a00]',
  green: 'border-[#3a6c1f] bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)] animate-[bftc-hud-float_1.4s_ease-in-out_infinite]',
  red: 'border-[#a93226] bg-[linear-gradient(180deg,#e74c3c,#c0392b)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
  stone: 'border-[#5d6d6e] bg-[linear-gradient(180deg,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
};

function PinGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CastleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth=".5" viewBox="0 0 24 24">
      <path d="M3 21V9l2 1V7l2 1V6l2 1V4l2 1V4l2-1v2l2-1v3l2-1v3l2-1v12H3Z" />
    </svg>
  );
}

function KingdomActivitiesAnimations() {
  return (
    <style>
      {`
        @keyframes bftc-capture-pulse {
          0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.45); }
          50% { box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 0 0 4px rgba(110,191,73,.25); }
        }
        @keyframes bftc-hud-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
      `}
    </style>
  );
}

export function CaptureTierBadge({ tier, tierSubLabel }: Pick<CaptureWindowCardProps, 'tier' | 'tierSubLabel'>) {
  const style = tierStyle[tier];

  return (
    <div
      className={cn(
        'flex size-[42px] shrink-0 flex-col items-center justify-center gap-px rounded-xl border-[2.5px]',
        'shadow-[inset_0_1.5px_0_rgba(255,255,255,.45),inset_0_-10px_16px_rgba(0,0,0,.22),0_2px_0_rgba(0,0,0,.25)]',
        style.background,
        style.border,
        style.text,
      )}
    >
      <span className="font-game text-[17.64px] font-black leading-none [text-shadow:1px_1px_2px_rgba(0,0,0,.55)]">{tier}</span>
      <span className="font-game text-[6.72px] font-bold uppercase tracking-[.2em] opacity-[.8]">{tierSubLabel}</span>
    </div>
  );
}

export function CaptureStatusPill({ state, statusLabel }: Pick<CaptureWindowCardProps, 'state' | 'statusLabel'>) {
  const style = captureStateStyle[state];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-[5px] rounded-full border-[1.5px] px-2 py-[3px] pl-[7px]',
        'font-game text-[9.5px] font-extrabold uppercase tracking-[.16em] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
        'whitespace-nowrap',
        style.pill,
        style.pillText,
      )}
    >
      <span className={cn('size-[5px] rounded-full shadow-[0_0_4px_rgba(255,255,255,.4)]', style.pillDot)} />
      {statusLabel}
    </span>
  );
}

export function CaptureWindowCard({
  className,
  coordinates,
  endTime,
  endTimeLabel,
  nobleEyebrow,
  nobleName,
  originLabelPrefix,
  originName,
  progress,
  state,
  statusLabel,
  targetName,
  tier,
  tierSubLabel,
  timeRemaining,
  ...props
}: CaptureWindowCardProps) {
  const style = captureStateStyle[state];
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <article
      className={cn(
        'relative w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(180deg,#fef9f0,#f5e6d3)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(60,38,25,.10),0_2px_0_rgba(0,0,0,.18),0_4px_10px_rgba(0,0,0,.18)]',
        style.glow,
        style.muted ? 'opacity-[.85]' : '',
        className,
      )}
      {...props}
    >
      <div className={cn('absolute bottom-0 left-0 top-0 w-1.5 border-r shadow-[inset_0_1px_0_rgba(255,255,255,.5)]', style.stripe, style.stripeBorder)} />
      <div className="flex flex-col gap-[9px] px-3 pb-[11px] pl-4 pt-2.5">
        <div className="flex items-center gap-2.5">
          <CaptureTierBadge tier={tier} tierSubLabel={tierSubLabel} />
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-game text-sm font-extrabold leading-[1.1] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
                {targetName}
              </span>
              <CaptureStatusPill state={state} statusLabel={statusLabel} />
            </div>
            <div className="flex min-w-0 items-center gap-2 font-game text-[11px] font-semibold text-[#6d5838]">
              <span className="inline-flex shrink-0 items-center gap-1">
                <PinGlyph className="size-[11px]" />
                <span className="font-extrabold tabular-nums tracking-[.04em] text-[#3d2f1f]">{coordinates}</span>
              </span>
              <span className="text-[#8b7355] opacity-[.6]">·</span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <CastleGlyph className="size-[11px] shrink-0" />
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {originLabelPrefix}{' '}
                  <em className="not-italic font-bold text-[#3d2f1f]">{originName}</em>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-[linear-gradient(90deg,rgba(60,38,25,0),rgba(60,38,25,.28)_20%,rgba(60,38,25,.28)_80%,rgba(60,38,25,0))]" />

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClockGlyph className={cn('size-4', style.time)} />
            <div className="flex flex-col leading-none">
              <span className={cn('font-game text-[22px] font-black tabular-nums tracking-[.01em] [text-shadow:0_1px_0_rgba(255,255,255,.6)]', style.time)}>
                {timeRemaining}
              </span>
              <span className="mt-[3px] font-game text-[10px] font-semibold tracking-[.02em] text-[#6d5838]">
                {endTimeLabel}{' '}
                <span className="font-extrabold tabular-nums text-[#3d2f1f]">{endTime}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5 text-right font-game">
            <span className="text-[8.5px] font-bold uppercase tracking-[.22em] text-[#8b7355]">{nobleEyebrow}</span>
            <span className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-bold text-[#3d2f1f]">
              {nobleName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full border border-[rgba(60,38,25,.22)] bg-[rgba(60,38,25,.16)] shadow-[inset_0_1px_1px_rgba(0,0,0,.18)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(60,38,25,.07)_0_3px,transparent_3px_6px)]" />
            <div
              className={cn('relative h-full transition-[width] duration-[600ms] ease-out shadow-[inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_4px_rgba(0,0,0,.22)]', style.bar)}
              style={{ width: `${Math.max(2, clampedProgress)}%` }}
            />
          </div>
          <span className="w-[30px] text-right font-game text-[10px] font-extrabold tabular-nums text-[#6d5838]">{clampedProgress}%</span>
        </div>
      </div>
    </article>
  );
}

function ListStateMessage({
  errorLabel,
  loadingLabel,
  onRetry,
  retryLabel,
  state,
}: {
  errorLabel?: string;
  loadingLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  state: Exclude<KingdomActivitiesPanelState, 'idle'>;
}) {
  if (state === 'loading') {
    return (
      <div className="px-3 py-3">
        <div className="h-[58px] animate-pulse rounded-[10px] border-2 border-[rgba(60,38,25,.22)] bg-[linear-gradient(180deg,#fef9f0,#f9f3e8)]" />
        <p className="mt-2 text-center font-game text-[11px] italic text-[#6d5838]">{loadingLabel}</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 text-center font-game">
      <p className="text-[12px] font-bold text-[#3d2f1f]">{errorLabel}</p>
      {retryLabel && onRetry ? (
        <button
          className="mt-2 rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(180deg,#b6a78a,#a67c52)] px-3 py-1 text-[11px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
          onClick={onRetry}
          type="button"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function EmptyPanel({ quote, title }: { quote: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-[18px] pb-7 pt-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-[14px] border-2 border-dashed border-[#8b7355] bg-[linear-gradient(180deg,#f9f3e8,#f5e6d3)] opacity-[.7]">
        <ClockGlyph className="size-[26px] text-[#8b7355]" />
      </div>
      <div className="font-game text-[13px] font-bold text-[#3d2f1f]">{title}</div>
      <div className="max-w-60 font-game text-[11.5px] italic leading-[1.45] text-[#6d5838]">{quote}</div>
    </div>
  );
}

export function CaptureWindowList({
  className,
  emptyQuote,
  emptyTitle,
  errorLabel,
  items,
  loadingLabel,
  onRetry,
  retryLabel,
  state = 'idle',
  ...props
}: CaptureWindowListProps) {
  if (state !== 'idle') {
    return <ListStateMessage errorLabel={errorLabel} loadingLabel={loadingLabel} onRetry={onRetry} retryLabel={retryLabel} state={state} />;
  }

  if (!items.length) {
    return <EmptyPanel quote={emptyQuote} title={emptyTitle} />;
  }

  return (
    <div className={cn('flex flex-col gap-2.5 px-3 py-2.5', className)} {...props}>
      {items.map((item) => (
        <CaptureWindowCard key={`${item.targetName}-${item.coordinates}-${item.nobleName}`} {...item} />
      ))}
    </div>
  );
}

export function ExpeditionActivityCard({
  className,
  kind,
  phase,
  ...props
}: ExpeditionActivityCardProps) {
  return (
    <ArmyMovementRow
      className={className}
      data-phase={phase}
      {...props}
      surface="parchment"
      tone={expeditionArmyTone[kind]}
    />
  );
}

export function ExpeditionActivityList({
  className,
  emptyQuote,
  emptyTitle,
  errorLabel,
  items,
  loadingLabel,
  onRetry,
  retryLabel,
  state = 'idle',
  ...props
}: ExpeditionActivityListProps) {
  if (state !== 'idle') {
    return <ListStateMessage errorLabel={errorLabel} loadingLabel={loadingLabel} onRetry={onRetry} retryLabel={retryLabel} state={state} />;
  }

  if (!items.length) {
    return <EmptyPanel quote={emptyQuote} title={emptyTitle} />;
  }

  return (
    <div className={cn('flex flex-col gap-2 px-3 py-3.5', className)} {...props}>
      {items.map((item) => (
        <ExpeditionActivityCard key={item.movementId} {...item} />
      ))}
    </div>
  );
}

function TabButton({
  active,
  badge,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  badge: number;
  label: string;
  onClick: () => void;
  tone: 'captures' | 'expeditions';
}) {
  return (
    <button
      className={cn(
        'mb-0 inline-flex cursor-pointer items-center gap-1.5 rounded-t-[10px] border-2 px-3 pb-2 pt-[7px]',
        'font-game text-xs font-extrabold tracking-[.05em]',
        active
          ? 'mb-[-1px] border-[#5d4a32] border-b-[#f5e6d3] bg-[linear-gradient(180deg,#fef9f0,#f5e6d3)] text-[#3d2f1f] shadow-[inset_0_1.5px_0_rgba(255,255,255,.6)] [text-shadow:0_1px_0_rgba(255,255,255,.5)]'
          : 'border-[rgba(60,38,25,.18)] border-b-transparent bg-[rgba(60,38,25,.06)] text-[#6d5838]',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      {badge > 0 ? (
        <span
          className={cn(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] px-[5px] font-game text-[9.5px] font-black',
            active && tone === 'captures'
              ? 'border-[#9e7b0d] bg-[linear-gradient(180deg,#f1c40f,#d4a017)] text-[#3a2a00]'
              : 'border-[rgba(0,0,0,.25)] bg-[rgba(60,38,25,.55)] text-white',
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function KingdomActivitiesPanel({
  activeTab,
  captureCount,
  captureState = 'idle',
  captures,
  className,
  embedded = false,
  expeditionCount,
  expeditionState = 'idle',
  expeditions,
  labels,
  onClose,
  onRetryCaptures,
  onRetryExpeditions,
  onTabChange,
  ...props
}: KingdomActivitiesPanelProps) {
  return (
    <GameBottomSheetPanel
      className={cn(embedded ? 'rounded-t-2xl' : 'rounded-2xl', className)}
      closeLabel={labels.closeLabel}
      eyebrow={labels.headerEyebrow}
      onClose={onClose}
      tabs={(
        <>
          <TabButton
            active={activeTab === 'expeditions'}
            badge={expeditionCount}
            label={labels.expeditionsTab}
            onClick={() => onTabChange('expeditions')}
            tone="expeditions"
          />
          <TabButton
            active={activeTab === 'captures'}
            badge={captureCount}
            label={labels.capturesTab}
            onClick={() => onTabChange('captures')}
            tone="captures"
          />
        </>
      )}
      title={labels.headerTitle}
      variant="tabbed"
      {...props}
    >
      <KingdomActivitiesAnimations />
      {activeTab === 'captures' ? (
        <CaptureWindowList
          emptyQuote={labels.captureEmptyQuote}
          emptyTitle={labels.captureEmptyTitle}
          errorLabel={labels.captureErrorLabel}
          items={captures}
          loadingLabel={labels.captureLoadingLabel}
          onRetry={onRetryCaptures}
          retryLabel={labels.captureRetryLabel}
          state={captureState}
        />
      ) : (
        <ExpeditionActivityList
          emptyQuote={labels.expeditionEmptyQuote}
          emptyTitle={labels.expeditionEmptyTitle}
          errorLabel={labels.expeditionErrorLabel}
          items={expeditions}
          loadingLabel={labels.expeditionLoadingLabel}
          onRetry={onRetryExpeditions}
          retryLabel={labels.expeditionRetryLabel}
          state={expeditionState}
        />
      )}
    </GameBottomSheetPanel>
  );
}

export function KingdomActivityHudBadge({
  className,
  count,
  icon,
  label,
  tone,
  ...props
}: KingdomActivityHudBadgeProps) {
  if (count <= 0) return null;

  return (
    <button
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border-2 py-1 pl-1.5 pr-2',
        'font-game text-[9.5px] font-extrabold uppercase tracking-[.1em] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.22)]',
        hudToneClass[tone],
        className,
      )}
      type="button"
      {...props}
    >
      <span className="flex size-[18px] items-center justify-center rounded-full bg-[rgba(0,0,0,.22)]">
        {icon ?? <ClockGlyph className="size-[11px]" />}
      </span>
      <span>{label}</span>
      <span className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-white px-[5px] text-[10px] font-black tracking-[0] text-[#9e7b0d] shadow-[inset_0_0_0_1.5px_rgba(0,0,0,.15)]">
        {count}
      </span>
    </button>
  );
}

export function KingdomActivityHudBadges({ badges, className, ...props }: KingdomActivityHudBadgesProps) {
  const visibleBadges = badges.filter((badge) => badge.count > 0);
  if (!visibleBadges.length) return null;

  return (
    <div className={cn('flex flex-nowrap items-center gap-1.5', className)} {...props}>
      {visibleBadges.map((badge) => (
        <KingdomActivityHudBadge key={badge.label} {...badge} />
      ))}
    </div>
  );
}
