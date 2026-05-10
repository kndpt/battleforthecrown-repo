import { useState } from 'react';
import { Hammer, Lock, X } from 'lucide-react';
import { Button, InputHelperText, Modal, ModalBody, Spinner } from '@/ui';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  useBuildingQueueQuery,
  useUpgradeBuildingMutation,
  useCancelConstructionMutation,
  usePopulationQuery,
  useVillageBuildingsQuery,
  useWorldConfigQuery,
} from '@/api/queries';
import { ApiError } from '@/api';
import type { BuildingDto } from '@/api';
import { useDisplayResources } from '@/features/resources/useDisplayResources';
import { useGameStore } from '@/stores/game';
import {
  BUILDING_DEFINITIONS,
  MAX_CONSTRUCTION_QUEUE,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';
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
  const [error, setError] = useState<string | null>(null);

  const isUnderConstruction = progress.inProgress;
  const nextLevel = building.level + 1;
  const nextCost = BUILDING_DEFINITIONS[building.type as BuildingType]?.levels[nextLevel] ?? null;

  const { display: displayResources } = useDisplayResources(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const availablePopulation = populationQuery.data
    ? Math.max(0, populationQuery.data.max - populationQuery.data.used)
    : 0;

  const worldId = useGameStore((state) => state.worldId);
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const worldConfigQuery = useWorldConfigQuery(worldId);
  const { data: buildingQueue = [] } = useBuildingQueueQuery(villageId);
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
