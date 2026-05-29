import type { HTMLAttributes, ReactNode } from 'react';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';
import { GameBottomSheetPanel } from './GameBottomSheetPanel';
import { SegmentedControl } from './SegmentedControl';
import { villageStyleOptions } from './villageStyleData';

export type MultiVillageFilter = 'all' | 'active' | 'alerts';
export type MultiVillageResourceKind = 'wood' | 'stone' | 'iron' | 'pop';
export type MultiVillageActivityKind = 'build' | 'troops' | 'lords';
export type MultiVillageAlertKind = 'attack' | 'warning';

export interface MultiVillageResource {
  max: number;
  n: number;
}

export interface MultiVillageBuildActivity {
  eta: string;
  name: string;
  progress: number;
  target: string;
  to: number;
}

export interface MultiVillageTroopActivity {
  count: number;
  eta: string;
  label: string;
  progress: number;
  unit: string;
}

export interface MultiVillageLordActivity {
  eta: string;
  name: string;
  progress: number;
}

export interface MultiVillageAlert {
  eta: string;
  kind: MultiVillageAlertKind;
  msg: string;
}

export interface MultiVillageItem {
  active?: boolean;
  alert?: MultiVillageAlert | null;
  badge?: string | null;
  builds?: MultiVillageBuildActivity[];
  capitale?: boolean;
  coords: string;
  id: string;
  level?: number;
  lords?: MultiVillageLordActivity[];
  name: string;
  power?: string;
  resources?: Record<MultiVillageResourceKind, MultiVillageResource>;
  strategy?: VillageStrategyType;
  troops?: MultiVillageTroopActivity[];
}

export interface MultiVillageBottomSheetLabels {
  allFilter: string;
  alertsFilter: string;
  empty: string;
  eyebrow: string;
  buildActivity: string;
  close: string;
  activeFilter: string;
  levelPrefix: string;
  lordActivity: string;
  noActivity: string;
  sort: string;
  title: string;
  troopsActivity: string;
}

export interface MultiVillageBottomSheetProps {
  capacity?: number;
  className?: string;
  filter: MultiVillageFilter;
  labels: MultiVillageBottomSheetLabels;
  availableFilters?: MultiVillageFilter[];
  onClose?: () => void;
  onActivitySelect?: (village: MultiVillageItem, kind: MultiVillageActivityKind) => void;
  onFilterChange: (filter: MultiVillageFilter) => void;
  onSelectVillage?: (village: MultiVillageItem) => void;
  onSort?: () => void;
  totalCount?: number;
  villages: MultiVillageItem[];
}

interface ActivityChipProps {
  eta?: string;
  kind: MultiVillageActivityKind;
  labels: Pick<MultiVillageBottomSheetLabels, 'buildActivity' | 'lordActivity' | 'troopsActivity'>;
  onClick?: () => void;
}

interface AlertPillProps {
  alert: MultiVillageAlert;
  dense?: boolean;
}

interface FilterSegProps {
  availableFilters?: MultiVillageFilter[];
  labels: Pick<MultiVillageBottomSheetLabels, 'activeFilter' | 'allFilter' | 'alertsFilter'>;
  onChange: (filter: MultiVillageFilter) => void;
  value: MultiVillageFilter;
}

interface ResourceChipProps {
  compact?: boolean;
  kind: MultiVillageResourceKind;
  max: number;
  n: number;
}

interface ResourceRowProps {
  resources?: Record<MultiVillageResourceKind, MultiVillageResource>;
}

interface StrategyIconProps {
  strategy: VillageStrategyType;
}

interface VillageCardProps {
  labels: Pick<
    MultiVillageBottomSheetLabels,
    'buildActivity' | 'levelPrefix' | 'lordActivity' | 'troopsActivity'
  >;
  onActivitySelect?: (village: MultiVillageItem, kind: MultiVillageActivityKind) => void;
  onSelect?: (village: MultiVillageItem) => void;
  village: MultiVillageItem;
}

interface VillageIdentityProps {
  levelPrefix: string;
  village: MultiVillageItem;
}

interface VillageTierSpriteProps {
  size?: number;
  tier?: number;
}

const resourceMeta: Record<MultiVillageResourceKind, { icon: string; label: string }> = {
  iron: { icon: '/assets/resources/iron.png', label: 'Fer' },
  pop: { icon: '/assets/resources/population.png', label: 'Population' },
  stone: { icon: '/assets/resources/stone.png', label: 'Pierre' },
  wood: { icon: '/assets/resources/wood.png', label: 'Bois' },
};

const strategyOptionsById = Object.fromEntries(villageStyleOptions.map((option) => [option.id, option]));

function formatCompactNumber(n: number) {
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function tierFromPower(power: string) {
  const value = Number.parseInt(String(power).replace(/\D/g, ''), 10) || 0;
  if (value >= 5000) return 6;
  if (value >= 2500) return 5;
  if (value >= 1500) return 4;
  if (value >= 800) return 3;
  if (value >= 300) return 2;
  return 1;
}

function HammerGlyph({ size = 14, color = '#fef9f0' }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 16 16" width={size}>
      <rect fill={color} height="5" rx="1.4" stroke="#1f1308" strokeWidth="1" width="11" x="1.5" y="3" />
      <rect fill="#1f1308" height="1.6" opacity=".22" width="11" x="1.5" y="5" />
      <rect fill="#7a5a32" height="7" rx=".4" stroke="#1f1308" strokeWidth=".8" width="2.2" x="6" y="7.5" />
    </svg>
  );
}

function SwordsGlyph({ size = 14, color = '#fef9f0' }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 16 16" width={size}>
      <path d="M2.5 13.5 L11 5" stroke={color} strokeLinecap="round" strokeWidth="2" />
      <path d="M13.5 13.5 L5 5" stroke={color} strokeLinecap="round" strokeWidth="2" />
      <path d="M10.2 3.5 L13 3.5 L13 6.3 Z" fill={color} stroke="#1f1308" strokeWidth=".5" />
      <path d="M5.8 3.5 L3 3.5 L3 6.3 Z" fill={color} stroke="#1f1308" strokeWidth=".5" />
      <rect fill="#7a5a32" height="1.6" rx=".4" stroke="#1f1308" strokeWidth=".4" width="3" x="1.5" y="13" />
      <rect fill="#7a5a32" height="1.6" rx=".4" stroke="#1f1308" strokeWidth=".4" width="3" x="11.5" y="13" />
    </svg>
  );
}

function HelmGlyph({ size = 14, color = '#f6d57b' }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 16 16" width={size}>
      <path d="M3 11 C3 6 5 4 8 4 C11 4 13 6 13 11 L13 13 L3 13 Z" fill={color} stroke="#1f1308" strokeWidth="1" />
      <rect fill="#1f1308" height="1.4" opacity=".55" width="8" x="4" y="8" />
      <rect fill="#1f1308" height=".8" opacity=".3" width="8" x="4" y="10.2" />
      <path d="M8 2 L8 4" stroke="#1f1308" strokeLinecap="round" strokeWidth="1" />
      <circle cx="8" cy="1.7" fill="#c93a2e" r="1.3" stroke="#1f1308" strokeWidth=".5" />
    </svg>
  );
}

function AlertGlyph({ size = 12, color = '#fff' }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 16 16" width={size}>
      <path d="M8 1.5 L15 14 L1 14 Z" fill="#c93a2e" stroke="#1f1308" strokeWidth="1" />
      <rect fill={color} height="4.5" width="2" x="7" y="5.5" />
      <rect fill={color} height="1.6" width="2" x="7" y="11" />
    </svg>
  );
}

function ClockGlyph({ size = 10, color = '#cdb88a' }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 12 12" width={size}>
      <circle cx="6" cy="6" fill="none" r="5" stroke={color} strokeWidth="1.4" />
      <path d="M6 3 L6 6 L8.5 7.5" fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function SortGlyph() {
  return (
    <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14">
      <path d="M3 4 H13 M4 8 H12 M5 12 H11" stroke="#3d2f1f" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function VillageTierSprite({ size = 40, tier = 1 }: VillageTierSpriteProps) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  return (
    <img
      alt=""
      aria-hidden="true"
      className="block object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]"
      height={size}
      src={publicAsset(`/assets/world/entity/village-tier${clampedTier}.png`)}
      width={size}
    />
  );
}

function StrategyIcon({ strategy }: StrategyIconProps) {
  const option = strategyOptionsById[strategy] ?? strategyOptionsById.BALANCED;

  return (
    <img
      alt={option.name}
      className="ml-auto size-6 shrink-0 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.28)]"
      src={publicAsset(option.shield)}
      title={option.name}
    />
  );
}

function ResourceChip({ compact = false, kind, max, n }: ResourceChipProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, n / max)) : 0;
  const nearFull = ratio >= 0.9;
  const meta = resourceMeta[kind];
  const title = `${meta.label} · ${n.toLocaleString('fr-FR')} / ${max.toLocaleString('fr-FR')}`;

  if (compact) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-full border py-[3px] pl-[5px] pr-2.5',
          nearFull ? 'border-[rgba(158,123,13,.55)] bg-[linear-gradient(180deg,rgba(255,246,221,.78),rgba(232,200,120,.5))] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]' : 'border-[rgba(166,124,82,.38)] bg-[linear-gradient(180deg,rgba(254,249,240,.62),rgba(235,217,175,.38))] shadow-[inset_0_1px_0_rgba(255,255,255,.42)]',
        )}
        title={title}
      >
        <img alt="" className="size-4 shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]" src={publicAsset(meta.icon)} />
        <span className={cn('whitespace-nowrap font-game text-[12px] font-extrabold leading-none tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.45)]', nearFull ? 'text-[#7a4d05]' : 'text-[#3d2f1f]')}>
          {formatCompactNumber(n)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-0.5 rounded-[9px] border pb-1 pl-[5px] pr-2 pt-[3px]',
        nearFull
          ? 'border-[rgba(158,123,13,.55)] bg-[linear-gradient(180deg,rgba(255,246,221,.78),rgba(232,200,120,.5))] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]'
          : 'border-[rgba(166,124,82,.38)] bg-[linear-gradient(180deg,rgba(254,249,240,.62),rgba(235,217,175,.38))] shadow-[inset_0_1px_0_rgba(255,255,255,.42)]',
      )}
      title={title}
    >
      <div className="flex items-center gap-1">
        <img alt="" className="size-4 shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]" src={publicAsset(meta.icon)} />
        <span className={cn('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-right font-game text-[12px] font-extrabold leading-none tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.45)]', nearFull ? 'text-[#7a4d05]' : 'text-[#3d2f1f]')}>
          {formatCompactNumber(n)}
        </span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-sm bg-[rgba(93,74,50,.16)] shadow-[inset_0_1px_1px_rgba(0,0,0,.14)]">
        <div
          className={cn('h-full', nearFull ? 'bg-[linear-gradient(180deg,#f5c84c,#b98517)]' : 'bg-[linear-gradient(180deg,#b78a45,#8a642d)]')}
          style={{ width: `${Math.max(2, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}

function UnavailableResourceChip({ compact = false, kind }: { compact?: boolean; kind: MultiVillageResourceKind }) {
  const meta = resourceMeta[kind];

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-[9px] border border-[rgba(166,124,82,.22)] bg-[rgba(255,255,255,.2)] px-2 py-[7px] opacity-75 shadow-[inset_0_1px_0_rgba(255,255,255,.25)]',
        compact ? 'shrink-0' : 'flex-1',
      )}
      title={`${meta.label} : donnée non disponible`}
    >
      <img alt="" className="size-4 shrink-0 opacity-70 drop-shadow-[0_1px_1px_rgba(0,0,0,.2)]" src={publicAsset(meta.icon)} />
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-right font-game text-[12px] font-extrabold leading-none text-[#6d5838]">
        —
      </span>
    </div>
  );
}

function ResourceRow({ resources }: ResourceRowProps) {
  if (!resources) {
    return (
      <div className="flex items-stretch gap-1.5">
        <UnavailableResourceChip kind="wood" />
        <UnavailableResourceChip kind="stone" />
        <UnavailableResourceChip kind="iron" />
        <UnavailableResourceChip compact kind="pop" />
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-1.5">
      <ResourceChip kind="wood" max={resources.wood.max} n={resources.wood.n} />
      <ResourceChip kind="stone" max={resources.stone.max} n={resources.stone.n} />
      <ResourceChip kind="iron" max={resources.iron.max} n={resources.iron.n} />
      <ResourceChip compact kind="pop" max={resources.pop.max} n={resources.pop.n} />
    </div>
  );
}

function ActivityChip({ eta, kind, labels, onClick }: ActivityChipProps) {
  const empty = !eta;
  const palette: Record<MultiVillageActivityKind, { glyph: ReactNode; label: string }> = {
    build: { glyph: <HammerGlyph color="#3d2f1f" size={11} />, label: labels.buildActivity },
    lords: { glyph: <HelmGlyph color="#a07118" size={11} />, label: labels.lordActivity },
    troops: { glyph: <SwordsGlyph color="#3d2f1f" size={11} />, label: labels.troopsActivity },
  };
  const meta = palette[kind];
  const interactive = Boolean(!empty && onClick);
  const content = (
    <>
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border',
          empty ? 'border-[rgba(166,124,82,.2)] bg-[rgba(166,124,82,.12)] opacity-[.48]' : 'border-[rgba(160,113,24,.45)] bg-[linear-gradient(180deg,rgba(255,244,207,.72),rgba(225,195,120,.42))]',
        )}
      >
        {meta.glyph}
      </span>
      <span className={cn('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-game text-[11.5px] font-extrabold leading-none tracking-[.02em] tabular-nums', empty ? 'text-left text-[#6d5838]' : 'text-right text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.4)]')}>
        {empty ? '—' : eta}
      </span>
    </>
  );

  return (
    <button
      aria-label={empty ? `${meta.label} : aucune` : `${meta.label} · ${eta}`}
      className={cn(
        'flex h-[22px] min-w-0 flex-1 items-center gap-1 rounded-full border pb-0.5 pl-1 pr-2 pt-0.5',
        empty ? 'border-[rgba(166,124,82,.22)] bg-[rgba(255,255,255,.18)]' : 'border-[rgba(166,124,82,.36)] bg-[linear-gradient(180deg,rgba(254,249,240,.56),rgba(235,217,175,.34))] shadow-[inset_0_1px_0_rgba(255,255,255,.38)]',
        interactive ? 'cursor-pointer transition-transform active:translate-y-px' : 'cursor-default',
      )}
      disabled={!interactive}
      onClick={onClick}
      title={empty ? `${meta.label} : aucune` : `${meta.label} · ${eta}`}
      type="button"
    >
      {content}
    </button>
  );
}

function AlertPill({ alert, dense = false }: AlertPillProps) {
  const isAttack = alert.kind === 'attack';

  return (
    <div
      className={cn(
        'flex items-center gap-[7px] rounded-lg border-[1.5px] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_0_rgba(0,0,0,.25)]',
        dense ? 'mt-1 px-2 py-1' : 'mt-1.5 px-[9px] py-[5px]',
        isAttack ? 'border-[#a93226] bg-[linear-gradient(180deg,rgba(201,58,46,.95),rgba(122,24,18,.95))]' : 'border-[#9e7b0d] bg-[linear-gradient(180deg,rgba(217,151,49,.95),rgba(146,84,17,.95))]',
      )}
    >
      <AlertGlyph size={12} />
      <span className="flex-1 font-game text-[10.5px] font-extrabold tracking-[.02em] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.55)]">
        {alert.msg}
      </span>
      <span className="inline-flex items-center gap-[3px] rounded-full border border-[rgba(0,0,0,.4)] bg-[rgba(0,0,0,.35)] px-1.5 py-px font-game text-[9.5px] font-extrabold text-white tabular-nums [text-shadow:1px_1px_1px_rgba(0,0,0,.55)]">
        <ClockGlyph color="#fff" size={9} />
        {alert.eta}
      </span>
    </div>
  );
}

function VillageIdentity({ levelPrefix, village }: VillageIdentityProps) {
  const tier = village.power ? tierFromPower(village.power) : 1;
  const hasDetails = village.level !== undefined || Boolean(village.power) || Boolean(village.coords);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={cn(
          'relative flex size-11 shrink-0 items-center justify-center rounded-lg border-2',
          village.capitale ? 'border-[#9e7b0d] bg-[linear-gradient(180deg,#f1c40f,#d4a017)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_0_8px_rgba(246,213,123,.4),0_1px_0_rgba(0,0,0,.18)]' : 'border-[#5d4a32] bg-[linear-gradient(180deg,#d9c896,#a67c52)] shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_1px_0_rgba(0,0,0,.14)]',
        )}
      >
        <VillageTierSprite size={38} tier={tier} />
        {village.capitale ? (
          <img
            alt=""
            className="pointer-events-none absolute -top-1.5 left-1/2 w-3.5 -translate-x-1/2 -rotate-6 drop-shadow-[0_1px_2px_rgba(0,0,0,.45)]"
            src={publicAsset('/assets/casual-icons/crown.png')}
          />
        ) : null}
        <span className="absolute -bottom-1 -right-1 rounded-full border-[1.4px] border-[#5d4a32] bg-[linear-gradient(180deg,#fef9f0,#d9c896)] px-1 font-game text-[8px] font-extrabold leading-[1.25] tracking-[.06em] text-[#3d2f1f] shadow-[0_1px_0_rgba(0,0,0,.22)]">
          T{tier}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-[7px]">
          <span className="min-w-0 flex-1 truncate font-game text-[15px] font-extrabold tracking-[.01em] text-[#3d2f1f]">{village.name}</span>
          {village.badge ? (
            <span className="shrink-0 rounded-full border border-[rgba(158,123,13,.4)] bg-[rgba(241,196,15,.18)] px-2 py-0.5 font-game text-[9px] font-extrabold uppercase tracking-[.08em] text-[#7a4d05]">
              {village.badge}
            </span>
          ) : null}
          {village.strategy ? <StrategyIcon strategy={village.strategy} /> : null}
        </div>
        {hasDetails ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-[7px] font-game text-[11.5px] text-[#6d5838]">
            {village.level !== undefined ? (
              <>
                <span className="whitespace-nowrap">
                  {levelPrefix} <b className="text-[#3d2f1f]">{village.level}</b>
                </span>
                <span className="opacity-40">·</span>
              </>
            ) : null}
            {village.power ? (
              <>
                <span className="inline-flex items-center gap-[3px] whitespace-nowrap">
                  <img alt="" className="w-[11px]" src={publicAsset('/assets/army-power.png')} />
                  <b className="text-[#3d2f1f] tabular-nums">{village.power.replace(/\s/g, '\u00a0')}</b>
                </span>
                <span className="opacity-40">·</span>
              </>
            ) : null}
            <span className="inline-flex items-center gap-[3px] whitespace-nowrap tabular-nums">
              <img alt="" className="w-2.5 opacity-[.65]" src={publicAsset('/assets/position.png')} />
              {village.coords}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VillageCard({ labels, onActivitySelect, onSelect, village }: VillageCardProps) {
  const builds = village.builds ?? [];
  const troops = village.troops ?? [];
  const lords = village.lords ?? [];

  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer flex-col gap-2 border-0 border-b border-[rgba(93,74,50,.28)] py-3.5 pl-3.5 pr-9 text-left',
        'bg-[linear-gradient(90deg,rgba(254,249,240,.78),rgba(235,217,175,.55))]',
        village.active ? 'shadow-[inset_3px_0_0_rgba(158,123,13,.9),inset_0_1px_0_rgba(255,255,255,.45)]' : 'shadow-[inset_0_1px_0_rgba(255,255,255,.35)]',
      )}
    >
      <button className="min-w-0 text-left" onClick={() => onSelect?.(village)} type="button">
        <VillageIdentity levelPrefix={labels.levelPrefix} village={village} />
      </button>
      <button className="text-left" onClick={() => onSelect?.(village)} type="button">
        <ResourceRow resources={village.resources} />
      </button>
      <div className="flex gap-1">
        <ActivityChip eta={builds[0]?.eta} kind="build" labels={labels} onClick={() => onActivitySelect?.(village, 'build')} />
        <ActivityChip eta={troops[0]?.eta} kind="troops" labels={labels} onClick={() => onActivitySelect?.(village, 'troops')} />
        <ActivityChip eta={lords[0]?.eta} kind="lords" labels={labels} onClick={() => onActivitySelect?.(village, 'lords')} />
      </div>
      {village.alert ? <AlertPill alert={village.alert} dense /> : null}
      <button
        aria-label={`Ouvrir ${village.name}`}
        className="absolute inset-y-0 right-0 w-9 font-game text-[26px] font-extrabold leading-none text-[#6d5838] opacity-60"
        onClick={() => onSelect?.(village)}
        type="button"
      >
        ›
      </button>
    </div>
  );
}

function FilterSeg({ availableFilters, labels, onChange, value }: FilterSegProps) {
  const allowed = new Set(availableFilters ?? ['all', 'active', 'alerts']);
  const allOptions = [
    { id: 'all', label: labels.allFilter },
    { id: 'active', label: labels.activeFilter },
    { id: 'alerts', label: labels.alertsFilter },
  ] satisfies { id: MultiVillageFilter; label: string }[];
  const options = allOptions.filter((option) => allowed.has(option.id));

  return (
    <SegmentedControl
      ariaLabel="Filtrer les villages"
      className="flex w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:justify-center [&>button]:px-1.5 [&>button]:py-1 [&>button]:text-[10.5px] [&>button]:uppercase [&>button]:tracking-[.05em]"
      onChange={(next) => onChange(next as MultiVillageFilter)}
      options={options.map((option) => ({ label: option.label, value: option.id }))}
      size="compact"
      value={value}
    />
  );
}

export function MultiVillageBottomSheet({
  availableFilters,
  capacity,
  className,
  filter,
  labels,
  onActivitySelect,
  onFilterChange,
  onSelectVillage,
  onSort,
  totalCount,
  villages,
}: MultiVillageBottomSheetProps) {
  const visible = villages.filter((village) => {
    if (filter === 'active') return village.active || (village.builds?.length ?? 0) + (village.troops?.length ?? 0) + (village.lords?.length ?? 0) > 0;
    if (filter === 'alerts') return Boolean(village.alert);
    return true;
  });
  const count = totalCount ?? villages.length;
  const filters = availableFilters ?? ['all', 'active', 'alerts'];
  const hasFilterTabs = filters.length > 1;
  const title = (
    <>
      {labels.title}
      <span className="ml-[7px] font-game text-xs font-bold tracking-[0] text-[#6d5838]">
        {count}/{capacity ?? count}
      </span>
    </>
  );
  const filterTabs = hasFilterTabs ? (
    <div className="flex min-w-0 flex-1 items-stretch">
      <FilterSeg availableFilters={filters} labels={labels} onChange={onFilterChange} value={filter} />
    </div>
  ) : undefined;
  const headerActions = onSort ? (
    <button
      aria-label={labels.sort}
      className="flex size-[34px] cursor-pointer items-center justify-center rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(180deg,#fef9f0,#d9c896)] p-0 font-game text-[13px] font-extrabold text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.18)]"
      onClick={onSort}
      title={labels.sort}
      type="button"
    >
      <SortGlyph />
    </button>
  ) : undefined;

  return (
    <GameBottomSheetPanel
      bodyClassName="p-0"
      className={className}
      eyebrow={labels.eyebrow}
      headerActions={headerActions}
      tabs={filterTabs}
      tabsFullWidth
      title={title}
      variant={hasFilterTabs ? 'tabbed' : 'default'}
    >
      <div className="flex min-h-full flex-col">
        {visible.map((village) => (
          <VillageCard
            key={village.id}
            labels={labels}
            onActivitySelect={onActivitySelect}
            onSelect={onSelectVillage}
            village={village}
          />
        ))}
        {visible.length === 0 ? (
          <div className="px-4 py-[30px] text-center font-game text-xs italic text-[#6d5838]">{labels.empty}</div>
        ) : null}
      </div>
    </GameBottomSheetPanel>
  );
}

export function MultiVillagePhoneFrame({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn('relative h-[720px] w-[390px] max-w-full overflow-hidden rounded-[28px] border-[10px] border-[#17110c] bg-[#1a1a2e] shadow-[0_18px_42px_rgba(60,38,25,.32)]', className)}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_12%,rgba(246,213,123,.18),transparent_26%),linear-gradient(180deg,#25411f,#122115_46%,#0f1720)]" />
      <div className="absolute inset-x-0 top-0 h-[72px] bg-[linear-gradient(180deg,rgba(60,38,25,.92),rgba(60,38,25,.35),transparent)]" />
      <div className="absolute left-3 right-3 top-4 flex items-center justify-between rounded-[14px] border-2 border-[#3c2619] bg-[linear-gradient(180deg,rgba(60,38,25,.94),rgba(78,56,34,.94))] px-3 py-2 font-game text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f0e0c0] shadow-[inset_0_1px_0_rgba(255,255,255,.16)]">
        <span>Royaume</span>
        <span>Carte</span>
      </div>
      <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] backdrop-blur-[2px]" />
      {children}
    </div>
  );
}
