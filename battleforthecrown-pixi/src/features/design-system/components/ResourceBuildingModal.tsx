import type { ReactNode } from 'react';
import {
  BuildingModal,
  type BuildingModalAccent,
  type BuildingModalAction,
  type BuildingModalConstruction,
  type BuildingModalNotice,
} from './BuildingModal';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type ResourceBuildingKey = 'quarter' | 'iron' | 'stone' | 'wood';
export type ResourceBuildingLinkVariant = 'arrow-pill' | 'chevron' | 'none' | 'rail' | 'rule';
export type ResourceBuildingActionTone = 'danger' | 'neutral' | 'success' | 'warning';

export type ResourceBuildingAccent = BuildingModalAccent;

export interface ResourceBuildingLevelStats {
  production: number;
  storage: number;
}

export interface ResourceBuildingCost {
  crowns: number;
  iron: number;
  stone: number;
  wood: number;
}

export type ResourceBuildingStock = ResourceBuildingCost;

export interface ResourceBuildingLabels {
  actionClose: string;
  actionCancelConstruction: string;
  actionMaxLevel: string;
  actionUpgrade: string;
  currentLevel: string;
  economyLoop: string;
  maxLevelReached: string;
  nextLevel: string;
  requirementLabel: string;
  sectionHousing: string;
  sectionCapacity: string;
  sectionProduction: string;
  sectionStorage: string;
  subtitle: string;
  upgradeLabel: string;
}

export interface ResourceBuildingModalAction {
  disabled?: boolean;
  id: 'cancel-construction' | 'close' | 'upgrade';
  label: string;
  tone: ResourceBuildingActionTone;
}

export interface ResourceBuildingConstruction {
  cancelDisabled?: boolean;
  cancelLabel?: string;
  state: BuildingModalConstruction;
}

export interface ResourceBuildingModalProps {
  accent: ResourceBuildingAccent;
  buildingIcon: string;
  closeLabel?: string;
  construction?: ResourceBuildingConstruction;
  cost: ResourceBuildingCost;
  eyebrow: string;
  error?: string | null;
  footerHint?: string;
  isPopulation?: boolean;
  labels?: Partial<ResourceBuildingLabels>;
  level: number;
  levelStats: Record<number, ResourceBuildingLevelStats>;
  linkVariant?: ResourceBuildingLinkVariant;
  maxLevel?: number;
  name: string;
  onAction?: (action: ResourceBuildingModalAction) => void;
  onCancelConstruction?: () => void;
  onClose?: () => void;
  onUpgrade?: () => void;
  notice?: BuildingModalNotice;
  requirementLabel: string;
  resourceIcon: string;
  resourceLabel: string;
  stock: ResourceBuildingStock;
  stockNow: number;
  tagline: string;
  upgradeDisabled?: boolean;
  upgradeDisabledLabel?: string;
  upgradeTime: string;
}

export interface ResourceBuildingPhoneFrameProps {
  children: ReactNode;
  buildingIcon: string;
}

const resourceIcons = {
  crowns: '/assets/casual-icons/crown.png',
  iron: '/assets/resources/iron.png',
  stone: '/assets/resources/stone.png',
  wood: '/assets/resources/wood.png',
};

const defaultLabels: ResourceBuildingLabels = {
  actionCancelConstruction: 'Annuler la construction',
  actionClose: 'Fermer',
  actionMaxLevel: 'Niveau max.',
  actionUpgrade: 'Améliorer',
  currentLevel: 'Niveau actuel',
  economyLoop: 'Boucle Éco',
  maxLevelReached: 'Niveau maximal atteint',
  nextLevel: 'Après amélioration',
  requirementLabel: 'Pré-requis',
  sectionHousing: 'Logement',
  sectionCapacity: 'Capacité',
  sectionProduction: 'Production',
  sectionStorage: 'Entrepôt',
  subtitle: 'Bâtiment économique',
  upgradeLabel: 'Améliorer',
};

function fr(value: number) {
  return Math.floor(value).toLocaleString('fr-FR');
}

function statFor(levelStats: Record<number, ResourceBuildingLevelStats>, level: number) {
  return levelStats[level] ?? { production: 0, storage: 0 };
}

function replaceAlpha(rgba: string, alpha: string) {
  return rgba.replace(/[\d.]+\)$/, `${alpha})`);
}

function ProductionCard({
  accent,
  icon,
  isPopulation,
  label,
  level,
  resourceLabel,
  stats,
  tone,
}: {
  accent: ResourceBuildingAccent;
  icon: string;
  isPopulation: boolean;
  label: string;
  level: number;
  resourceLabel: string;
  stats: ResourceBuildingLevelStats;
  tone: 'current' | 'next';
}) {
  const isNext = tone === 'next';
  const cardBg = isNext
    ? `linear-gradient(to bottom, ${replaceAlpha(accent.haloTint, '.28')} 0%, rgba(255,255,255,.55) 100%)`
    : 'linear-gradient(to bottom, rgba(255,255,255,.6) 0%, rgba(244,228,193,.55) 100%)';

  return (
    <div
      className="relative rounded-[14px] border-2 px-3 pb-[11px] pt-2.5"
      style={{
        background: cardBg,
        borderColor: isNext ? accent.border : 'rgba(60,38,25,.28)',
        boxShadow: isNext
          ? `inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 rgba(0,0,0,.12), 0 0 14px ${accent.haloTint}`
          : 'inset 0 1px 0 rgba(255,255,255,.55), 0 2px 0 rgba(0,0,0,.10)',
      }}
    >
      <div className="mb-[7px] flex items-center justify-between">
        <span
          className="font-game text-[9px] font-extrabold uppercase tracking-[.24em]"
          style={{ color: isNext ? accent.border : '#6d5838' }}
        >
          {label}
        </span>
        <span
          className="inline-flex items-center rounded-full border-[1.5px] px-[7px] py-[1.5px] font-game text-[9.5px] font-extrabold tracking-[.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]"
          style={{
            background: isNext ? `linear-gradient(to bottom, ${accent.light}, ${accent.dark})` : 'linear-gradient(to bottom, #b6a78a, #8b7355)',
            borderColor: isNext ? accent.border : '#5d4a32',
          }}
        >
          NIV. {level}
        </span>
      </div>

      <div className="mb-[7px] flex items-baseline gap-1.5">
        <img alt="" className="size-[22px] self-center drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]" src={publicAsset(icon)} />
        <span className="font-game text-2xl font-black leading-none tracking-[.01em] text-[#3d2f1f] tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.6)]">
          {isPopulation ? fr(stats.production) : `+${fr(stats.production)}`}
        </span>
        <span className="font-game text-[11px] font-bold tracking-[.08em] text-[#6d5838]">
          {isPopulation ? resourceLabel : '/ heure'}
        </span>
      </div>

    </div>
  );
}

function LevelLink({
  accent,
  delta,
  isPopulation,
  resourceLabel,
  variant,
}: {
  accent: ResourceBuildingAccent;
  delta: number;
  isPopulation: boolean;
  resourceLabel: string;
  variant: ResourceBuildingLinkVariant;
}) {
  if (variant === 'none') return <div className="h-1.5" />;

  if (variant === 'chevron') {
    return (
      <div className="my-0.5 flex items-center justify-center">
        <svg className="drop-shadow-[0_1px_0_rgba(255,255,255,.55)]" fill="none" height="14" viewBox="0 0 22 14" width="22">
          <path d="M3 3 L11 11 L19 3" fill="none" stroke="rgba(60,38,25,.55)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      </div>
    );
  }

  if (variant === 'arrow-pill') {
    return (
      <div className="relative z-[2] -my-[9px] flex justify-center">
        <span
          className="inline-flex size-6 items-center justify-center rounded-full border-2 font-game text-[15px] font-black leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(0,0,0,.18)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]"
          style={{
            background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
            borderColor: accent.border,
          }}
        >
          ↓
        </span>
      </div>
    );
  }

  if (variant === 'rule') {
    return (
      <div className="mx-1 my-1 flex items-center gap-2">
        <span className="h-px flex-1 bg-[rgba(60,38,25,.28)]" />
        <span className="inline-flex items-center gap-[3px] font-game text-[10px] font-extrabold tracking-[.06em] tabular-nums" style={{ color: accent.border }}>
          <span className="text-[11px] leading-none">▾</span>+{fr(delta)} {isPopulation ? resourceLabel : '/ h'}
        </span>
        <span className="h-px flex-1 bg-[rgba(60,38,25,.28)]" />
      </div>
    );
  }

  return (
    <div className="relative my-px ml-[22px] flex h-[18px] items-center justify-start gap-2.5">
      <svg fill="none" height="18" viewBox="0 0 14 18" width="14">
        <path d="M7 0 L7 12" stroke="rgba(60,38,25,.55)" strokeLinecap="round" strokeWidth="2" />
        <path d="M3 10 L7 14 L11 10" fill="none" stroke="rgba(60,38,25,.6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
      <span className="font-game text-[9.5px] font-extrabold uppercase tracking-[.22em] text-[#6d5838]">amélioration</span>
    </div>
  );
}

function StorageGauge({
  accent,
  current,
  isPopulation,
  labels,
  stockNow,
}: {
  accent: ResourceBuildingAccent;
  current: ResourceBuildingLevelStats;
  isPopulation: boolean;
  labels: ResourceBuildingLabels;
  stockNow: number;
}) {
  const pctNow = current.storage > 0 ? Math.min(100, Math.round((stockNow / current.storage) * 100)) : 0;

  return (
    <div className="flex flex-col gap-[7px] rounded-xl border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 pb-[11px] pt-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="font-game text-[9px] font-extrabold uppercase tracking-[.24em] text-[#6d5838]">
          {isPopulation ? labels.sectionHousing : labels.sectionStorage}
        </span>
        <span className="font-game text-[13px] font-extrabold text-[#3d2f1f] tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
          {fr(stockNow)}
          <span className="text-[#6d5838]"> / {fr(current.storage)}</span>
        </span>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full border-[1.5px] border-[rgba(60,38,25,.32)] bg-[rgba(60,38,25,.18)] shadow-[inset_0_1px_2px_rgba(0,0,0,.22)]">
        <div
          className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45),inset_0_-2px_4px_rgba(0,0,0,.18)] transition-[width] duration-700 ease-out"
          style={{
            background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
            width: `${pctNow}%`,
          }}
        />
      </div>
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mx-3.5 mb-2 mt-3 flex items-center gap-2">
      <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
      <span className="font-game text-[9px] font-extrabold uppercase tracking-[.28em] text-[#6d5838]">{label}</span>
      <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
    </div>
  );
}

function CostChip({
  current,
  icon,
  value,
}: {
  current: number;
  icon: string;
  value: number;
}) {
  const ok = current >= value;

  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1 rounded-full border-[1.5px] py-0 pl-1 pr-[7px] font-game text-[10.5px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]',
        ok
          ? 'border-[rgba(0,0,0,.3)] bg-[rgba(0,0,0,.22)]'
          : 'border-[#a93226] bg-[linear-gradient(to_bottom,rgba(192,57,43,.45),rgba(192,57,43,.7))] text-[#ffe2dc] shadow-[inset_0_0_8px_rgba(192,57,43,.4)]',
      )}
    >
      <img alt="" className="size-3.5 drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]" src={publicAsset(icon)} />
      {fr(value)}
    </span>
  );
}

function CostStrip({
  cost,
  label,
  stock,
  time,
}: {
  cost: ResourceBuildingCost;
  label: string;
  stock: ResourceBuildingStock;
  time: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.96),rgba(78,56,34,.96))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_2px_0_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase tracking-[.18em] text-[#f0e0c0]">{label}</span>
        <span className="inline-flex items-center gap-1 font-game text-[9px] font-bold tracking-[.14em] text-[#cdb88a]">
          <img alt="" className="size-[11px]" src={publicAsset('/assets/clock.png')} />
          {time}
        </span>
      </div>
      <div className="flex flex-wrap gap-[5px]">
        <CostChip current={stock.wood} icon={resourceIcons.wood} value={cost.wood} />
        <CostChip current={stock.stone} icon={resourceIcons.stone} value={cost.stone} />
        <CostChip current={stock.iron} icon={resourceIcons.iron} value={cost.iron} />
        <CostChip current={stock.crowns} icon={resourceIcons.crowns} value={cost.crowns} />
      </div>
    </div>
  );
}

export function ResourceBuildingModal({
  accent,
  buildingIcon,
  closeLabel,
  construction,
  cost,
  eyebrow,
  error,
  footerHint,
  isPopulation = false,
  labels: labelsProp,
  level,
  levelStats,
  linkVariant = 'chevron',
  maxLevel = 5,
  name,
  onAction,
  onCancelConstruction,
  onClose,
  onUpgrade,
  notice,
  requirementLabel,
  resourceIcon,
  resourceLabel,
  stock,
  stockNow,
  tagline,
  upgradeDisabled = false,
  upgradeDisabledLabel,
  upgradeTime,
}: ResourceBuildingModalProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const next = Math.min(level + 1, maxLevel);
  const isMaxed = next === level;
  const currentStats = statFor(levelStats, level);
  const nextStats = statFor(levelStats, next);
  const delta = nextStats.production - currentStats.production;
  const canPay = stock.wood >= cost.wood && stock.stone >= cost.stone && stock.iron >= cost.iron && stock.crowns >= cost.crowns;
  const canUpgrade = canPay && !upgradeDisabled;

  const showCostStrip = !construction;
  const actions: BuildingModalAction[] = [
    { id: 'close', label: labels.actionClose, tone: 'neutral' },
    construction
      ? {
          disabled: construction.cancelDisabled,
          id: 'cancel-construction',
          label: construction.cancelLabel ?? labels.actionCancelConstruction,
          tone: 'danger',
        }
      : {
          disabled: isMaxed || !canUpgrade,
          id: 'upgrade',
          label: isMaxed ? labels.actionMaxLevel : (upgradeDisabledLabel ?? labels.actionUpgrade),
          tone: isMaxed ? 'warning' : 'success',
        },
  ];
  const handleAction = (action: BuildingModalAction) => {
    if (action.id === 'close') {
      onAction?.({ id: 'close', label: labels.actionClose, tone: 'neutral' });
      onClose?.();
      return;
    }
    if (action.id === 'cancel-construction') {
      if (!construction || construction.cancelDisabled) return;
      const label = construction.cancelLabel ?? labels.actionCancelConstruction;
      onAction?.({ id: 'cancel-construction', label, tone: 'danger' });
      onCancelConstruction?.();
      return;
    }
    if (action.id === 'upgrade') {
      if (isMaxed || !canUpgrade) return;
      onAction?.({ id: 'upgrade', label: labels.actionUpgrade, tone: 'success' });
      onUpgrade?.();
    }
  };

  return (
    <BuildingModal
      accent={accent}
      buildingIcon={buildingIcon}
      closeLabel={closeLabel ?? labels.actionClose}
      eyebrow={eyebrow}
      actions={actions}
      footerContent={showCostStrip ? <CostStrip cost={cost} label={`${labels.upgradeLabel} · Niv. ${level} → ${next}`} stock={stock} time={upgradeTime} /> : null}
      footerClassName="px-3.5 pb-3 pt-2.5"
      footerHint={footerHint}
      labels={{ close: labels.actionClose, subtitle: labels.subtitle }}
      level={level}
      name={name}
      construction={construction?.state}
      notice={notice}
      onAction={handleAction}
      summaryBadges={[{ icon: resourceIcon, label: resourceLabel }]}
      summaryLabel={labels.economyLoop}
      tagline={tagline}
    >
      <SectionRule label={isPopulation ? labels.sectionCapacity : labels.sectionProduction} />
      <div className="relative mx-3.5 flex flex-col gap-1">
        <ProductionCard accent={accent} icon={resourceIcon} isPopulation={isPopulation} label={labels.currentLevel} level={level} resourceLabel={resourceLabel} stats={currentStats} tone="current" />
        {isMaxed ? (
          <div className="mb-0.5 mt-1.5 self-center font-game text-[10px] font-extrabold uppercase tracking-[.2em] text-[#6d5838]">{labels.maxLevelReached}</div>
        ) : (
          <>
            <LevelLink accent={accent} delta={delta} isPopulation={isPopulation} resourceLabel={resourceLabel} variant={linkVariant} />
            <ProductionCard accent={accent} icon={resourceIcon} isPopulation={isPopulation} label={labels.nextLevel} level={next} resourceLabel={resourceLabel} stats={nextStats} tone="next" />
          </>
        )}
      </div>

      <SectionRule label={isPopulation ? labels.sectionHousing : labels.sectionStorage} />
      <div className="mx-3.5 mb-3">
        <StorageGauge accent={accent} current={currentStats} isPopulation={isPopulation} labels={labels} stockNow={stockNow} />
      </div>

      <div className="sr-only">
        {labels.requirementLabel}: {requirementLabel}
      </div>
      {error ? (
        <div className="mx-3.5 mb-3 rounded-lg border-2 border-[#a93226] bg-[rgba(231,76,60,.1)] px-3 py-2 text-center font-game text-[11px] font-bold text-[#a93226]">
          {error}
        </div>
      ) : null}
    </BuildingModal>
  );
}

export function ResourceBuildingPhoneFrame({ buildingIcon, children }: ResourceBuildingPhoneFrameProps) {
  return (
    <div className="relative h-[720px] w-[360px] overflow-hidden rounded-[36px] border-8 border-[#0c0c1a] bg-[#1a1a2e] shadow-[0_30px_60px_rgba(0,0,0,.6),inset_0_0_0_2px_#2a2a45]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#7c9756_0%,#a8b977_28%,#cdbf8e_60%,#b89968_100%)]">
        <div className="absolute inset-x-0 top-0 h-[62px] border-b-2 border-[#8b7355] bg-[linear-gradient(to_bottom,rgba(60,38,25,.94),rgba(78,56,34,.94))]" />
        <img alt="" className="absolute left-[60px] top-[200px] w-[140px] opacity-[.72]" src={publicAsset('/assets/castle.png')} />
        <img alt="" className="absolute left-[180px] top-[360px] w-[130px] opacity-[.8]" src={publicAsset(buildingIcon)} />
        <img alt="" className="absolute left-[30px] top-[470px] w-[110px] opacity-[.7]" src={publicAsset('/assets/warehouse.png')} />
        <div className="absolute inset-x-0 bottom-0 h-16 border-t-2 border-[#8b7355] bg-[linear-gradient(to_top,rgba(60,38,25,.95),rgba(78,56,34,.9))]" />
        <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] backdrop-blur-[2px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-2.5">{children}</div>
    </div>
  );
}
