import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  useArmyInventoryQuery,
  useArmyTrainingQuery,
  useBuildingQueueQuery,
  useCancelTrainingMutation,
  useUpgradeBuildingMutation,
  queryKeys,
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
import { TempoService } from '@battleforthecrown/shared/world';
import { getBuildingLockState } from './buildingLockState';
import { computeUnitTrainingProgress } from '@/features/army/trainingProgress';
import { ResourceBuildingDetailModal } from './ResourceBuildingDetailModal';
import { getResourceBuildingKey } from './resourceBuildingKey';
import { SpecializedBuildingDetailModal } from './SpecializedBuildingDetailModal';

interface BuildingDetailModalProps {
  villageId: string;
  building: BuildingDto;
  onClose: () => void;
}

export function BuildingDetailModal({ villageId, building: initialBuilding, onClose }: BuildingDetailModalProps) {
  const upgrade = useUpgradeBuildingMutation();
  const cancel = useCancelConstructionMutation();
  const cancelTraining = useCancelTrainingMutation();
  const recruitNoble = useRecruitNobleMutation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const building =
    buildingsQuery.data?.find((b) => b.id === initialBuilding.id) ?? initialBuilding;

  const meta = metaFor(building.type);
  const now = useTickingNow(1_000);
  const progress = computeConstructionProgress(
    { startTime: building.startTime, endTime: building.endTime },
    now,
  );

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
  const worldTempo = worldConfigQuery.data?.tempo;

  const effectiveTimeMs =
    nextCost && worldTempo
      ? Math.round(
          TempoService.applyDuration(
            calculateBuildingCost(building.type, nextLevel, castleLevel, 1)
              .time,
            worldTempo,
            'constructionSpeed',
          ),
        )
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
  const nobleTraining = armyTraining.data?.find(
    (training) => training.unitType === UNIT_TYPES.NOBLE,
  );
  const nobleInTraining = Boolean(nobleTraining);
  const nobleTimeMs = Math.round(
    TempoService.applyDuration(
      nobleCost.time * 1000,
      worldTempo ?? { global: 1 },
      'lordTrainingSpeed',
    ),
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

  useEffect(() => {
    if (!nobleTraining) return;
    const trainingProgress = computeUnitTrainingProgress(nobleTraining, now);
    if (
      trainingProgress.totalRemainingMs === 0 &&
      nobleTraining.completedQty < nobleTraining.totalQty
    ) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyTraining(villageId),
      });
    }
  }, [nobleTraining, now, queryClient, villageId]);

  const handleUpgrade = () => {
    if (isUnbuiltLocked) return;
    setError(null);
    upgrade.mutate(
      { villageId, buildingType: building.type },
      {
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

  const handleCancelNobleTraining = () => {
    if (!nobleTraining) return;
    setError(null);
    cancelTraining.mutate(
      { villageId, trainingId: nobleTraining.id },
      {
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'annulation");
        },
      },
    );
  };

  if (getResourceBuildingKey(building.type)) {
    return (
      <ResourceBuildingDetailModal
        building={building}
        canAfford={canAfford}
        cancelPending={cancel.isPending}
        crownsBalance={crownsBalance}
        displayResources={displayResources}
        effectiveTimeMs={effectiveTimeMs}
        error={error}
        isMaxLevel={isMaxLevel}
        isQueueFull={isQueueFull}
        lockState={lockState}
        name={meta.label}
        nextCost={nextCost}
        onCancelConstruction={handleCancel}
        onClose={onClose}
        onUpgrade={handleUpgrade}
        population={populationQuery.data}
        progress={progress}
        queueLength={buildingQueue.length}
        upgradePending={upgrade.isPending}
      />
    );
  }

  return (
    <SpecializedBuildingDetailModal
      availablePopulation={availablePopulation}
      building={building}
      canAfford={canAfford}
      canAffordNoble={canAffordNoble}
      cancelConstructionPending={cancel.isPending}
      cancelTrainingPending={cancelTraining.isPending}
      crownsBalance={crownsBalance}
      displayResources={displayResources}
      effectiveTimeMs={effectiveTimeMs}
      error={error}
      isMaxLevel={isMaxLevel}
      isQueueFull={isQueueFull}
      lockState={lockState}
      meta={meta}
      nextCost={nextCost}
      nobleInGarrison={Boolean(nobleInGarrison)}
      nobleTimeMs={nobleTimeMs}
      nobleTraining={nobleTraining}
      now={now}
      onCancelConstruction={handleCancel}
      onCancelNobleTraining={handleCancelNobleTraining}
      onClose={onClose}
      onRecruitNoble={handleRecruitNoble}
      onUpgrade={handleUpgrade}
      progress={progress}
      queueLength={buildingQueue.length}
      recruitNoblePending={recruitNoble.isPending}
      upgradePending={upgrade.isPending}
    />
  );
}
