import type { CSSProperties, ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type ArmyFilterTone = 'wood' | 'green' | 'blue' | 'gold';
export type ArmyNavTone = 'wood' | 'gold';
export type ArmyOriginKind = 'mine' | 'ally' | 'sent' | 'training' | 'village';
export type ArmyTroopCategory = 'Infanterie' | 'Tireur' | 'Cavalerie' | 'Spécial' | 'Élite' | 'Siège';
export type ArmySliderTone = 'green' | 'gold' | 'red';

export interface ArmyResourceChip {
  icon: string;
  id: string;
  label: string;
  sub?: string;
  value: string;
}

export interface ArmyHudProps {
  crowns: string;
  crownsIcon: string;
  level: number;
  playerInitials: string;
  power: string;
  powerIcon: string;
  resources: ArmyResourceChip[];
}

export interface ArmyVillageBarProps {
  name: string;
  nextLabel: string;
  previousLabel: string;
  subtitle?: string;
  titleLabel: string;
}

export interface ArmyBottomNavItem {
  badge?: number;
  iconPath: string;
  id: string;
  label: string;
}

export interface ArmyBottomNavProps {
  activeId: string;
  items: ArmyBottomNavItem[];
  onChange?: (id: string) => void;
}

export interface ArmyFilterOption {
  count: number;
  id: string;
  label: string;
  tone?: ArmyFilterTone;
}

export interface ArmyTroopCost {
  iron: number;
  stone: number;
  wood: number;
}

export interface ArmyTroop {
  attack: number;
  category: ArmyTroopCategory;
  cost: ArmyTroopCost;
  defense: number;
  emoji?: string;
  fromAllies?: number;
  icon?: string;
  id: string;
  inVillage: number;
  name: string;
  pop: number;
  power: number;
  requiredLevel?: number;
  requirementLabel?: string;
  short: string;
  supportingElsewhere?: number;
  trainingTime: string;
  unlocked: boolean;
}

export interface ArmyQueueItem {
  active?: boolean;
  id: string;
  progress?: number;
  quantity: number;
  troopId: string;
}

export interface ArmyRecruitSheetProps {
  activeDropLabel: string;
  dropIdleLabel: string;
  iconPath: string;
  isDragging?: boolean;
  queue: ArmyQueueItem[];
  summaryLabel: string;
  title: string;
}

export interface ArmyViewProps {
  activeFilterId: string;
  bottomNav: ArmyBottomNavProps;
  filters: ArmyFilterOption[];
  hud: ArmyHudProps;
  onFilterChange?: (id: string) => void;
  onTroopSelect?: (troop: ArmyTroop) => void;
  recruitSheet: ArmyRecruitSheetProps;
  screenLabel: string;
  troops: ArmyTroop[];
  village: ArmyVillageBarProps;
}

export interface ArmyPhoneFrameProps {
  children: ReactNode;
  screenLabel: string;
}

export interface ArmyRecruitStock {
  iron: number;
  popMax: number;
  population: number;
  stone: number;
  wood: number;
}

export interface ArmyRecruitQuickValue {
  label: string;
  tone?: 'wood' | 'gold';
  value: number;
}

export interface ArmyRecruitPopupLabels {
  cancel: string;
  max: string;
  population: string;
  recruit: string;
  resourceIron: string;
  resourceStone: string;
  resourceWood: string;
}

export interface ArmyRecruitPopupProps {
  labels: ArmyRecruitPopupLabels;
  max: number;
  onCancel?: () => void;
  onChange: (value: number) => void;
  onRecruit?: (value: number) => void;
  quickValues: ArmyRecruitQuickValue[];
  stock: ArmyRecruitStock;
  troop: ArmyTroop;
  value: number;
}

export interface ArmyRecruitOverlayProps {
  army: ArmyViewProps;
  popup: ArmyRecruitPopupProps;
  screenLabel: string;
}

export interface ArmyDraggingOverlayProps {
  army: ArmyViewProps;
  ghostLabel: string;
  troopId: string;
}

const CAT_COLOR: Record<ArmyTroopCategory, { border: string; dark: string; ink: string; light: string }> = {
  Infanterie: { border: 'var(--wood-bark)', dark: '#5d4a32', ink: '#fff', light: '#a67c52' },
  Tireur: { border: 'var(--game-blue-border)', dark: 'var(--game-blue-dark)', ink: '#fff', light: 'var(--game-blue-light)' },
  Cavalerie: { border: 'var(--game-green-border)', dark: 'var(--game-green-dark)', ink: '#fff', light: 'var(--game-green-light)' },
  Spécial: { border: 'var(--game-red-border)', dark: 'var(--game-red-dark)', ink: '#fff', light: 'var(--game-red-light)' },
  Élite: { border: 'var(--game-gold-border)', dark: 'var(--game-gold-dark)', ink: '#3a2a00', light: 'var(--game-gold-glow)' },
  Siège: { border: 'var(--game-stone-border)', dark: 'var(--game-stone-dark)', ink: '#fff', light: 'var(--game-stone-light)' },
};

const ARMY_CSS_VARIABLES = {
  '--fg-muted-parch': '#4b5563',
  '--fg-on-parchment': '#1f2937',
  '--fg-quill': '#451a03',
  '--game-blue-border': '#1f5288',
  '--game-blue-dark': '#2e75b6',
  '--game-blue-light': '#5b9bd5',
  '--game-gold-border': '#9e7b0d',
  '--game-gold-dark': '#d4a017',
  '--game-gold-glow': '#f6d57b',
  '--game-green-border': '#3a6c1f',
  '--game-green-dark': '#4a8c2a',
  '--game-green-light': '#6ebf49',
  '--game-red-border': '#a93226',
  '--game-red-dark': '#c0392b',
  '--game-red-light': '#e74c3c',
  '--game-stone-border': '#5d6d6e',
  '--game-stone-dark': '#7f8c8d',
  '--game-stone-light': '#95a5a6',
  '--parchment-50': '#fef9f0',
  '--parchment-100': '#f9f3e8',
  '--parchment-200': '#f5e6d3',
  '--parchment-300': '#f4e4c1',
  '--parchment-400': '#e8d4a8',
  '--parchment-500': '#d4c094',
  '--parchment-600': '#c9a882',
  '--parchment-700': '#8b7355',
  '--shadow-card-inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.55)',
  '--shadow-nav-up': '0 -6px 18px rgba(0, 0, 0, 0.45)',
  '--wood': '#8b6f47',
  '--wood-bark': '#3c2619',
  '--wood-dark': '#6d5838',
  '--wood-deep': '#3d2f1f',
  '--wood-deeper': '#5d4a32',
} as CSSProperties;

const FILTER_TONE: Record<ArmyFilterTone, { background: string; border: string; color: string }> = {
  wood: { background: 'linear-gradient(to bottom, var(--wood), var(--wood-dark))', border: 'var(--wood-deep)', color: '#fff' },
  green: { background: 'linear-gradient(to bottom, var(--game-green-light), var(--game-green-dark))', border: 'var(--game-green-border)', color: '#fff' },
  blue: { background: 'linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))', border: 'var(--game-blue-border)', color: '#fff' },
  gold: { background: 'linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))', border: 'var(--game-gold-border)', color: '#3a2a00' },
};

const navIconPath: Record<string, string> = {
  army: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5',
  build: 'm15 12-7-7-5 5 7 7M12.5 6.5 17 11l4.5-4.5L17 2M2 22l8-8',
  messages: 'M22 6 12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2',
  world: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
};

function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function clampQuantity(value: number, max: number): number {
  return Math.max(1, Math.min(max, Math.round(value)));
}

function ArmyTopBar({ crowns, crownsIcon, level, playerInitials, power, powerIcon, resources }: ArmyHudProps) {
  return (
    <div className="relative z-50 flex w-full items-center gap-2 border-b-2 border-[var(--parchment-700)] bg-[linear-gradient(to_bottom,rgba(60,38,25,.95),rgba(78,56,34,.95))] px-2.5 py-2">
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--wood-deeper)] bg-[linear-gradient(to_bottom,var(--wood),var(--wood-dark))] font-game text-xs font-bold text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">
        {playerInitials}
        <span className="absolute bottom-[-4px] right-[-4px] flex size-[18px] items-center justify-center rounded-full border-2 border-[var(--game-gold-border)] bg-[linear-gradient(to_bottom,var(--game-gold-glow),var(--game-gold-dark))] text-[9px] font-bold text-[#3a2a00]">
          {level}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex gap-1.5">
          <SmallBadge icon={powerIcon} label={power} />
          <SmallBadge gold icon={crownsIcon} label={crowns} />
        </div>
        <div className="flex w-full gap-[5px]">
          {resources.map((resource) => (
            <ResourceChip key={resource.id} {...resource} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SmallBadge({ gold = false, icon, label }: { gold?: boolean; icon: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full border-2 px-[7px] py-px font-game text-[11px] font-bold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,.25)]',
        gold
          ? 'border-[var(--game-gold-border)] bg-[linear-gradient(to_bottom,var(--game-gold-glow),var(--game-gold-dark))] text-[#3a2a00]'
          : 'border-[var(--wood-deep)] bg-[linear-gradient(to_bottom,var(--wood),var(--wood-dark))] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
      )}
    >
      <img alt="" className="mr-[3px] size-3 object-contain" src={publicAsset(icon)} />
      {label}
    </span>
  );
}

function ResourceChip({ icon, label, value }: ArmyResourceChip) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-[5px] rounded-lg border-2 border-[rgba(255,255,255,.12)] bg-[rgba(0,0,0,.4)] px-1.5 py-0.5">
      <img alt="" className="size-[18px] shrink-0 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]" src={publicAsset(icon)} title={label} />
      <span className="min-w-0 font-game text-[11px] font-bold leading-[1.05] tabular-nums text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">
        {value}
      </span>
    </div>
  );
}

function VillageBar({ name, nextLabel, previousLabel, subtitle, titleLabel }: ArmyVillageBarProps) {
  return (
    <div className="relative z-40 flex w-full items-center gap-2 border-b border-[rgba(0,0,0,.4)] bg-[linear-gradient(to_bottom,var(--wood-deep),var(--wood-bark))] px-2.5 py-2">
      <CarouselArrow direction="left" label={previousLabel} />
      <div className="min-w-0 flex-1 text-center leading-[1.1]">
        <div className="font-game text-[10px] font-bold uppercase tracking-[.22em] text-[var(--parchment-400)]">{titleLabel}</div>
        <div className="inline-flex items-center gap-1 font-game text-sm font-extrabold tracking-[.04em] text-[var(--parchment-50)] [text-shadow:1px_1px_1px_rgba(0,0,0,.55)]">
          {name}
          <svg className="opacity-[.8]" height="10" viewBox="0 0 10 10" width="10">
            <path d="M2 4 L5 7 L8 4" fill="none" stroke="var(--parchment-300)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          </svg>
        </div>
        {subtitle ? <div className="mt-px font-game text-[9.5px] italic text-[var(--parchment-400)]">{subtitle}</div> : null}
      </div>
      <CarouselArrow direction="right" label={nextLabel} />
    </div>
  );
}

function CarouselArrow({ direction, label }: { direction: 'left' | 'right'; label: string }) {
  return (
    <button
      aria-label={label}
      className="flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-2 border-[var(--game-blue-border)] bg-[linear-gradient(to_bottom,var(--game-blue-light),var(--game-blue-dark))] p-0 shadow-[0_2px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)]"
      type="button"
    >
      <svg height="12" viewBox="0 0 12 12" width="12">
        <path
          d={direction === 'left' ? 'M8 2 L4 6 L8 10' : 'M4 2 L8 6 L4 10'}
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))' }}
        />
      </svg>
    </button>
  );
}

function ArmyBottomNav({ activeId, items, onChange }: ArmyBottomNavProps) {
  return (
    <div className="flex w-full justify-around border-t-2 border-[var(--parchment-700)] bg-[linear-gradient(to_top,rgba(60,38,25,.95),rgba(78,56,34,.9),rgba(107,75,43,.85))] px-1 pb-2 pt-1.5 shadow-[var(--shadow-nav-up)]">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button className="flex cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent p-0.5" key={item.id} onClick={() => onChange?.(item.id)} type="button">
            <div
              className={cn(
                'relative flex size-9 items-center justify-center rounded-full border-2',
                active
                  ? 'border-[var(--game-gold-glow)] bg-[linear-gradient(to_bottom,var(--game-gold-glow),var(--game-gold-dark))] shadow-[0_0_14px_rgba(250,224,120,.55)]'
                  : 'border-[var(--wood-deeper)] bg-[linear-gradient(to_bottom,var(--wood),var(--wood-dark))] shadow-[0_2px_0_rgba(0,0,0,.2)]',
              )}
            >
              <svg fill="none" height="16" stroke={active ? '#3c2619' : '#fff'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                <path d={item.iconPath || navIconPath[item.id]} />
              </svg>
              {item.badge ? (
                <span className="absolute right-[-3px] top-[-3px] flex h-3.5 min-w-3.5 items-center justify-center rounded-lg border-[1.5px] border-white bg-[var(--game-red-dark)] px-[3px] font-game text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className={cn('font-game text-[9.5px] font-semibold', active ? 'text-[var(--game-gold-glow)]' : 'text-[var(--parchment-300)]')}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TroopIcon({ dim = false, size = 44, troop }: { dim?: boolean; size?: number; troop: ArmyTroop }) {
  if (troop.icon) {
    return (
      <img
        alt=""
        className="object-contain"
        src={publicAsset(troop.icon)}
        style={{
          filter: dim
            ? 'drop-shadow(0 2px 3px rgba(0,0,0,.35)) saturate(.4) brightness(.85)'
            : 'drop-shadow(0 2px 3px rgba(0,0,0,.35))',
          height: size,
          width: size,
        }}
      />
    );
  }

  if (troop.emoji) {
    return (
      <span
        aria-hidden="true"
        className={cn('flex items-center justify-center drop-shadow-[0_2px_3px_rgba(0,0,0,.35)]', dim ? 'saturate-[.4] brightness-[.85]' : '')}
        style={{ fontSize: size * 0.72, height: size, width: size }}
      >
        {troop.emoji}
      </span>
    );
  }

  return (
    <svg className={dim ? 'saturate-[.4] brightness-[.85]' : ''} height={size} viewBox="0 0 44 44" width={size}>
      <defs>
        <linearGradient id={`army-fallback-${troop.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#b8bec6" />
          <stop offset="1" stopColor="#6a7480" />
        </linearGradient>
      </defs>
      <path d="M6 8 L38 8 L38 28 Q22 42 6 28 Z" fill={`url(#army-fallback-${troop.id})`} stroke="#3d4a55" strokeLinejoin="round" strokeWidth="1.5" />
      <text fill="#fff" fontFamily="var(--bftc-font-display)" fontSize="16" fontWeight="800" stroke="#3d4a55" strokeWidth=".4" style={{ paintOrder: 'stroke' }} textAnchor="middle" x="22" y="26">
        {troop.short[0]}
      </text>
    </svg>
  );
}

function ArmyFilterButton({ active, filter, onClick }: { active: boolean; filter: ArmyFilterOption; onClick?: () => void }) {
  const tone = FILTER_TONE[filter.tone ?? 'wood'];
  return (
    <button
      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-[9px] px-1.5 py-1 font-game text-[10px] font-bold tracking-[.06em]"
      onClick={onClick}
      style={{
        background: active ? tone.background : 'rgba(255,255,255,.5)',
        border: `1.5px solid ${active ? tone.border : 'var(--parchment-700)'}`,
        boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.15)' : 'none',
        color: active ? tone.color : 'var(--fg-muted-parch)',
        textShadow: active && tone.color === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      }}
      type="button"
    >
      {filter.label}
      <span
        className="inline-flex h-3.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold tabular-nums"
        style={{
          background: active ? 'rgba(0,0,0,.25)' : 'var(--parchment-200)',
          color: active ? '#fff' : 'var(--fg-muted-parch)',
        }}
      >
        {filter.count}
      </span>
    </button>
  );
}

function PortraitTile({ onSelect, troop }: { onSelect?: (troop: ArmyTroop) => void; troop: ArmyTroop }) {
  const cat = CAT_COLOR[troop.category];
  const locked = !troop.unlocked;
  const total = troop.inVillage + (troop.fromAllies ?? 0);
  return (
    <button
      className="relative flex aspect-[.82/1] cursor-pointer flex-col overflow-hidden rounded-[14px] p-0 text-left shadow-[var(--shadow-card-inner-light),0_2px_0_rgba(0,0,0,.18)]"
      onClick={() => onSelect?.(troop)}
      style={{
        background: locked
          ? 'linear-gradient(to bottom, var(--game-stone-light), var(--game-stone-dark))'
          : 'linear-gradient(to bottom, var(--parchment-50), var(--parchment-300))',
        border: `2px solid ${locked ? 'var(--game-stone-border)' : 'var(--parchment-700)'}`,
      }}
      type="button"
    >
      <div
        className="relative flex flex-1 items-end justify-center overflow-hidden"
        style={{
          background: locked
            ? 'linear-gradient(to bottom, rgba(0,0,0,.05), rgba(0,0,0,.18))'
            : `linear-gradient(180deg, ${cat.light} 0%, ${cat.light} 60%, ${cat.dark} 100%)`,
          borderBottom: locked ? '2px solid var(--game-stone-border)' : `2px solid ${cat.border}`,
        }}
      >
        <TroopIcon dim={locked} size={50} troop={troop} />
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <img alt="" className="size-4 opacity-[.8] drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]" src={publicAsset('/assets/lock.png')} />
          </div>
        ) : null}
        {!locked && (troop.fromAllies ?? 0) > 0 ? (
          <div className="absolute right-[3px] top-[3px] inline-flex h-3.5 items-center gap-0.5 rounded-full border-[1.5px] border-[var(--game-blue-border)] bg-[linear-gradient(to_bottom,var(--game-blue-light),var(--game-blue-dark))] px-1 font-game text-[8.5px] font-extrabold tabular-nums text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
            +{troop.fromAllies}
          </div>
        ) : null}
      </div>
      <div
        className="px-[5px] pb-[5px] pt-1 text-center"
        style={{
          background: locked
            ? 'linear-gradient(to bottom, rgba(0,0,0,.04), rgba(0,0,0,.16))'
            : 'linear-gradient(to bottom, var(--parchment-100), var(--parchment-300))',
        }}
      >
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap font-game text-[9.5px] font-bold tracking-[.06em]"
          style={{
            color: locked ? 'var(--parchment-100)' : 'var(--fg-quill)',
            textShadow: locked ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
          }}
        >
          {troop.short}
        </div>
        <div
          className="font-game text-[17px] font-extrabold leading-none tabular-nums"
          style={{
            color: locked ? 'var(--parchment-50)' : 'var(--fg-quill)',
            opacity: locked ? 0.6 : 1,
            textShadow: locked ? '1px 1px 1px rgba(0,0,0,.5)' : '0 1px 0 rgba(255,255,255,.5)',
          }}
        >
          {locked ? `Niv. ${troop.requiredLevel}` : total}
        </div>
      </div>
    </button>
  );
}

function RecruitSheet({ activeDropLabel, dropIdleLabel, iconPath, isDragging = false, queue, summaryLabel, title, troops }: ArmyRecruitSheetProps & { troops: ArmyTroop[] }) {
  return (
    <div className="relative flex flex-col gap-[9px] border-t-[3px] border-[var(--game-gold-border)] bg-[linear-gradient(to_bottom,var(--wood-deep),var(--wood-bark))] px-2.5 pb-3 pt-2.5 shadow-[0_-6px_18px_rgba(0,0,0,.4)]">
      <div className="absolute left-1/2 top-1 h-1 w-9 -translate-x-1/2 rounded-full bg-[rgba(255,255,255,.35)]" />
      <div className="flex items-center gap-2 pt-1">
        <svg fill="none" height="14" stroke="var(--game-gold-glow)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="14">
          <path d={iconPath} />
        </svg>
        <span className="font-game text-xs font-extrabold uppercase tracking-[.22em] text-[var(--game-gold-glow)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">{title}</span>
        <span className="flex-1" />
        <span className="font-game text-[10px] font-bold text-[var(--parchment-300)]">{summaryLabel}</span>
      </div>
      <div className="flex items-center gap-[5px] rounded-[10px] border-[1.5px] border-[rgba(0,0,0,.5)] bg-[rgba(0,0,0,.3)] px-2 py-1.5 shadow-[inset_0_2px_3px_rgba(0,0,0,.25)]">
        {queue.map((item) => {
          const troop = troops.find((candidate) => candidate.id === item.troopId);
          return troop ? <QueueChip item={item} key={item.id} troop={troop} /> : null;
        })}
        <div
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 font-game text-[10px] italic text-[var(--parchment-400)]',
            isDragging
              ? 'animate-[bftcDropPulse_1.4s_ease-in-out_infinite] rounded-[9px] border-2 border-dashed border-[var(--game-gold-glow)] bg-[rgba(250,224,120,.22)] font-extrabold uppercase tracking-[.18em] text-[var(--game-gold-glow)] [text-shadow:0_1px_1px_rgba(0,0,0,.5)]'
              : '',
          )}
        >
          <svg className="opacity-[.7]" fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="11">
            <path d="M5 9 L12 2 L19 9 M12 2 v14" />
          </svg>
          {isDragging ? activeDropLabel : dropIdleLabel}
        </div>
      </div>
    </div>
  );
}

function QueueChip({ item, troop }: { item: ArmyQueueItem; troop: ArmyTroop }) {
  return (
    <div
      className="relative inline-flex items-center gap-1 overflow-hidden rounded-full border-[1.5px] py-[3px] pl-1 pr-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,.25)]"
      style={{
        background: item.active
          ? 'linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))'
          : 'linear-gradient(to bottom, var(--wood), var(--wood-dark))',
        borderColor: item.active ? 'var(--game-gold-border)' : 'var(--wood-deep)',
      }}
    >
      <TroopIcon size={18} troop={troop} />
      <span
        className="font-game text-[11px] font-extrabold tabular-nums"
        style={{
          color: item.active ? '#3a2a00' : '#fff',
          textShadow: item.active ? 'none' : '1px 1px 1px rgba(0,0,0,.4)',
        }}
      >
        ×{item.quantity}
      </span>
      {item.progress != null ? (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(0,0,0,.3)]">
          <div className="h-full bg-white shadow-[0_0_4px_rgba(255,255,255,.7)]" style={{ width: `${item.progress * 100}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function ArmyPhoneFrame({ children, screenLabel }: ArmyPhoneFrameProps) {
  return (
    <div
      className="flex size-full flex-col bg-[#1a1a2e] font-game text-[var(--fg-on-parchment)]"
      data-screen-label={screenLabel}
      style={ARMY_CSS_VARIABLES}
    >
      {children}
    </div>
  );
}

export function ArmyViewDesign({
  activeFilterId,
  bottomNav,
  filters,
  hud,
  onFilterChange,
  onTroopSelect,
  recruitSheet,
  screenLabel,
  troops,
  village,
}: ArmyViewProps) {
  return (
    <ArmyPhoneFrame screenLabel={screenLabel}>
      <ArmyTopBar {...hud} />
      <VillageBar {...village} />
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,var(--parchment-200),var(--parchment-400))]">
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 border-b-[1.5px] border-[var(--parchment-600)] bg-[linear-gradient(to_bottom,var(--parchment-200),var(--parchment-300))] px-2.5 pb-1.5 pt-2">
            {filters.map((filter) => (
              <ArmyFilterButton active={filter.id === activeFilterId} filter={filter} key={filter.id} onClick={() => onFilterChange?.(filter.id)} />
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-1.5 pt-2.5">
            <div className="grid grid-cols-4 gap-2">
              {troops.map((troop) => (
                <PortraitTile key={troop.id} onSelect={onTroopSelect} troop={troop} />
              ))}
            </div>
          </div>
          <RecruitSheet {...recruitSheet} troops={troops} />
        </div>
      </div>
      <ArmyBottomNav {...bottomNav} />
    </ArmyPhoneFrame>
  );
}

function StepperButton({ disabled, label, onClick, size = 44 }: { disabled?: boolean; label: string; onClick: () => void; size?: number }) {
  return (
    <button
      className="shrink-0 cursor-pointer rounded-xl border-2 border-[var(--parchment-700)] bg-[linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,.55))] p-0 font-game font-extrabold tracking-[.02em] text-[var(--fg-quill)] shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_1px_0_rgba(0,0,0,.12)] disabled:cursor-not-allowed disabled:opacity-[.5]"
      disabled={disabled}
      onClick={onClick}
      style={{ fontSize: size >= 44 ? 14 : 13, height: size, width: size }}
      type="button"
    >
      {label}
    </button>
  );
}

function QuickChip({ active, disabled, label, onClick, tone = 'wood' }: { active: boolean; disabled?: boolean; label: string; onClick: () => void; tone?: 'wood' | 'gold' }) {
  const toneBackground = tone === 'gold'
    ? 'linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))'
    : 'linear-gradient(180deg, var(--wood), var(--wood-dark))';
  const toneBorder = tone === 'gold' ? 'var(--game-gold-border)' : 'var(--wood-deep)';
  const toneColor = tone === 'gold' ? '#3a2a00' : '#fff';

  return (
    <button
      className="rounded-[10px] px-1 py-[9px] font-game text-[11px] font-extrabold tracking-[.06em] tabular-nums disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled
          ? 'linear-gradient(180deg, var(--parchment-300), var(--parchment-500))'
          : active
            ? toneBackground
            : 'linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.55))',
        border: disabled ? '1.5px solid var(--parchment-700)' : `2px solid ${active ? toneBorder : 'var(--parchment-700)'}`,
        boxShadow: disabled
          ? 'none'
          : active
            ? 'inset 0 1px 0 rgba(255,255,255,.32), 0 2px 0 rgba(0,0,0,.25)'
            : 'inset 0 1px 0 rgba(255,255,255,.4), 0 1px 0 rgba(0,0,0,.1)',
        color: disabled ? 'var(--fg-muted-parch)' : active ? toneColor : 'var(--fg-quill)',
        opacity: disabled ? 0.5 : 1,
        textShadow: active && toneColor === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function Slider({ max, onChange, value }: { max: number; onChange: (value: number) => void; value: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const fillBackground = percent >= 99
    ? 'linear-gradient(180deg, var(--game-red-light), var(--game-red-dark))'
    : percent > 80
      ? 'linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))'
      : 'linear-gradient(180deg, var(--game-green-light), var(--game-green-dark))';

  return (
    <div className="relative px-0 pb-0.5 pt-2.5">
      <div className="relative h-3 rounded-full border-[1.5px] border-[var(--wood-deep)] bg-[linear-gradient(180deg,var(--parchment-500),var(--parchment-700))] shadow-[inset_0_2px_3px_rgba(0,0,0,.32)]">
        <div className="absolute bottom-0 left-0 top-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,.4),inset_0_-1px_0_rgba(0,0,0,.2)]" style={{ background: fillBackground, width: `${percent}%` }} />
        {[25, 50, 75].map((tick) => (
          <div className="absolute bottom-px top-px w-px bg-[rgba(0,0,0,.2)]" key={tick} style={{ left: `${tick}%` }} />
        ))}
        <div className="absolute top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--game-gold-border)] bg-[linear-gradient(180deg,var(--game-gold-glow),var(--game-gold-dark))] shadow-[0_3px_6px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.55)]" style={{ left: `${percent}%` }}>
          <div className="size-[9px] rounded-full bg-[rgba(60,40,0,.45)] shadow-[inset_0_1px_1px_rgba(0,0,0,.5)]" />
        </div>
        <input
          className="absolute inset-0 m-0 size-full cursor-pointer p-0 opacity-0"
          max={max}
          min={1}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          type="range"
          value={value}
        />
      </div>
      <div className="mt-[5px] flex justify-between font-game text-[9.5px] font-extrabold uppercase tracking-[.1em] tabular-nums text-[var(--fg-muted-parch)]">
        <span>1</span>
        <span className="inline-flex items-center gap-1">Max</span>
      </div>
    </div>
  );
}

function ResourceBar({ have, icon, label, tone, used }: { have: number; icon: string; label: string; tone: string; used: number }) {
  const percent = Math.min(100, (used / have) * 100);
  const tight = percent > 85;
  return (
    <div className="flex items-center gap-2">
      <img alt="" className="size-5 shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]" src={publicAsset(icon)} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex justify-between font-game text-[10px] font-bold leading-none tabular-nums text-[var(--fg-on-parchment)]">
          <span className="uppercase tracking-[.08em] text-[var(--fg-muted-parch)]">{label}</span>
          <span>
            <span className={tight ? 'font-extrabold text-[var(--game-red-dark)]' : 'font-extrabold text-[var(--fg-quill)]'}>{formatNumber(used)}</span>
            <span className="text-[var(--fg-muted-parch)]"> / {formatNumber(have)}</span>
          </span>
        </div>
        <div className="h-[7px] overflow-hidden rounded-full border border-[var(--parchment-700)] bg-[var(--parchment-400)] shadow-[inset_0_1px_2px_rgba(0,0,0,.22)]">
          <div className="h-full shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" style={{ background: `linear-gradient(180deg, ${tone}, ${tone}c0)`, width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

export function ArmyRecruitPopup({
  labels,
  max,
  onCancel,
  onChange,
  onRecruit,
  quickValues,
  stock,
  troop,
  value,
}: ArmyRecruitPopupProps) {
  const boundedValue = clampQuantity(value, max);
  const cat = CAT_COLOR[troop.category];
  const cost = {
    iron: troop.cost.iron * boundedValue,
    stone: troop.cost.stone * boundedValue,
    wood: troop.cost.wood * boundedValue,
  };
  const populationUsed = troop.pop * boundedValue;
  const afterPopulation = stock.population + populationUsed;
  const populationTight = afterPopulation > stock.popMax * 0.92;
  const atMax = boundedValue >= max;
  const update = (nextValue: number) => onChange(clampQuantity(nextValue, max));

  return (
    <div
      className="relative flex flex-col gap-[9px] rounded-t-[22px] px-3.5 pb-3.5 pt-2 shadow-[0_-14px_36px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.55)]"
      style={{
        background: 'linear-gradient(180deg, var(--parchment-100) 0%, var(--parchment-200) 55%, var(--parchment-400) 100%)',
        borderTop: `3px solid ${cat.border}`,
      }}
    >
      <div className="mx-auto h-[5px] w-11 rounded-full bg-[var(--wood-deeper)] opacity-[.32]" />
      <div className="flex items-center gap-2.5">
        <div className="flex size-[50px] shrink-0 items-center justify-center rounded-[14px] border-2 shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.2)]" style={{ background: `linear-gradient(180deg, ${cat.light}, ${cat.dark})`, borderColor: cat.border }}>
          <TroopIcon size={40} troop={troop} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-game text-[15px] font-extrabold leading-none tracking-[.01em] text-[var(--fg-quill)]">{troop.name}</div>
          <div className="mt-[5px] flex items-center gap-1.5">
            <span className="rounded-full border-[1.5px] px-[7px] py-[1.5px] font-game text-[8.5px] font-extrabold uppercase tracking-[.12em]" style={{ background: `linear-gradient(180deg, ${cat.light}, ${cat.dark})`, borderColor: cat.border, color: cat.ink, textShadow: cat.ink === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none' }}>
              {troop.category}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-[14px] border-[1.5px] border-[var(--parchment-600)] bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.13))] px-2 py-2 shadow-[inset_0_2px_4px_rgba(0,0,0,.18)]">
        <StepperButton disabled={boundedValue <= 1} label="−10" onClick={() => update(boundedValue - 10)} />
        <StepperButton disabled={boundedValue <= 1} label="−1" onClick={() => update(boundedValue - 1)} size={40} />
        <div className="min-w-0 flex-1 px-1 text-center">
          <div className="font-game text-4xl font-extrabold leading-none tracking-[.005em] tabular-nums text-[var(--fg-quill)] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">{formatNumber(boundedValue)}</div>
          <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap font-game text-[9px] font-bold uppercase tracking-[.14em] text-[var(--fg-muted-parch)]">
            {troop.short} {boundedValue > 1 ? '× ' : ''}
          </div>
        </div>
        <StepperButton disabled={boundedValue >= max} label="+1" onClick={() => update(boundedValue + 1)} size={40} />
        <StepperButton disabled={boundedValue >= max} label="+10" onClick={() => update(boundedValue + 10)} />
      </div>
      <Slider max={max} onChange={update} value={boundedValue} />
      <div className="grid grid-cols-5 gap-[5px]">
        {quickValues.map((quick) => (
          <QuickChip
            active={boundedValue === quick.value}
            disabled={quick.value > max}
            key={quick.label}
            label={quick.label}
            onClick={() => update(quick.value)}
            tone={quick.tone}
          />
        ))}
      </div>
      <div className="flex flex-col gap-[5px] rounded-xl border-[1.5px] border-[var(--parchment-500)] bg-[rgba(0,0,0,.05)] px-2.5 py-2">
        <ResourceBar have={stock.wood} icon="/assets/resources/wood.png" label={labels.resourceWood} tone="#a67c52" used={cost.wood} />
        <ResourceBar have={stock.stone} icon="/assets/resources/stone.png" label={labels.resourceStone} tone="#8a99a8" used={cost.stone} />
        <ResourceBar have={stock.iron} icon="/assets/resources/iron.png" label={labels.resourceIron} tone="#c79055" used={cost.iron} />
        <div className="flex items-center gap-2 border-t border-dashed border-[var(--parchment-600)] pt-[5px]">
          <img alt="" className="size-5 drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]" src={publicAsset('/assets/resources/population.png')} />
          <span className="flex-1 font-game text-[10px] font-bold uppercase tracking-[.08em] text-[var(--fg-muted-parch)]">{labels.population}</span>
          <span className="font-game text-[10px] font-bold tabular-nums">
            <span className="text-[var(--fg-quill)]">{stock.population}</span>
            <span className={populationTight ? 'text-[var(--game-red-dark)]' : 'text-[var(--game-green-dark)]'}> → {afterPopulation}</span>
            <span className="text-[var(--fg-muted-parch)]"> / {stock.popMax}</span>
          </span>
        </div>
      </div>
      <div className="mt-0.5 flex gap-2">
        <button className="w-24 shrink-0 cursor-pointer rounded-xl border-2 border-[var(--game-stone-border)] bg-[linear-gradient(180deg,var(--game-stone-light),var(--game-stone-dark))] px-2.5 py-[13px] font-game text-xs font-extrabold uppercase tracking-[.14em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_2px_0_rgba(0,0,0,.22)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]" onClick={onCancel} type="button">
          {labels.cancel}
        </button>
        <button
          className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-[13px] font-game font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,.32),0_3px_0_rgba(0,0,0,.26)]"
          onClick={() => onRecruit?.(boundedValue)}
          style={{
            background: atMax
              ? 'linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))'
              : 'linear-gradient(180deg, var(--game-green-light), var(--game-green-dark))',
            borderColor: atMax ? 'var(--game-gold-border)' : 'var(--game-green-border)',
            color: atMax ? '#3a2a00' : '#fff',
            textShadow: atMax ? 'none' : '1px 1px 1px rgba(0,0,0,.5)',
          }}
          type="button"
        >
          <span className="text-xs uppercase tracking-[.14em]">{labels.recruit}</span>
          <span className="ml-[7px] text-[17px] tracking-[.01em] tabular-nums">×{formatNumber(boundedValue)}</span>
        </button>
      </div>
    </div>
  );
}

export function ArmyRecruitOverlay({ army, popup, screenLabel }: ArmyRecruitOverlayProps) {
  return (
    <div className="relative size-full overflow-hidden" data-screen-label={screenLabel}>
      <ArmyViewDesign {...army} />
      <div className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(180deg,rgba(15,8,2,.18)_0%,rgba(15,8,2,.18)_88px,rgba(15,8,2,.55)_88px,rgba(15,8,2,.6)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <ArmyRecruitPopup {...popup} />
      </div>
    </div>
  );
}

function GhostChip({ troop }: { troop: ArmyTroop }) {
  const cat = CAT_COLOR[troop.category];
  return (
    <div className="inline-flex flex-col items-center rounded-[11px] border-2 px-[9px] py-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_3px_0_rgba(0,0,0,.25)]" style={{ background: `linear-gradient(180deg, ${cat.light}, ${cat.dark})`, borderColor: cat.border }}>
      <TroopIcon size={32} troop={troop} />
      <span className="mt-0.5 font-game text-[10px] font-extrabold tracking-[.06em]" style={{ color: cat.ink, textShadow: cat.ink === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none' }}>
        {troop.short}
      </span>
    </div>
  );
}

export function ArmyDraggingOverlay({ army, ghostLabel, troopId }: ArmyDraggingOverlayProps) {
  const troop = army.troops.find((candidate) => candidate.id === troopId);
  if (!troop) return <ArmyViewDesign {...army} />;

  return (
    <div className="relative size-full overflow-hidden" data-screen-label={ghostLabel}>
      <style>{`
        @keyframes bftcDropPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(250,224,120,.5), inset 0 0 12px rgba(250,224,120,.3); }
          50% { box-shadow: 0 0 24px rgba(250,224,120,.85), inset 0 0 18px rgba(250,224,120,.5); }
        }
      `}</style>
      <ArmyViewDesign {...army} recruitSheet={{ ...army.recruitSheet, isDragging: true }} />
      <div className="pointer-events-none absolute left-[142px] top-[360px] z-[35] rotate-[-7deg] scale-[1.18] drop-shadow-[0_10px_16px_rgba(0,0,0,.45)]">
        <GhostChip troop={troop} />
      </div>
      <div className="pointer-events-none absolute left-[180px] top-[390px] z-[36] size-[54px] rounded-full border-2 border-[rgba(255,255,255,.65)] bg-[radial-gradient(circle,rgba(255,255,255,.55)_0%,rgba(255,255,255,.18)_45%,rgba(255,255,255,0)_75%)] shadow-[0_0_24px_rgba(255,255,255,.45)]" />
      <div className="pointer-events-none absolute left-24 top-[218px] z-[28] h-24 w-[78px] rounded-[14px] border-2 border-[var(--game-gold-glow)] shadow-[0_0_14px_rgba(250,224,120,.6),inset_0_0_10px_rgba(250,224,120,.3)]" />
    </div>
  );
}
