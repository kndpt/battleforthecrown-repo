import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';
import { ApiError } from '@/api';
import {
  useArmyInventoryQuery,
  useArmyTrainingQuery,
  useGarrisonQuery,
  useOnboardingSummaryQuery,
  usePopulationQuery,
  useRecallReinforcementMutation,
  useTrainUnitsMutation,
  useVillageBuildingsQuery,
  useWorldConfigQuery,
} from '@/api/queries';
import type { ArmyUnitDto } from '@/api/queries';
import { Badge, BottomSheet, Button, Panel, Spinner } from '@/ui';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import {
  ArmyContentDesign,
  ArmyRecruitPopup,
  computeArmyRecruitMax,
  GameBottomSheetPanel,
  type ArmyRecruitPopupLabels,
  type ArmyTroop,
} from '@/features/design-system/components';
import { useDisplayResources } from '@/features/resources/useDisplayResources';
import type { GarrisonLine } from '@/lib/types';
import { useTickingNow } from '@/lib/useTickingNow';
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

function NoBarracksScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100 flex items-center justify-center p-4">
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
    <div className="space-y-3 p-3">
      {lines.map((line) => {
        const meta = unitMetaFor(line.unitType);
        const recallKey = `${line.villageId}:${line.originVillageId}:${line.unitType}`;
        const pending = isPending && pendingRecallKey === recallKey;
        const incoming = line.direction === 'INCOMING';

        return (
          <div
            className="flex items-center justify-between gap-3 rounded-lg border border-[#5d4a32]/30 bg-white/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]"
            key={`${line.direction}-${recallKey}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {meta.iconPath ? (
                  <img
                    alt={meta.name}
                    className="size-7 object-contain"
                    src={meta.iconPath}
                  />
                ) : (
                  <span aria-hidden className="text-xl">
                    {meta.emoji}
                  </span>
                )}
                <p className="truncate font-game text-sm font-bold text-[#3d2f1f]">
                  {meta.name}
                </p>
                <Badge variant="success" size="sm">
                  {line.quantity}
                </Badge>
              </div>
              <p className="mt-1 font-game text-[11px] text-[#6d5838]">
                {incoming
                  ? `Origine : village ${line.originVillageId}`
                  : `Hôte : village ${line.villageId}`}
              </p>
            </div>
            <Button
              disabled={pending}
              onClick={() => onRecall(line)}
              size="sm"
              variant={incoming ? 'danger' : 'warning'}
            >
              {pending ? (incoming ? 'Renvoi...' : 'Rappel...') : incoming ? 'Renvoyer' : 'Rappeler'}
            </Button>
          </div>
        );
      })}
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
  const garrison = useGarrisonQuery(villageId);
  const population = usePopulationQuery(villageId);
  const worldConfig = useWorldConfigQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const recallReinforcement = useRecallReinforcementMutation();
  const train = useTrainUnitsMutation();
  const pushToast = useUiStore((state) => state.pushToast);
  const nowMs = useTickingNow(1_000);
  const { display } = useDisplayResources(villageId);

  const [activeFilterId, setActiveFilterId] = useState<ArmyFilterId>('all');
  const [draggedTroopId, setDraggedTroopId] = useState<string | null>(null);
  const [recruitTroopId, setRecruitTroopId] = useState<string | null>(null);
  const [recruitValue, setRecruitValue] = useState(1);
  const [selectedGarrisonTroopId, setSelectedGarrisonTroopId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ArmyUnitDto | null>(null);
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  const unreadCount = useUnreadReportsCount();

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const barracksLevel = barracks?.level ?? 0;

  const units = inventory.data ?? [];
  const trainings = training.data ?? [];
  const garrisonLines = garrison.data ?? EMPTY_GARRISON_LINES;
  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data);

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

  const recruitTroop = recruitTroopId
    ? armyModel.troops.find((troop) => troop.id === recruitTroopId) ?? null
    : null;
  const recruitMax = recruitTroop
    ? computeArmyRecruitMax(recruitTroop, armyModel.stock)
    : 0;
  const boundedRecruitValue = recruitMax <= 0
    ? 0
    : Math.max(1, Math.min(recruitMax, recruitValue));
  const selectedGarrisonLines = selectedGarrisonTroopId
    ? garrisonLines.filter((line) => line.unitType === selectedGarrisonTroopId)
    : [];
  const selectedGarrisonTroop = selectedGarrisonTroopId
    ? armyModel.troops.find((troop) => troop.id === selectedGarrisonTroopId) ?? null
    : null;
  const pendingRecallKey = recallReinforcement.variables
    ? `${recallReinforcement.variables.villageId}:${recallReinforcement.variables.originVillageId}:${Object.keys(recallReinforcement.variables.units)[0]}`
    : null;

  if (buildings.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
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

  const handleTroopSelect = (troop: ArmyTroop) => {
    const hasGarrisonActions =
      (troop.fromAllies ?? 0) > 0 || (troop.supportingElsewhere ?? 0) > 0;
    if (hasGarrisonActions) {
      setSelectedGarrisonTroopId(troop.id);
      return;
    }
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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
      <div className="flex-shrink">
        <GameHeader onPowerClick={() => setIsPowerSheetOpen(true)} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-24">
        <OnboardingGuidance
          guidance={onboardingGuidance}
          isLoading={
            onboardingSummary.isLoading ||
            inventory.isLoading ||
            training.isLoading ||
            garrison.isLoading
          }
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
            className="min-h-0 flex-1"
            filters={armyModel.filters}
            onFilterChange={(id) => setActiveFilterId(id as ArmyFilterId)}
            onTroopDragEnd={() => setDraggedTroopId(null)}
            onTroopDragStart={(troop) => setDraggedTroopId(troop.id)}
            onTroopSelect={handleTroopSelect}
            recruitSheet={{
              ...armyModel.recruitSheet,
              isDragging: Boolean(draggedTroopId),
              onDropTroop: handleDropTroop,
            }}
            troops={armyModel.visibleTroops}
          />
        )}
      </div>

      <BottomNavigationBar
        activeTab="army"
        onBuildingsClick={() => navigate('/game')}
        onArmyClick={() => undefined}
        onWorldClick={() => navigate('/game/world')}
        onMessagesClick={() => navigate('/game/messages')}
        unreadCount={unreadCount}
      />

      {selectedUnit && (
        <UnitDetailModal
          barracksLevel={barracksLevel}
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
        />
      )}

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
              showHandle={false}
              stock={armyModel.stock}
              troop={recruitTroop}
              value={boundedRecruitValue}
            />
          ) : null}
        </GameBottomSheetPanel>
      </BottomSheet>

      <BottomSheet
        isOpen={Boolean(selectedGarrisonTroop && selectedGarrisonLines.length > 0)}
        maxHeight="72vh"
        onClose={() => setSelectedGarrisonTroopId(null)}
        zIndex={80}
      >
        <GameBottomSheetPanel
          eyebrow="Garnison"
          title={selectedGarrisonTroop?.name}
          scrollable
        >
          {selectedGarrisonLines.length > 0 ? (
            <GarrisonActions
              isPending={recallReinforcement.isPending}
              lines={selectedGarrisonLines}
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

      <PowerBottomSheet
        isOpen={isPowerSheetOpen}
        onClose={() => setIsPowerSheetOpen(false)}
      />

      <ToastStack />
    </div>
  );
}
