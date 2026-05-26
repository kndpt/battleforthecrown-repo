import type { BuildingDto } from '@/api';
import type { DisplayResources } from '@/lib/interpolation';
import {
  ResourceBuildingModal,
  type ResourceBuildingAccent,
  type ResourceBuildingKey,
  type ResourceBuildingLevelStats,
} from '@/features/design-system/components';
import { formatRemaining } from './constructionProgress';
import type { getBuildingLockState } from './buildingLockState';
import { getResourceBuildingKey } from './resourceBuildingKey';
import {
  MAX_CONSTRUCTION_QUEUE,
  type BuildingLevelDefinition,
} from '@battleforthecrown/shared/village/buildings';
import {
  BASE_VILLAGE_STRATEGY_BONUS,
  DEFAULT_VILLAGE_STRATEGY,
  getQuarterPopulationLimit,
} from '@battleforthecrown/shared/village';
import { RESOURCE_PRODUCTION_PER_HOUR } from '@battleforthecrown/shared/resources';

interface ResourceBuildingDetailModalProps {
  building: BuildingDto;
  canAfford: boolean;
  cancelPending: boolean;
  crownsBalance: number | null;
  displayResources: DisplayResources | null;
  effectiveTimeMs: number | null;
  error: string | null;
  isMaxLevel: boolean;
  isQueueFull: boolean;
  lockState: ReturnType<typeof getBuildingLockState>;
  name: string;
  nextCost: BuildingLevelDefinition | null;
  onCancelConstruction: () => void;
  onClose: () => void;
  onUpgrade: () => void;
  population: { max: number; used: number } | undefined;
  progress: { inProgress: boolean; percent: number; remainingMs: number };
  queueLength: number;
  upgradePending: boolean;
}

const RESOURCE_BUILDING_ACCENTS: Record<ResourceBuildingKey, ResourceBuildingAccent> = {
  quarter: { border: '#9e7b0d', dark: '#d4a017', haloTint: 'rgba(241,196,15,.4)', light: '#f1c40f' },
  iron: { border: '#1f5288', dark: '#2e75b6', haloTint: 'rgba(91,155,213,.38)', light: '#5b9bd5' },
  stone: { border: '#5d6d6e', dark: '#7f8c8d', haloTint: 'rgba(176,184,192,.35)', light: '#b0b8c0' },
  wood: { border: '#2d6b16', dark: '#3a8a1f', haloTint: 'rgba(126,199,78,.35)', light: '#7ec74e' },
};

const RESOURCE_BUILDING_META: Record<ResourceBuildingKey, {
  eyebrow: string;
  icon: string;
  isPopulation?: boolean;
  label: string;
  tagline: string;
}> = {
  quarter: {
    eyebrow: 'Logement · Population',
    icon: '/assets/resources/population.png',
    isPopulation: true,
    label: 'villageois',
    tagline: '« Sans pain, point de soldats. »',
  },
  iron: {
    eyebrow: 'Production · Fer',
    icon: '/assets/resources/iron.png',
    label: 'fer',
    tagline: '« De la roche au fer, du fer à la lame. »',
  },
  stone: {
    eyebrow: 'Production · Pierre',
    icon: '/assets/resources/stone.png',
    label: 'pierre',
    tagline: '« Pierre par pierre, le royaume tient debout. »',
  },
  wood: {
    eyebrow: 'Production · Bois',
    icon: '/assets/resources/wood.png',
    label: 'bois',
    tagline: '« Que les forêts bruissent sous nos haches. »',
  },
};

const POPULATION_BONUS_MULTIPLIERS = Array.from(
  new Set([
    BASE_VILLAGE_STRATEGY_BONUS.populationBonus,
    ...Object.values(DEFAULT_VILLAGE_STRATEGY.strategies).map(
      (strategy) => strategy.bonuses.populationBonus ?? BASE_VILLAGE_STRATEGY_BONUS.populationBonus,
    ),
  ]),
);

function getEffectiveQuarterPopulationLimit(level: number, multiplier: number): number {
  return Math.floor(getQuarterPopulationLimit(level) * multiplier);
}

function inferPopulationCapacityMultiplier(
  currentLevel: number,
  currentPopulationMax: number | null,
): number {
  if (currentPopulationMax === null) return BASE_VILLAGE_STRATEGY_BONUS.populationBonus;

  const baseLimit = getQuarterPopulationLimit(Math.max(1, currentLevel));
  if (baseLimit <= 0) return BASE_VILLAGE_STRATEGY_BONUS.populationBonus;

  const knownMultiplier = POPULATION_BONUS_MULTIPLIERS.find(
    (multiplier) => getEffectiveQuarterPopulationLimit(currentLevel, multiplier) === currentPopulationMax,
  );
  if (knownMultiplier !== undefined) return knownMultiplier;

  return currentPopulationMax / baseLimit;
}

function getResourceBuildingLevelStats(
  key: ResourceBuildingKey,
  maxLevel: number,
  maxPerType: number,
  currentLevel: number,
  currentPopulationMax: number | null,
  currentPopulationUsed: number | null,
): Record<number, ResourceBuildingLevelStats> {
  const populationCapacityMultiplier = key === 'quarter'
    ? inferPopulationCapacityMultiplier(currentLevel, currentPopulationMax)
    : BASE_VILLAGE_STRATEGY_BONUS.populationBonus;
  const currentPopulationLimit = getEffectiveQuarterPopulationLimit(currentLevel, populationCapacityMultiplier);
  const currentPopulationAvailable =
    currentPopulationMax !== null && currentPopulationUsed !== null
      ? Math.max(0, currentPopulationMax - currentPopulationUsed)
      : currentPopulationLimit;

  return Object.fromEntries(
    Array.from({ length: maxLevel }, (_, index) => {
      const level = index + 1;
      if (key === 'quarter') {
        const populationLimit = getEffectiveQuarterPopulationLimit(level, populationCapacityMultiplier);
        const populationGainFromCurrentLevel = populationLimit - currentPopulationLimit;
        return [
          level,
          {
            production: Math.max(0, currentPopulationAvailable + populationGainFromCurrentLevel),
            storage: populationLimit,
          },
        ];
      }

      return [
        level,
        {
          production: RESOURCE_PRODUCTION_PER_HOUR[level] ?? 0,
          storage: maxPerType,
        },
      ];
    }),
  );
}

function getResourceBuildingStockNow(
  key: ResourceBuildingKey,
  displayResources: DisplayResources | null,
  population: { max: number; used: number } | undefined,
): number {
  if (key === 'quarter') return population ? Math.max(0, population.max - population.used) : 0;
  return displayResources?.[key] ?? 0;
}

function getUpgradeDisabledLabel({
  canAfford,
  isLockedByCastle,
  isPending,
  isQueueFull,
  requiredCastleLevel,
}: {
  canAfford: boolean;
  isLockedByCastle: boolean;
  isPending: boolean;
  isQueueFull: boolean;
  requiredCastleLevel: number | null;
}): string | undefined {
  if (isLockedByCastle) return `Château niv. ${requiredCastleLevel} requis`;
  if (isPending) return 'Amélioration...';
  if (isQueueFull) return 'File pleine';
  if (!canAfford) return 'Ressources insuff.';
  return undefined;
}

export function ResourceBuildingDetailModal({
  building,
  canAfford,
  cancelPending,
  crownsBalance,
  displayResources,
  effectiveTimeMs,
  error,
  isMaxLevel,
  isQueueFull,
  lockState,
  name,
  nextCost,
  onCancelConstruction,
  onClose,
  onUpgrade,
  population,
  progress,
  queueLength,
  upgradePending,
}: ResourceBuildingDetailModalProps) {
  const resourceKey = getResourceBuildingKey(building.type);
  if (!resourceKey) return null;

  const resourceMeta = RESOURCE_BUILDING_META[resourceKey];
  const resourceMaxLevel = building.maxLevel;
  const isLockedByCastle = lockState.state === 'unbuilt-locked' && lockState.requiredCastleLevel !== null;
  const storageMax = resourceKey === 'quarter'
    ? (population?.max ?? getQuarterPopulationLimit(Math.max(1, building.level)))
    : (displayResources?.maxPerType ?? 0);
  const upgradeDisabledLabel = getUpgradeDisabledLabel({
    canAfford,
    isLockedByCastle,
    isPending: upgradePending,
    isQueueFull,
    requiredCastleLevel: lockState.requiredCastleLevel,
  });

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        <ResourceBuildingModal
          accent={RESOURCE_BUILDING_ACCENTS[resourceKey]}
          buildingIcon={`/assets/${resourceKey}.png`}
          closeLabel="Fermer"
          construction={
            progress.inProgress
              ? {
                  cancelDisabled: cancelPending,
                  cancelLabel: cancelPending ? 'Annulation...' : 'Annuler la construction',
                  state: {
                    progressPercent: progress.percent,
                    remainingLabel: `${formatRemaining(progress.remainingMs)} restant`,
                  },
                }
              : undefined
          }
          cost={{
            crowns: 0,
            iron: nextCost?.iron ?? 0,
            stone: nextCost?.stone ?? 0,
            wood: nextCost?.wood ?? 0,
          }}
          error={error}
          eyebrow={resourceMeta.eyebrow}
          footerHint={
            isQueueFull && !progress.inProgress
              ? `File pleine (${queueLength}/${MAX_CONSTRUCTION_QUEUE})`
              : undefined
          }
          isPopulation={resourceMeta.isPopulation}
          labels={resourceKey === 'quarter' ? { sectionCapacity: 'Villageois disponibles' } : undefined}
          level={building.level}
          levelStats={getResourceBuildingLevelStats(
            resourceKey,
            resourceMaxLevel,
            storageMax,
            building.level,
            population?.max ?? null,
            population?.used ?? null,
          )}
          linkVariant="rule"
          maxLevel={resourceMaxLevel}
          name={name}
          notice={
            isLockedByCastle
              ? {
                  body: `Niveau actuel du Château : ${lockState.castleLevel}`,
                  title: `Château niv. ${lockState.requiredCastleLevel} requis`,
                  tone: 'warning',
                }
              : undefined
          }
          onCancelConstruction={onCancelConstruction}
          onClose={onClose}
          onUpgrade={onUpgrade}
          requirementLabel={`Château niv. ${lockState.requiredCastleLevel ?? 1}`}
          resourceIcon={resourceMeta.icon}
          resourceLabel={resourceMeta.label}
          stock={{
            crowns: crownsBalance ?? 0,
            iron: displayResources?.iron ?? 0,
            stone: displayResources?.stone ?? 0,
            wood: displayResources?.wood ?? 0,
          }}
          stockNow={getResourceBuildingStockNow(resourceKey, displayResources, population)}
          tagline={resourceMeta.tagline}
          upgradeDisabled={
            isLockedByCastle ||
            progress.inProgress ||
            isMaxLevel ||
            isQueueFull ||
            !canAfford ||
            upgradePending
          }
          upgradeDisabledLabel={upgradeDisabledLabel}
          upgradeTime={effectiveTimeMs !== null ? formatRemaining(effectiveTimeMs) : '—'}
        />
      </div>
    </div>
  );
}
