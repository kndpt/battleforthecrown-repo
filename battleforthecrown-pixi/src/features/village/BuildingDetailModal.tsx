import { useState, type ReactNode } from 'react';
import { Crown, Hammer, Lock, X } from 'lucide-react';
import { Button, InputHelperText, Modal, ModalBody, ResourceIcon, Spinner } from '@/ui';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  useArmyInventoryQuery,
  useArmyTrainingQuery,
  useBuildingQueueQuery,
  useUpgradeBuildingMutation,
  useCancelConstructionMutation,
  usePopulationQuery,
  useRecruitNobleMutation,
  useVillageBuildingsQuery,
  useWorldConfigQuery,
} from '@/api/queries';
import { ApiError } from '@/api';
import type { BuildingDto } from '@/api';
import { useDisplayCrowns, useDisplayResources } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  BUILDING_DEFINITIONS,
  MAX_CONSTRUCTION_QUEUE,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { calculateBuildingCost } from '@battleforthecrown/shared/logic';
import { BuildingHeader } from './BuildingDetailModal/BuildingHeader';
import { ConstructionProgress } from './BuildingDetailModal/ConstructionProgress';
import { CostSection } from './BuildingDetailModal/CostSection';
import { BonusSection } from './BuildingDetailModal/BonusSection';
import { BuildingUnlockPreview } from './BuildingDetailModal/BuildingUnlockPreview';
import { getBuildingLockState } from './buildingLockState';

interface BuildingDetailModalProps {
  villageId: string;
  building: BuildingDto;
  onClose: () => void;
}

export function BuildingDetailModal({ villageId, building, onClose }: BuildingDetailModalProps) {
  const meta = metaFor(building.type);
  const now = useTickingNow(1_000);
  const progress = computeConstructionProgress(
    { startTime: building.startTime, endTime: building.endTime },
    now,
  );
  const upgrade = useUpgradeBuildingMutation();
  const cancel = useCancelConstructionMutation();
  const recruitNoble = useRecruitNobleMutation();
  const [error, setError] = useState<string | null>(null);

  const isUnderConstruction = progress.inProgress;
  const nextLevel = building.level + 1;
  const nextCost = BUILDING_DEFINITIONS[building.type as BuildingType]?.levels[nextLevel] ?? null;

  const { display: displayResources } = useDisplayResources(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const availablePopulation = populationQuery.data
    ? Math.max(0, populationQuery.data.max - populationQuery.data.used)
    : 0;

  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  const { balance: crownsBalance } = useDisplayCrowns(userId, worldId);
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const worldConfigQuery = useWorldConfigQuery(worldId);
  const { data: buildingQueue = [] } = useBuildingQueueQuery(villageId);
  const armyInventory = useArmyInventoryQuery(villageId);
  const armyTraining = useArmyTrainingQuery(villageId);
  const isQueueFull = buildingQueue.length >= MAX_CONSTRUCTION_QUEUE;

  const castleLevel =
    building.type === 'CASTLE'
      ? building.level
      : (buildingsQuery.data?.find((b) => b.type === 'CASTLE')?.level ?? 1);
  const lockState = getBuildingLockState(building, castleLevel);
  const isMaxLevel = lockState.state === 'max';
  const isUnbuiltLocked = lockState.state === 'unbuilt-locked';
  const constructionMultiplier =
    worldConfigQuery.data?.gameSpeed.construction;

  const effectiveTimeMs =
    nextCost && constructionMultiplier !== undefined
      ? calculateBuildingCost(
          building.type,
          nextLevel,
          castleLevel,
          constructionMultiplier,
        ).time
      : null;

  const canAfford =
    nextCost !== null &&
    (displayResources?.wood ?? 0) >= nextCost.wood &&
    (displayResources?.stone ?? 0) >= nextCost.stone &&
    (displayResources?.iron ?? 0) >= nextCost.iron &&
    availablePopulation >= nextCost.population;

  const nobleCost = UNIT_COSTS[UNIT_TYPES.NOBLE];
  const nobleInGarrison =
    armyInventory.data?.find((unit) => unit.type === UNIT_TYPES.NOBLE)?.quantity ?? 0;
  const nobleInTraining = armyTraining.data?.some(
    (training) => training.unitType === UNIT_TYPES.NOBLE,
  ) ?? false;
  const nobleTimeMs = Math.round(
    (nobleCost.time / (worldConfigQuery.data?.gameSpeed.training ?? 1)) * 1000,
  );
  const canAffordNoble =
    building.type === 'THRONE_HALL' &&
    building.level > 0 &&
    !isUnderConstruction &&
    !nobleInGarrison &&
    !nobleInTraining &&
    Boolean(displayResources) &&
    crownsBalance !== null &&
    (displayResources?.wood ?? 0) >= nobleCost.wood &&
    (displayResources?.stone ?? 0) >= nobleCost.stone &&
    (displayResources?.iron ?? 0) >= nobleCost.iron &&
    crownsBalance >= (nobleCost.crowns ?? 0) &&
    availablePopulation >= nobleCost.population;

  const handleUpgrade = () => {
    if (isUnbuiltLocked) return;
    setError(null);
    upgrade.mutate(
      { villageId, buildingType: building.type },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'amélioration");
        },
      },
    );
  };

  const handleCancel = () => {
    setError(null);
    cancel.mutate(
      { villageId, buildingId: building.id },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'annulation");
        },
      },
    );
  };

  const handleRecruitNoble = () => {
    setError(null);
    recruitNoble.mutate(
      { villageId },
      {
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : 'Échec du recrutement du Noble');
        },
      },
    );
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" variant="default">
      <ModalBody className="!p-0 relative flex flex-col overflow-hidden h-[90vh] max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-white" />
        </button>

        <BuildingHeader
          iconPath={meta.iconPath}
          emoji={meta.emoji}
          buildingName={meta.label}
          buildingDescription={meta.description}
          level={building.level}
          isMaxLevel={isMaxLevel}
          isUnbuilt={building.level === 0}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isUnderConstruction && (
            <ConstructionProgress
              progress={progress.percent}
              remainingMs={progress.remainingMs}
            />
          )}

          {isUnbuiltLocked && lockState.requiredCastleLevel !== null && (
            <div className="p-4 bg-stone-200/70 border-2 border-stone-400 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock size={22} className="mt-0.5 text-stone-700" />
                <div>
                  <p className="font-cinzel font-bold text-stone-900">
                    Château niv. {lockState.requiredCastleLevel} requis
                  </p>
                  <p className="text-sm text-stone-700">
                    Niveau actuel du Château : {lockState.castleLevel}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isUnderConstruction && !isMaxLevel && !isUnbuiltLocked && nextCost && (
            <CostSection
              cost={nextCost}
              resources={{
                wood: displayResources?.wood ?? 0,
                stone: displayResources?.stone ?? 0,
                iron: displayResources?.iron ?? 0,
              }}
              availablePopulation={availablePopulation}
              nextLevel={nextLevel}
            />
          )}

          {!isMaxLevel && (
            <BonusSection buildingType={building.type} currentLevel={building.level} />
          )}

          {building.type === 'CASTLE' && !isMaxLevel && (
            <BuildingUnlockPreview nextCastleLevel={nextLevel} />
          )}

          {building.type === 'THRONE_HALL' && building.level > 0 && !isUnderConstruction && (
            <div className="space-y-3 rounded-lg border-2 border-game-gold-border/40 bg-game-gold-light/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-kingdom-900">
                    Recrutement du Noble
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-kingdom-700">
                    Un seul Noble peut être disponible ou en formation par village.
                  </p>
                </div>
                <span className="text-2xl" aria-hidden>👑</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <NobleCostCell
                  label="Bois"
                  required={nobleCost.wood}
                  current={displayResources?.wood ?? 0}
                  icon={<ResourceIcon resource="wood" size={22} />}
                />
                <NobleCostCell
                  label="Pierre"
                  required={nobleCost.stone}
                  current={displayResources?.stone ?? 0}
                  icon={<ResourceIcon resource="stone" size={22} />}
                />
                <NobleCostCell
                  label="Fer"
                  required={nobleCost.iron}
                  current={displayResources?.iron ?? 0}
                  icon={<ResourceIcon resource="iron" size={22} />}
                />
                <NobleCostCell
                  label="Couronnes"
                  required={nobleCost.crowns ?? 0}
                  current={crownsBalance ?? 0}
                  icon={<Crown size={20} />}
                />
                <NobleCostCell
                  label="Pop."
                  required={nobleCost.population}
                  current={availablePopulation}
                  icon={<span className="text-xl leading-none">👥</span>}
                />
              </div>

              <Button
                variant={canAffordNoble ? 'warning' : 'neutral'}
                size="md"
                className="w-full font-bold"
                disabled={!canAffordNoble || recruitNoble.isPending}
                onClick={handleRecruitNoble}
              >
                {recruitNoble.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <span>Recrutement...</span>
                  </div>
                ) : nobleInTraining ? (
                  'Noble déjà en formation'
                ) : nobleInGarrison ? (
                  'Noble déjà disponible'
                ) : canAffordNoble ? (
                  'Recruter le Noble'
                ) : (
                  'Prérequis insuffisants'
                )}
              </Button>
              <p className="text-center text-xs text-kingdom-600 font-game">
                Temps de recrutement : <span className="font-bold">{formatRemaining(nobleTimeMs)}</span>
              </p>
            </div>
          )}

          {isMaxLevel && (
            <div className="p-4 bg-game-green-light/10 border-2 border-game-green-border rounded-lg text-center">
              <p className="font-bold text-game-green-dark mb-2 text-lg">🏆 Niveau Maximum</p>
              <p className="text-sm text-kingdom-600">
                Ce bâtiment a atteint son développement maximal.
              </p>
            </div>
          )}

          {error && (
            <div role="alert">
              <InputHelperText variant="error">{error}</InputHelperText>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-kingdom-200 bg-gradient-to-b from-kingdom-50 to-kingdom-100 flex-shrink-0">
          {isUnderConstruction ? (
            <Button
              variant="danger"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled={cancel.isPending}
              onClick={handleCancel}
            >
              {cancel.isPending ? (
                <Spinner size="sm" />
              ) : (
                <div className="flex flex-col items-center justify-center leading-tight">
                  <span className="text-base font-semibold">Annuler la construction</span>
                  <span className="text-xs mt-0.5 opacity-90">
                    {formatRemaining(progress.remainingMs)} restant
                  </span>
                </div>
              )}
            </Button>
          ) : isMaxLevel ? (
            <Button
              variant="neutral"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled
            >
              Niveau Maximum
            </Button>
          ) : isUnbuiltLocked && lockState.requiredCastleLevel !== null ? (
            <Button
              variant="neutral"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled
            >
              <div className="flex items-center justify-center gap-2">
                <Lock size={20} />
                <span>Château niv. {lockState.requiredCastleLevel} requis</span>
              </div>
            </Button>
          ) : (
            <>
              <Button
                variant="success"
                size="lg"
                className="w-full font-bold shadow-clay-lg !py-1"
                disabled={upgrade.isPending || !canAfford || isQueueFull}
                onClick={handleUpgrade}
              >
                {upgrade.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Hammer size={20} className="animate-bounce" />
                    <span>Amélioration en cours...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <div className="flex items-center justify-center gap-1">
                      <Hammer size={20} />
                      <span className="text-lg font-semibold">
                        Améliorer → Niv. {building.level + 1}
                      </span>
                    </div>
                  </div>
                )}
              </Button>
              {isQueueFull ? (
                <p className="text-center text-xs text-game-red-dark font-game mt-2">
                  🚧 File pleine ({buildingQueue.length}/{MAX_CONSTRUCTION_QUEUE}) — annule un chantier en cours pour démarrer celui-ci.
                </p>
              ) : (
                effectiveTimeMs !== null && (
                  <p className="text-center text-xs text-kingdom-600 font-game mt-2">
                    ⏱ Temps de construction :{' '}
                    <span className="font-bold">
                      {formatRemaining(effectiveTimeMs)}
                    </span>
                  </p>
                )
              )}
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

interface NobleCostCellProps {
  current: number;
  icon: ReactNode;
  label: string;
  required: number;
}

function NobleCostCell({ current, icon, label, required }: NobleCostCellProps) {
  const canAfford = current >= required;
  return (
    <div
      className={`rounded-lg border p-2 text-center ${
        canAfford
          ? 'border-game-green-border bg-game-green-light/10 text-game-green-dark'
          : 'border-game-red-border bg-game-red-light/10 text-game-red-dark'
      }`}
    >
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="text-[10px] font-game text-kingdom-600">{label}</p>
      <p className="text-xs font-bold tabular-nums">{required.toLocaleString()}</p>
      <p className="text-[10px] text-kingdom-700 tabular-nums">
        / {Math.floor(current).toLocaleString()}
      </p>
    </div>
  );
}
