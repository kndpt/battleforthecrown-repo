import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api';
import {
  queryKeys,
  useArmyInventoryQuery,
  useArmyTrainingQuery,
  useCancelTrainingMutation,
  useGarrisonQuery,
  useOnboardingSummaryQuery,
  usePopulationQuery,
  useRecallReinforcementMutation,
  useTrainUnitsMutation,
  useVillageBuildingsQuery,
  useWorldConfigQuery,
} from '@/api/queries';
import type { ArmyTrainingDto, ArmyUnitDto } from '@/api/queries';
import { BottomSheet, Button, Panel, Spinner } from '@/ui';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { useOnboardingCompletionAck } from '@/features/onboarding/onboardingCompletion';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import {
  ArmyContentDesign,
  ArmyRecruitPopup,
  BaseModal,
  BftcButton,
  computeArmyRecruitMax,
  GameBottomSheetPanel,
  type ArmyQueueItem,
  type ArmyRecruitPopupLabels,
  type ArmyTroop,
  type ArmyVillageRow,
} from '@/features/design-system/components';
import { useDisplayResources } from '@/features/resources/useDisplayResources';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import { ONBOARDING_TRAIN_TROOPS_TARGET } from '@battleforthecrown/shared/onboarding';
import type { GarrisonLine } from '@/lib/types';
import { publicAsset } from '@/lib/publicAsset';
import { useTickingNow } from '@/lib/useTickingNow';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useUiStore } from '@/stores/ui';
import { UnitDetailModal } from './UnitDetailModal';
import { unitMetaFor } from './unitConfig';
import {
  buildArmyRecruitQuickValues,
  buildArmyViewModel,
  findArmyUnitByTroopId,
  type ArmyFilterId,
} from './armyViewModel';
import { useGarrisonSelection } from './useGarrisonSelection';

type ArmyRuntimeTab = 'barracks' | 'army';

const recruitLabels: ArmyRecruitPopupLabels = {
  cancel: 'Annuler',
  max: 'Max',
  population: 'Population',
  recruit: 'Entraîner',
  resourceIron: 'Fer',
  resourceStone: 'Pierre',
  resourceWood: 'Bois',
};

const EMPTY_GARRISON_LINES: GarrisonLine[] = [];
const ARMY_RUNTIME_TABS = [
  { id: 'barracks', label: 'Caserne' },
  { id: 'army', label: 'Armée' },
] as const;

function NoBarracksScreen() {
  return (
    <div className="flex h-full items-center justify-center p-4 pb-24">
      <Panel variant="stone" padding="lg" className="text-center max-w-md shadow-2xl">
        <Lock className="h-16 w-16 text-white mx-auto mb-4" />
        <h2 className="font-cinzel text-2xl font-bold text-white mb-3">
          Caserne non construite
        </h2>
        <p className="text-white/90 mb-6 leading-relaxed">
          Vous devez construire la caserne avant de pouvoir gérer votre armée.
        </p>
        <Link to="/game">
          <Button variant="success" size="lg" className="w-full">
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft size={20} />
              <span>Retour au village</span>
            </div>
          </Button>
        </Link>
      </Panel>
    </div>
  );
}

function toDetailUnit(troop: ArmyTroop, units: ArmyUnitDto[]): ArmyUnitDto {
  return findArmyUnitByTroopId(units, troop.id) ?? {
    id: `virtual-${troop.id}`,
    populationCost: troop.pop,
    quantity:
      troop.inVillage + (troop.fromAllies ?? 0) + (troop.supportingElsewhere ?? 0),
    type: troop.id,
  };
}

function GarrisonActions({
  isPending,
  lines,
  onRecall,
  pendingRecallKey,
}: {
  isPending: boolean;
  lines: GarrisonLine[];
  onRecall: (line: GarrisonLine) => void;
  pendingRecallKey: string | null;
}) {
  return (
    <div className="space-y-2.5 px-3 pb-3 pt-2">
      {lines.map((line) => {
        const meta = unitMetaFor(line.unitType);
        const recallKey = `${line.villageId}:${line.originVillageId}:${line.unitType}`;
        const pending = isPending && pendingRecallKey === recallKey;
        const incoming = line.direction === 'INCOMING';
        const placeName = incoming
          ? line.originVillageName ?? `Village ${line.originVillageId}`
          : line.hostVillageName ?? `Village ${line.villageId}`;
        const playerName = incoming ? line.originPlayerName : line.hostPlayerName;

        return (
          <div
            className="flex items-center gap-2 rounded-[13px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,.43))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_2px_0_rgba(0,0,0,.14)]"
            key={`${line.direction}-${recallKey}`}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,#f5e6d3,#d4c094)] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_1px_2px_rgba(0,0,0,.22)]">
              {meta.iconPath ? (
                <img
                  alt=""
                  className="size-9 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]"
                  src={publicAsset(meta.iconPath)}
                />
              ) : (
                <span aria-hidden className="text-2xl leading-none">
                  {meta.emoji}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-game text-[14px] font-extrabold text-[#3d2f1f]">
                  {meta.name}
                </p>
                <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#3a6c1f] bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)] px-1.5 font-game text-[10px] font-extrabold tabular-nums text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.35)]">
                  {line.quantity}
                </span>
              </div>
              <p className="mt-1 truncate font-game text-[10px] font-bold uppercase tracking-[.08em] text-[#4b5563]">
                {placeName}
              </p>
              {playerName ? (
                <p className="mt-0.5 truncate font-game text-[10px] font-semibold text-[#6d5838]">
                  {playerName}
                </p>
              ) : null}
            </div>
            <PositionMapButton label={`Voir ${placeName} sur la carte`} />
            <button
              className="min-w-[82px] shrink-0 rounded-[12px] border-2 border-[#9e7b0d] bg-[linear-gradient(180deg,#f6d57b,#d4a017)] px-3 py-2.5 font-game text-[12px] font-extrabold text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_2px_0_rgba(0,0,0,.2)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              onClick={() => onRecall(line)}
              type="button"
            >
              {pending ? (incoming ? 'Renvoi...' : 'Rappel...') : incoming ? 'Renvoyer' : 'Rappeler'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TrainingCancelDialog({
  isPending,
  onClose,
  onConfirm,
  training,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  training: ArmyTrainingDto;
}) {
  const meta = unitMetaFor(training.unitType);
  const remainingQuantity = Math.max(0, training.totalQty - training.completedQty);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={() => {
        if (!isPending) onClose();
      }}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        <BaseModal
          bodyClassName="flex flex-col gap-3"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <BftcButton
                className="justify-center"
                disabled={isPending}
                onClick={onClose}
                size="md"
                variant="neutral"
              >
                Annuler
              </BftcButton>
              <BftcButton
                className="justify-center"
                disabled={isPending}
                onClick={onConfirm}
                size="md"
                variant="danger"
              >
                {isPending ? 'Annulation...' : 'Confirmer'}
              </BftcButton>
            </div>
          }
          maxHeight="min(90dvh, 520px)"
          onClose={isPending ? undefined : onClose}
          title="Annuler la formation"
          tone="red"
          width={340}
        >
          <div className="flex items-center gap-3 rounded-[14px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,.43))] px-3 py-2.5">
            {meta.iconPath ? (
              <img
                alt=""
                className="size-12 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]"
                src={publicAsset(meta.iconPath)}
              />
            ) : (
              <span aria-hidden className="text-3xl leading-none">
                {meta.emoji}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-game text-[15px] font-extrabold text-[#3d2f1f]">
                {meta.name}
              </p>
              <p className="mt-1 font-game text-[11px] font-bold uppercase tracking-[.08em] text-[#6d5838]">
                ×{remainingQuantity} en formation
              </p>
            </div>
          </div>
          <p className="font-game text-[13px] font-semibold leading-relaxed text-[#3d2f1f]">
            Confirmer rembourse les ressources et la population réservées pour cette formation.
          </p>
        </BaseModal>
      </div>
    </div>
  );
}

function PositionMapButton({ label }: { label: string }) {
  return (
    <button
      aria-label={label}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,.55))] p-0 shadow-[inset_0_1px_0_rgba(255,255,255,.42),0_1px_0_rgba(0,0,0,.12)]"
      title="Voir sur la carte (à venir)"
      type="button"
    >
      <img alt="" className="size-6 object-contain" src={publicAsset('/assets/position.png')} />
    </button>
  );
}

function GarrisonSheetTitle({
  subtitle,
  title,
}: {
  subtitle?: string | null;
  title?: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate">{title}</div>
      {subtitle ? (
        <div className="mt-1 truncate font-game text-[10px] font-bold uppercase tracking-[.08em] text-[#6d5838]">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function ArmyScreen() {
  const navigate = useNavigate();
  const worldId = useGameStore((state) => state.worldId);
  const villageId = useGameStore((state) => state.villageId);
  const buildings = useVillageBuildingsQuery(villageId);
  const inventory = useArmyInventoryQuery(villageId);
  const training = useArmyTrainingQuery(villageId);
  const garrisonQuery = useGarrisonQuery(villageId);
  const population = usePopulationQuery(villageId);
  const worldConfig = useWorldConfigQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const queryClient = useQueryClient();
  const prevTrainingRef = useRef<{ len: number; completedTotal: number } | null>(null);

  // Mirror the WS unit.trained cascade when the poll detects units added or a batch removed (WS-drop fallback).
  useEffect(() => {
    const len = training.data?.length ?? 0;
    const completedTotal = training.data?.reduce((sum, t) => sum + t.completedQty, 0) ?? 0;
    const prev = prevTrainingRef.current;
    if (
      prev !== null &&
      (prev.len > 0 || prev.completedTotal > 0) &&
      (len < prev.len || completedTotal > prev.completedTotal)
    ) {
      const userId = useAuthStore.getState().user?.id ?? null;
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.villagePower(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kingdomPowerPrefix(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.retentionSummary(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingSummary(userId, worldId) });
    }
    prevTrainingRef.current = { len, completedTotal };
  }, [training.data, queryClient, villageId, worldId]);

  const cancelTraining = useCancelTrainingMutation();
  const recallReinforcement = useRecallReinforcementMutation();
  const train = useTrainUnitsMutation();
  const pushToast = useUiStore((state) => state.pushToast);
  const nowMs = useTickingNow(1_000);
  const { display } = useDisplayResources(villageId);

  const [activeFilterId, setActiveFilterId] = useState<ArmyFilterId>('mine');
  const [activeRuntimeTab, setActiveRuntimeTab] = useState<ArmyRuntimeTab>('barracks');
  const [draggedTroopId, setDraggedTroopId] = useState<string | null>(null);
  const [recruitTroopId, setRecruitTroopId] = useState<string | null>(null);
  const [recruitValue, setRecruitValue] = useState(1);
  const [cancelTrainingId, setCancelTrainingId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ArmyUnitDto | null>(null);

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const barracksLevel = barracks?.level ?? 0;

  const units = inventory.data ?? [];
  const trainings = training.data ?? [];
  const garrisonLines = garrisonQuery.data ?? EMPTY_GARRISON_LINES;
  const onboardingCompletion = useOnboardingCompletionAck(worldId, villageId);
  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data, {
    completionAcknowledged: onboardingCompletion.acknowledged,
  });

  const armyModel = useMemo(
    () =>
      buildArmyViewModel({
        activeFilterId,
        barracksLevel,
        garrisonLines,
        nowMs,
        population: population.data,
        resources: display,
        trainings,
        units,
        worldTempo: worldConfig.data?.tempo,
      }),
    [
      activeFilterId,
      barracksLevel,
      display,
      garrisonLines,
      nowMs,
      population.data,
      trainings,
      units,
      worldConfig.data?.tempo,
    ],
  );

  const garrison = useGarrisonSelection(garrisonLines, armyModel.troops);

  const recruitTroop = recruitTroopId
    ? armyModel.troops.find((troop) => troop.id === recruitTroopId) ?? null
    : null;
  const isOnboardingTrainStep =
    onboardingSummary.data?.currentStep === 'TRAIN_TROOPS';
  const militiaInVillage =
    units.find((unit) => unit.type === UNIT_TYPES.MILITIA)?.quantity ?? 0;
  const militiaInQueue = trainings
    .filter((entry) => entry.unitType === UNIT_TYPES.MILITIA)
    .reduce((sum, entry) => sum + Math.max(0, entry.totalQty - entry.completedQty), 0);
  // Militia still needed to reach the onboarding target, counting what's already
  // in the village + queue — so cancelling a partial batch recomputes the gate
  // (e.g. 1 already formed → the modal now requires 4, not 5).
  const militiaRemaining = Math.max(
    0,
    ONBOARDING_TRAIN_TROOPS_TARGET - militiaInVillage - militiaInQueue,
  );
  const isOnboardingMilitiaRecruit =
    isOnboardingTrainStep &&
    recruitTroop?.id === UNIT_TYPES.MILITIA &&
    militiaRemaining > 0;
  // Drag hint stays until the player has any militia formed or queued.
  const showOnboardingDragHint =
    isOnboardingTrainStep &&
    activeRuntimeTab === 'barracks' &&
    !recruitTroop &&
    militiaInVillage === 0 &&
    militiaInQueue === 0;
  const rawRecruitMax = recruitTroop
    ? computeArmyRecruitMax(recruitTroop, armyModel.stock)
    : 0;
  // Onboarding "exactly enough": cap to the remaining count and require exactly it.
  const recruitMax = isOnboardingMilitiaRecruit
    ? Math.min(rawRecruitMax, militiaRemaining)
    : rawRecruitMax;
  const recruitRequiredValue = isOnboardingMilitiaRecruit
    ? militiaRemaining
    : undefined;
  const boundedRecruitValue = recruitMax <= 0
    ? 0
    : Math.max(1, Math.min(recruitMax, recruitValue));
  const selectedCancelTraining = cancelTrainingId
    ? trainings.find((candidate) => candidate.id === cancelTrainingId) ?? null
    : null;
  const pendingRecallKey = recallReinforcement.variables
    ? `${recallReinforcement.variables.villageId}:${recallReinforcement.variables.originVillageId}:${Object.keys(recallReinforcement.variables.units)[0]}`
    : null;
  const pendingCancelTrainingId = cancelTraining.isPending
    ? cancelTraining.variables?.trainingId ?? null
    : null;

  if (buildings.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (barracksLevel === 0) {
    return <NoBarracksScreen />;
  }

  const runArmyAction = (actionId: GameActionId) => {
    runGameAction(actionId, { navigate });
  };

  const handleDropTroop = (troopId: string) => {
    const troop = armyModel.troops.find((candidate) => candidate.id === troopId);
    setDraggedTroopId(null);
    if (!troop?.unlocked) return;
    setRecruitTroopId(troop.id);
    setRecruitValue(1);
  };

  const handleRecruit = (quantity: number) => {
    if (!villageId || !recruitTroop || quantity <= 0 || train.isPending) return;
    if (isOnboardingMilitiaRecruit && quantity !== militiaRemaining) return;
    train.mutate(
      { villageId, unitType: recruitTroop.id, quantity },
      {
        onError: (err) => {
          pushToast({
            description:
              err instanceof ApiError ? err.message : "Échec de l'entraînement",
            title: 'Entraînement impossible',
            tone: 'error',
            ttlMs: 4000,
          });
        },
        onSuccess: () => {
          setRecruitTroopId(null);
          setRecruitValue(1);
        },
      },
    );
  };

  const handleCancelQueueItem = (item: ArmyQueueItem) => {
    if (cancelTraining.isPending) return;
    setCancelTrainingId(item.id);
  };

  const handleConfirmCancelTraining = () => {
    if (!villageId || !selectedCancelTraining || cancelTraining.isPending) return;
    cancelTraining.mutate(
      { villageId, trainingId: selectedCancelTraining.id },
      {
        onError: (err) => {
          pushToast({
            description:
              err instanceof ApiError ? err.message : "Échec de l'annulation",
            title: 'Annulation impossible',
            tone: 'error',
            ttlMs: 4000,
          });
        },
        onSuccess: () => {
          setCancelTrainingId(null);
        },
      },
    );
  };

  const handleTroopSelect = (troop: ArmyTroop) => {
    garrison.clear();
    if (activeRuntimeTab === 'barracks') {
      setSelectedUnit(toDetailUnit(troop, units));
      return;
    }
    const hasGarrisonActions =
      (troop.fromAllies ?? 0) > 0 || (troop.supportingElsewhere ?? 0) > 0;
    if (hasGarrisonActions) {
      garrison.selectTroop(troop.id);
      return;
    }
    setSelectedUnit(toDetailUnit(troop, units));
  };

  const handleVillageRowIconSelect = (row: ArmyVillageRow) => {
    const troop = armyModel.troops.find((candidate) => candidate.id === row.id);
    if (!troop) return;
    garrison.clear();
    setSelectedUnit(toDetailUnit(troop, units));
  };

  const handleRecallLine = (line: GarrisonLine) => {
    recallReinforcement.mutate({
      originVillageId: line.originVillageId,
      units: { [line.unitType]: line.quantity },
      villageId: line.villageId,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
      <div
        className={
          activeRuntimeTab === 'barracks'
            ? 'pb-[var(--bftc-bottom-nav-height,88px)] flex min-h-0 flex-1 flex-col overflow-hidden bg-[#3c2619]'
            : 'pb-[var(--bftc-bottom-nav-height,88px)] flex min-h-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)]'
        }
      >
        <OnboardingGuidance
          guidance={onboardingGuidance}
          isLoading={
            onboardingSummary.isLoading ||
            inventory.isLoading ||
            training.isLoading ||
            garrisonQuery.isLoading
          }
          onAcknowledge={onboardingCompletion.acknowledge}
          onAction={runArmyAction}
          onNavigate={navigate}
        />
        {inventory.isLoading ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
            <Spinner variant="warning" size="lg" />
            <p className="text-kingdom-700 font-game text-sm">
              Chargement des troupes...
            </p>
          </div>
        ) : (
          <ArmyContentDesign
            activeFilterId={armyModel.activeFilterId}
            activeTabId={activeRuntimeTab}
            className="min-h-0 flex-1"
            filters={armyModel.filters}
            modeTabs={[...ARMY_RUNTIME_TABS]}
            onTabChange={(id) => setActiveRuntimeTab(id as ArmyRuntimeTab)}
            onFilterChange={(id) => setActiveFilterId(id as ArmyFilterId)}
            onTroopDragEnd={() => setDraggedTroopId(null)}
            onTroopDragStart={(troop) => setDraggedTroopId(troop.id)}
            onSupportRowSelect={garrison.onSupportRowSelect}
            onTroopSelect={handleTroopSelect}
            onVillageRowIconSelect={handleVillageRowIconSelect}
            onVillageRowSelect={garrison.onVillageRowSelect}
            onboardingDragHintTroopId={
              showOnboardingDragHint ? UNIT_TYPES.MILITIA : null
            }
            recruitSheet={{
              ...armyModel.recruitSheet,
              cancelQueueDisabled: cancelTraining.isPending,
              cancelQueueItemId: pendingCancelTrainingId,
              isDragging: Boolean(draggedTroopId),
              onCancelQueueItem: handleCancelQueueItem,
              onDropTroop: handleDropTroop,
            }}
            sections={activeRuntimeTab === 'army' ? armyModel.armySections : undefined}
            showFilters={false}
            showRecruitSheet={activeRuntimeTab === 'barracks'}
            troops={activeRuntimeTab === 'barracks' ? armyModel.barracksTroops : []}
          />
        )}
      </div>

      {selectedUnit && (
        <UnitDetailModal
          barracksLevel={barracksLevel}
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
        />
      )}

      {selectedCancelTraining ? (
        <TrainingCancelDialog
          isPending={cancelTraining.isPending}
          onClose={() => setCancelTrainingId(null)}
          onConfirm={handleConfirmCancelTraining}
          training={selectedCancelTraining}
        />
      ) : null}

      <BottomSheet
        isOpen={Boolean(recruitTroop)}
        maxHeight="88vh"
        onClose={() => setRecruitTroopId(null)}
        zIndex={80}
      >
        <GameBottomSheetPanel bodyClassName="p-0" scrollable>
          {recruitTroop ? (
            <ArmyRecruitPopup
              disabled={train.isPending}
              embedded
              labels={recruitLabels}
              max={recruitMax}
              onCancel={() => setRecruitTroopId(null)}
              onChange={setRecruitValue}
              onRecruit={handleRecruit}
              quickValues={buildArmyRecruitQuickValues(recruitMax)}
              requiredValue={recruitRequiredValue}
              showHandle={false}
              stock={armyModel.stock}
              troop={recruitTroop}
              value={boundedRecruitValue}
            />
          ) : null}
        </GameBottomSheetPanel>
      </BottomSheet>

      <BottomSheet
        isOpen={garrison.isGarrisonOpen}
        maxHeight="72vh"
        onClose={garrison.clear}
        zIndex={80}
      >
        <GameBottomSheetPanel
          eyebrow="Garnison"
          title={
            <GarrisonSheetTitle
              subtitle={garrison.selectedGarrisonSubtitle}
              title={garrison.selectedGarrisonTitle}
            />
          }
          scrollable
        >
          {garrison.selectedGarrisonLines.length > 0 ? (
            <GarrisonActions
              isPending={recallReinforcement.isPending}
              lines={garrison.selectedGarrisonLines}
              onRecall={handleRecallLine}
              pendingRecallKey={pendingRecallKey}
            />
          ) : null}
          {recallReinforcement.isError ? (
            <p className="mx-3 mb-3 rounded-md border border-red-700/30 bg-red-900/20 px-3 py-2 text-sm text-red-900">
              Impossible de rappeler ce renfort pour le moment.
            </p>
          ) : null}
        </GameBottomSheetPanel>
      </BottomSheet>
    </div>
  );
}
