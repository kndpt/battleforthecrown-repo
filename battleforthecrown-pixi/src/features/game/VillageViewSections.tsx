import type { BuildingDto, QueueEntryDto } from '@/api';
import { getBuildingLockState } from '@/features/village/buildingLockState';
import { metaFor } from '@/features/village/buildingMeta';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';
import type { DisplayResources } from '@/lib/interpolation';
import { MAX_CONSTRUCTION_QUEUE } from '@battleforthecrown/shared/village/buildings';
import {
  villageBuildingCategories,
  type VillageBuildingCategoryDef,
  type VillageBuildingCategoryKey,
} from './VillageViewData';
import {
  canAffordNextBuildingLevel,
  computeQueueProgress,
  computeResourceRatios,
  formatCompactNumber,
  formatQueueTime,
} from './VillageViewSectionHelpers';

export type VillageResourceType = 'iron' | 'stone' | 'wood';

const RESOURCE_BUTTONS = [
  {
    ariaLabel: 'Ouvrir le camp de bûcherons',
    fillClass: 'bg-[linear-gradient(90deg,#7a5a32,#b08040)]',
    icon: '/assets/resources/wood.png',
    key: 'wood',
    label: 'Bois',
  },
  {
    ariaLabel: 'Ouvrir la carrière de pierre',
    fillClass: 'bg-[linear-gradient(90deg,#7a7a7a,#a0a0a0)]',
    icon: '/assets/resources/stone.png',
    key: 'stone',
    label: 'Pierre',
  },
  {
    ariaLabel: 'Ouvrir la mine de fer',
    fillClass: 'bg-[linear-gradient(90deg,#4a6070,#6a90a8)]',
    icon: '/assets/resources/iron.png',
    key: 'iron',
    label: 'Fer',
  },
] satisfies {
  ariaLabel: string;
  fillClass: string;
  icon: string;
  key: VillageResourceType;
  label: string;
}[];

function CategoryHeader({ category, count }: { category: VillageBuildingCategoryDef; count: number }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span
        className="inline-block size-2.5 shrink-0 rounded-[2px]"
        style={{
          background: `linear-gradient(to bottom, ${category.gemLight}, ${category.gemDark})`,
          border: `1px solid ${category.gemBorder}`,
          transform: 'rotate(45deg)',
        }}
      />
      <span className="text-[12px] font-bold uppercase tracking-[.16em] text-[#f0e0c0] [text-shadow:0_1px_2px_rgba(0,0,0,.7)]">
        {category.label}
      </span>
      <span
        className="rounded-full border px-2 py-[2px] text-[10px] font-bold"
        style={{
          borderColor: category.countBorder,
          background: category.countBg,
          color: category.countText,
        }}
      >
        {count}
      </span>
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(to right, ${category.dividerColor}, transparent)` }}
      />
    </div>
  );
}

interface BuildingCardProps {
  availablePopulation?: number;
  building: BuildingDto;
  castleLevel: number;
  now: number;
  onSelect: (building: BuildingDto) => void;
  queueEntry?: QueueEntryDto;
  resources: DisplayResources | null;
}

function BuildingCard({
  availablePopulation,
  building,
  castleLevel,
  now,
  onSelect,
  queueEntry,
  resources,
}: BuildingCardProps) {
  const meta = metaFor(building.type);
  const lockState = getBuildingLockState(building, castleLevel);
  const isLocked = lockState.state === 'unbuilt-locked';
  const isInProgress = lockState.state === 'in-progress';
  const isMax = lockState.state === 'max';
  const isNew = lockState.state === 'unbuilt-available';
  const canAffordNextLevel = canAffordNextBuildingLevel(
    building,
    resources,
    availablePopulation,
  );

  let timeRemaining = 0;
  let progress = 0;
  if (isInProgress && queueEntry) {
    const queueProgress = computeQueueProgress(queueEntry, now);
    timeRemaining = queueProgress.timeRemaining;
    progress = queueProgress.progress;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(building)}
      className={cn(
        'flex w-[136px] shrink-0 flex-col overflow-hidden rounded-[13px] border-2 bg-[linear-gradient(180deg,#3d2a16,#2a1c0e)] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_3px_0_rgba(0,0,0,.4)]',
        isInProgress ? 'border-[#5d4a32] ring-2 ring-[rgba(246,213,123,.5)]' : 'border-[#5d4a32]',
        isLocked && 'opacity-60',
      )}
    >
      <div className="relative flex h-[88px] flex-1 items-center justify-center border-b border-[rgba(93,74,50,.4)] bg-[linear-gradient(180deg,rgba(255,255,255,.06),transparent)]">
        {meta.iconPath ? (
          <img
            src={meta.iconPath}
            alt={meta.label}
            className={cn(
              'size-[68px] object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]',
              isLocked && '[filter:grayscale(.6)]',
            )}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={cn('text-5xl', isLocked && 'grayscale opacity-60')}>{meta.emoji}</span>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={publicAsset('/assets/lock.png')}
              alt=""
              className="size-8 opacity-90"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        {isNew && (
          <span className="absolute left-1.5 top-1.5 rounded border border-[#1458a0] bg-gradient-to-b from-[#5db8e0] to-[#2480b8] px-1.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[.08em] text-white">
            NOUVEAU
          </span>
        )}

        {isInProgress && (
          <div className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full border border-[#f6d57b] bg-[#9e7b0d]">
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#f6d57b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 2" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-2 pb-1 pt-1.5 text-center">
        <div className={cn('text-[12px] font-bold leading-tight', isLocked ? 'text-[#6d5838]' : 'text-[#f0e0c0]')}>
          {meta.label}
        </div>
        <div className="mt-1 text-[10.5px] text-[#9e7b0d]">
          {building.level === 0
            ? isLocked
              ? 'Bloqué'
              : 'Disponible'
            : isInProgress
              ? `Niv. ${building.level} → ${building.level + 1}`
              : `Niv. ${building.level}`}
        </div>
      </div>

      {isInProgress ? (
        <>
          <div className="mx-2 mb-1 rounded-[8px] border border-[rgba(158,123,13,.6)] bg-[linear-gradient(180deg,rgba(158,123,13,.7),rgba(100,75,8,.7))] py-1 text-center text-[11px] text-[#f6d57b] shadow-[inset_0_1px_0_rgba(255,255,255,.15)]">
            {formatQueueTime(timeRemaining)}
          </div>
          <div className="mx-2 mb-2 h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,.4)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#6ebf49,#4a8c2a)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : isMax ? (
        <div className="mx-2 mb-2 rounded-[8px] border border-[rgba(166,124,82,.3)] bg-[rgba(93,74,50,.1)] py-1.5 text-center text-[11px] text-[#6d5838]">
          Max
        </div>
      ) : isLocked ? (
        <div className="mx-2 mb-2 rounded-[8px] border border-[rgba(93,74,50,.4)] bg-[rgba(93,74,50,.18)] py-1.5 text-center text-[10.5px] text-[#6d5838]">
          {lockState.requiredCastleLevel ? `Requis: Niv.${lockState.requiredCastleLevel}` : 'Verrouillé'}
        </div>
      ) : (
        <div
          className={cn(
            'mx-2 mb-2 rounded-[8px] border py-1.5 text-center text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_1px_0_rgba(0,0,0,.25)]',
            canAffordNextLevel
              ? 'border-[#3a6c1f] bg-[linear-gradient(180deg,#5a8a30,#3a6020)] text-white'
              : 'border-[rgba(166,124,82,.32)] bg-[rgba(93,74,50,.16)] text-[#8b6f47]',
          )}
        >
          {canAffordNextLevel ? (isNew ? 'Construire' : 'Améliorer') : 'Manque ressources'}
        </div>
      )}
    </button>
  );
}

export interface VillageResourcesBarProps {
  animationKey: string;
  hasSnapshot: boolean;
  onSelectResource: (resource: VillageResourceType) => void;
  resources: DisplayResources | null;
}

export function VillageResourcesBar({
  animationKey,
  hasSnapshot,
  onSelectResource,
  resources,
}: VillageResourcesBarProps) {
  const ratios = computeResourceRatios(resources);

  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(246,213,123,.16)] bg-[linear-gradient(180deg,rgba(44,26,10,.76),rgba(31,19,9,.68))] shadow-[0_10px_22px_rgba(0,0,0,.24)] backdrop-blur-md backdrop-saturate-150">
      <div className="grid grid-cols-3 divide-x divide-[rgba(166,124,82,.28)]">
        {RESOURCE_BUTTONS.map((resource) => (
          <button
            key={resource.key}
            type="button"
            onClick={() => onSelectResource(resource.key)}
            className="min-w-0 bg-[linear-gradient(180deg,rgba(254,249,240,.055),rgba(235,217,175,.025))] px-3 py-2.5 text-left transition-colors hover:bg-[rgba(246,213,123,.06)] active:bg-[rgba(246,213,123,.09)]"
            aria-label={resource.ariaLabel}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <img
                src={publicAsset(resource.icon)}
                alt=""
                className="size-[17px] shrink-0 object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[.1em] text-[#9a7a5a]">
                {resource.label}
              </span>
              <span
                key={`${animationKey}-${resource.key}-value`}
                className="village-resource-value-enter ml-auto shrink-0 tabular-nums text-[14px] font-bold text-[#f0e0c0]"
              >
                {hasSnapshot && resources
                  ? formatCompactNumber(Math.floor(resources[resource.key]))
                  : '…'}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(93,74,50,.34)]">
              <div
                key={`${animationKey}-${resource.key}-fill`}
                className={cn('village-resource-fill-enter h-full origin-left', resource.fillClass)}
                style={{ width: `${ratios[resource.key]}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export interface VillageConstructionQueueStripProps {
  buildings: BuildingDto[];
  isCancelPending: boolean;
  now: number;
  onCancel: (buildingId: string) => void;
  onOpenQueue: () => void;
  queue: QueueEntryDto[];
}

export function VillageConstructionQueueStrip({
  buildings,
  isCancelPending,
  now,
  onCancel,
  onOpenQueue,
  queue,
}: VillageConstructionQueueStripProps) {
  if (queue.length === 0) return null;

  return (
    <div className="border-b border-[rgba(93,74,50,.38)] bg-[rgba(18,10,4,.75)] px-3 py-2.5">
      <button
        type="button"
        onClick={onOpenQueue}
        className="mb-2 flex w-full items-center text-left"
        aria-label="Ouvrir la file de construction"
      >
        <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#9e7b0d]">
          File de chantier
        </span>
        <span className="ml-auto rounded-full border border-[rgba(158,123,13,.4)] bg-[rgba(158,123,13,.12)] px-2 py-[2px] text-[10px] text-[#d4b87a]">
          {queue.length} / {MAX_CONSTRUCTION_QUEUE}
        </span>
      </button>

      <div className="flex gap-2">
        {Array.from({ length: MAX_CONSTRUCTION_QUEUE }).map((_, index) => {
          const queueEntry = queue[index];
          if (!queueEntry) {
            return (
              <button
                key={`idle-${index}`}
                type="button"
                onClick={onOpenQueue}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-[rgba(93,74,50,.22)] bg-[rgba(0,0,0,.07)] py-3"
                aria-label="Slot de construction libre"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3a2b18"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[8.5px] uppercase tracking-wider text-[#3a2b18]">
                  Libre
                </span>
              </button>
            );
          }

          const { progress, timeRemaining } = computeQueueProgress(queueEntry, now);
          const building = buildings.find((b) => b.id === queueEntry.id);
          const meta = metaFor(queueEntry.type);
          const currentLevel = building?.level ?? queueEntry.level - 1;

          return (
            <div
              key={queueEntry.id}
              className="flex flex-1 flex-col overflow-hidden rounded-[10px] border border-[rgba(110,191,73,.42)] bg-[linear-gradient(180deg,rgba(28,48,14,.65),rgba(14,26,7,.55))] shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
            >
              <button
                type="button"
                onClick={onOpenQueue}
                className="flex min-w-0 items-center gap-1.5 px-2 pb-1 pt-2 text-left"
                aria-label={`Ouvrir la construction ${meta.label}`}
              >
                {meta.iconPath ? (
                  <img
                    src={meta.iconPath}
                    alt=""
                    className="size-6 shrink-0 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="shrink-0 text-sm">{meta.emoji}</span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-bold leading-tight text-[#f0e0c0]">
                      {meta.label} → {currentLevel + 1}
                    </span>
                  <span className="block tabular-nums text-[9.5px] leading-tight text-[#6ebf49]">
                    {formatQueueTime(timeRemaining)}
                  </span>
                </span>
              </button>
              <div className="mx-2 mb-2 flex items-center gap-1.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(0,0,0,.4)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#6ebf49,#4a8c2a)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onCancel(queueEntry.id)}
                  disabled={isCancelPending}
                  aria-label="Annuler la construction"
                  className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-[rgba(200,60,50,.5)] bg-[rgba(180,40,30,.85)] disabled:opacity-50"
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="2" y1="2" x2="8" y2="8" />
                    <line x1="8" y1="2" x2="2" y2="8" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface VillageBuildingCatalogProps {
  availablePopulation?: number;
  buildings: BuildingDto[];
  builtCount: number;
  byCategory: Record<VillageBuildingCategoryKey, BuildingDto[]>;
  castleLevel: number;
  lockedBuildings: BuildingDto[];
  now: number;
  onSelectBuilding: (building: BuildingDto) => void;
  queueByBuildingId: ReadonlyMap<string, QueueEntryDto>;
  resources: DisplayResources | null;
}

export function VillageBuildingCatalog({
  availablePopulation,
  buildings,
  builtCount,
  byCategory,
  castleLevel,
  lockedBuildings,
  now,
  onSelectBuilding,
  queueByBuildingId,
  resources,
}: VillageBuildingCatalogProps) {
  return (
    <div className="px-3 pb-2 pt-3.5">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[13px] uppercase tracking-[.1em] text-[#cdb88a]">
          Bâtiments
        </span>
        <span className="text-[12px] text-[#6d5838]">
          {builtCount} / {buildings.length} construits
        </span>
      </div>

      {villageBuildingCategories.map((category) => {
        const categoryBuildings = byCategory[category.key];
        if (categoryBuildings.length === 0) return null;
        return (
          <div key={category.key} className="mb-2">
            <CategoryHeader category={category} count={categoryBuildings.length} />
            <div className="bftc-noscroll flex gap-2.5 overflow-x-auto pb-5">
              {categoryBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  availablePopulation={availablePopulation}
                  building={building}
                  castleLevel={castleLevel}
                  queueEntry={queueByBuildingId.get(building.id)}
                  now={now}
                  onSelect={onSelectBuilding}
                  resources={resources}
                />
              ))}
            </div>
          </div>
        );
      })}

      {lockedBuildings.length > 0 && (
        <div className="mb-2">
          <div className="mb-2.5 flex items-center gap-2.5">
            <span
              className="inline-block size-2.5 shrink-0 rounded-[2px] border border-[#5d6d6e] bg-gradient-to-b from-[#95a5a6] to-[#7f8c8d]"
              style={{ transform: 'rotate(45deg)' }}
            />
            <span className="text-[12px] font-bold uppercase tracking-[.16em] text-[#7f8c8d]">
              Verrouillés
            </span>
            <span className="rounded-full border border-[rgba(93,109,110,.4)] bg-[rgba(127,140,141,.08)] px-2 py-[2px] text-[10px] font-bold text-[#7f8c8d]">
              {lockedBuildings.length}
            </span>
            <span className="h-px flex-1 bg-[linear-gradient(to_right,rgba(93,109,110,.4),transparent)]" />
          </div>
          <div className="bftc-noscroll flex gap-2.5 overflow-x-auto pb-3">
            {lockedBuildings.map((building) => (
              <BuildingCard
                key={building.id}
                availablePopulation={availablePopulation}
                building={building}
                castleLevel={castleLevel}
                now={now}
                onSelect={onSelectBuilding}
                resources={resources}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
