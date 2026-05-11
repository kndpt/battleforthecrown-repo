import { BftcButton } from './BftcButton';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type MapMarkerTone = 'you' | 'tribe' | 'ally' | 'nap' | 'enemy' | 'barbarian' | 'ruin';

const toneClass: Record<MapMarkerTone, string> = {
  you: 'border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)]',
  tribe: 'border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)] shadow-[inset_0_2px_0_rgba(255,255,255,.35),0_0_0_4px_rgba(241,196,15,.25),0_4px_8px_rgba(0,0,0,.4)]',
  ally: 'border-[#0a1f3d] bg-[radial-gradient(circle_at_30%_25%,#cfe2f6,#102e58)]',
  nap: 'border-[#1a052f] bg-[radial-gradient(circle_at_30%_25%,#d8c3ef,#2c0e4d)]',
  enemy: 'border-[#3d2f1f] bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#5a1612)]',
  barbarian: 'border-[#1f2933] bg-[radial-gradient(circle_at_30%_25%,#e8e8e8,#3d4f60)]',
  ruin: 'border-[#1a1a1a] bg-[radial-gradient(circle_at_30%_25%,#a87b25,#3d2f1f)] saturate-50',
};

const tierClass: Record<number, string> = {
  1: 'from-[#cdcdcd] to-[#7f8c8d] text-[#1f2933]',
  2: 'from-[#e0c39a] to-[#7a4915] text-[#fef9f0] text-shadow-game',
  3: 'from-[#fef0c6] to-[#a87b25] text-[#3a2a00]',
  4: 'from-[#fbe9b8] to-[#704c0a] text-[#3a2a00] shadow-[0_0_6px_rgba(241,196,15,.6)]',
  5: 'from-white to-[#c70039] text-[#fef9f0] text-shadow-game animate-[bftc-tier-pulse_1.6s_ease-in-out_infinite]',
};

export interface MapMarkerProps {
  className?: string;
  icon: string;
  label: string;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tier?: number;
  tone: MapMarkerTone;
}

export function MapMarker({ className, icon, label, onClick, selected, size = 'md', tier, tone }: MapMarkerProps) {
  const sizeClass = size === 'sm' ? 'size-10 border-[2.5px]' : size === 'lg' ? 'size-16 border-[3.5px]' : 'size-[54px] border-[3px]';
  const iconSizeClass = size === 'sm' ? 'size-[22px]' : size === 'lg' ? 'size-9' : 'size-[30px]';
  const tierSizeClass = size === 'sm' ? 'size-[18px] text-[9px] -right-1 -top-1' : size === 'lg' ? 'size-7 text-[13px] -right-2 -top-2' : 'size-6 text-[11px] -right-2 -top-1.5';

  return (
    <button
      aria-label={label}
      className={cn('group relative inline-flex items-center justify-center', className)}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          'relative grid place-items-center rounded-full shadow-[inset_0_2px_0_rgba(255,255,255,.35),0_4px_8px_rgba(0,0,0,.4)] transition after:pointer-events-none after:absolute after:inset-[-3px] after:rounded-full after:border-2 after:border-white/20 after:content-[""]',
          selected ? 'scale-110' : 'group-hover:scale-105',
          sizeClass,
          toneClass[tone],
        )}
      >
        <img alt="" className={cn('z-[1] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]', iconSizeClass)} src={publicAsset(icon)} />
      </span>
      {tier ? (
        <span
          className={cn(
            'absolute z-[3] grid place-items-center bg-gradient-to-b font-game font-black',
            '[clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]',
            'drop-shadow-[0_1px_2px_rgba(0,0,0,.55)]',
            tierSizeClass,
            tierClass[tier] ?? tierClass[3],
          )}
        >
          {tier}
        </span>
      ) : null}
    </button>
  );
}

export interface MapDotProps {
  label: string;
  onClick?: () => void;
  tone: MapMarkerTone;
}

export function MapDot({ label, onClick, tone }: MapDotProps) {
  return (
    <button
      aria-label={label}
      className={cn('size-3.5 rounded-full border-2 shadow-[0_1px_2px_rgba(0,0,0,.4)]', toneClass[tone])}
      onClick={onClick}
      type="button"
    />
  );
}

export type MarchTone = 'attack' | 'support' | 'return' | 'out';

export interface ArmyMarchMarkerProps {
  eta: string;
  icon?: string;
  label: string;
  onClick?: () => void;
  tone: MarchTone;
}

const marchBodyClass: Record<MarchTone, string> = {
  attack: 'border-[#3d2f1f] bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#5a1612)]',
  support: 'border-[#3a6c1f] bg-[radial-gradient(circle_at_30%_25%,#d6ecc4,#1d4a1d)]',
  return: 'border-[#1f2933] bg-[radial-gradient(circle_at_30%_25%,#cdcdcd,#3d4f60)]',
  out: 'border-[#0a1f3d] bg-[radial-gradient(circle_at_30%_25%,#cfe2f6,#102e58)]',
};

const marchEtaClass: Record<MarchTone, string> = {
  attack: 'border-[#a93226]',
  support: 'border-[#3a6c1f]',
  return: 'border-[#7f8c8d]',
  out: 'border-[#1f5288]',
};

const marchSymbol: Record<MarchTone, string> = {
  attack: '⚔',
  support: '🛡',
  return: '↩',
  out: '→',
};

export function ArmyMarchMarker({ eta, icon, label, onClick, tone }: ArmyMarchMarkerProps) {
  const defaultIcon = tone === 'attack' ? '/assets/hand-red.png' : tone === 'support' ? '/assets/hand-silver.png' : '/assets/army/squire.png';

  return (
    <button
      aria-label={`${label} ${eta}`}
      className="relative inline-flex size-10 items-center justify-center"
      onClick={onClick}
      type="button"
    >
      {tone === 'return' ? null : (
        <span className={cn('absolute inset-0 rounded-full border-2 opacity-0 animate-[bftc-map-pulse_1.6s_ease-out_infinite]', marchEtaClass[tone])} />
      )}
      <span
        className={cn(
          'relative z-[2] grid size-8 place-items-center rounded-full border-[2.5px] shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_3px_6px_rgba(0,0,0,.45)]',
          marchBodyClass[tone],
        )}
      >
        <img alt="" className="size-5 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]" src={publicAsset(icon ?? defaultIcon)} />
      </span>
      <span
        className={cn(
          'absolute -bottom-[18px] left-1/2 z-[4] -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] bg-black/75 px-1.5 py-px font-game text-[10px] font-extrabold tabular-nums text-[#fef9f0]',
          marchEtaClass[tone],
        )}
      >
        {marchSymbol[tone]} {eta}
      </span>
    </button>
  );
}

export interface MapCalloutAction {
  label: string;
  onClick?: () => void;
  variant?: 'success' | 'info' | 'danger' | 'warning' | 'neutral';
}

export interface MapCalloutProps {
  actions?: MapCalloutAction[];
  coordinates: string;
  levelLabel?: string;
  owner: string;
  points?: string;
  tierLabel?: string;
  title: string;
}

export function MapCallout({ actions = [], coordinates, levelLabel, owner, points, tierLabel, title }: MapCalloutProps) {
  return (
    <div className="w-full max-w-[380px] rounded-[10px] border-2 border-[#704c0a] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] p-3 font-game text-[#fef9f0] shadow-[0_8px_18px_rgba(0,0,0,.38)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xl font-extrabold uppercase text-[#f6d57b] text-shadow-game">{title}</div>
          <div className="mt-0.5 text-sm font-semibold uppercase tracking-[0.06em] text-[#cdb88a]">{owner}</div>
        </div>
        <span className="font-mono text-sm font-bold text-[#cdb88a]">{coordinates}</span>
      </div>
      {(tierLabel || points || levelLabel) ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {tierLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#704c0a] bg-[#f1c40f]/20 px-2 py-0.5 text-sm font-extrabold text-[#f6d57b]">
              ★ {tierLabel}
            </span>
          ) : null}
          {points ? <span className="text-sm font-semibold tabular-nums">👑 {points}</span> : null}
          {levelLabel ? <span className="text-sm font-semibold">{levelLabel}</span> : null}
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <BftcButton key={action.label} className="min-h-[54px] flex-1 text-lg" onClick={action.onClick} variant={action.variant ?? 'success'}>
              {action.label}
            </BftcButton>
          ))}
        </div>
      ) : null}
    </div>
  );
}
