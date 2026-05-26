import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';
import { Badge, BottomSheet, Button, Panel, Spinner } from '@/ui';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { KingdomActivitiesBottomSheet } from '@/features/combat/KingdomActivitiesBottomSheet';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import {
  useArmyInventoryQuery,
  useArmyTrainingQuery,
  useGarrisonQuery,
  useOnboardingSummaryQuery,
  useRecallReinforcementMutation,
  useVillageBuildingsQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import type { ArmyUnitDto } from '@/api/queries';
import type { KingdomActivityTab } from '@/features/design-system/components';
import { BuildingDetailModal } from '@/features/village/BuildingDetailModal';
import { unitMetaFor } from './unitConfig';
import { UnitList } from './UnitList';
import { UnitDetailModal } from './UnitDetailModal';

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

export function ArmyScreen() {
  const navigate = useNavigate();
  const worldId = useGameStore((state) => state.worldId);
  const villageId = useGameStore((state) => state.villageId);
  const buildings = useVillageBuildingsQuery(villageId);
  const inventory = useArmyInventoryQuery(villageId);
  const training = useArmyTrainingQuery(villageId);
  const garrison = useGarrisonQuery(villageId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const recallReinforcement = useRecallReinforcementMutation();

  const [selectedUnit, setSelectedUnit] = useState<ArmyUnitDto | null>(null);
  const [isBarracksModalOpen, setIsBarracksModalOpen] = useState(false);
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  const [isExpeditionsOpen, setIsExpeditionsOpen] = useState(false);
  const [kingdomActivityTab, setKingdomActivityTab] = useState<KingdomActivityTab>('expeditions');
  const unreadCount = useUnreadReportsCount();

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const barracksLevel = barracks?.level ?? 0;

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

  const units = inventory.data ?? [];
  const trainings = training.data ?? [];
  const heldUnits = units.filter((u) => u.quantity > 0);
  const totalQuantity = heldUnits.reduce((sum, u) => sum + u.quantity, 0);
  const garrisonLines = garrison.data ?? [];
  const incomingGarrison = garrisonLines.filter((line) => line.direction === 'INCOMING');
  const outgoingGarrison = garrisonLines.filter((line) => line.direction === 'OUTGOING');
  const hasGarrison = garrisonLines.length > 0;
  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data);
  const pendingRecallKey = recallReinforcement.variables
    ? `${recallReinforcement.variables.villageId}:${recallReinforcement.variables.originVillageId}:${Object.keys(recallReinforcement.variables.units)[0]}`
    : null;
  const runArmyAction = (actionId: GameActionId) => {
    runGameAction(actionId, { navigate });
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
      <div className="flex-shrink">
        <GameHeader onPowerClick={() => setIsPowerSheetOpen(true)} />
      </div>

      <div
        className="flex-1 overflow-y-auto pb-24 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <main className="container mx-auto px-3 py-4 max-w-4xl">
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
          {heldUnits.length > 0 && (
            <div className="bg-gradient-to-br from-white/60 via-white/50 to-white/40 rounded-lg p-3 border-2 border-kingdom-300 mb-6 shadow-clay-md">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-cinzel text-base font-bold text-kingdom-800">
                  Vos troupes
                </h2>
                <Badge variant="success" size="sm">
                  {totalQuantity}
                </Badge>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {heldUnits.map((unit) => {
                  const meta = unitMetaFor(unit.type);
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setSelectedUnit(unit)}
                      className="relative flex flex-col items-center justify-center bg-game-blue-light/20 border border-game-blue-border/30 rounded-md p-1.5 hover:scale-105 transition-transform overflow-hidden"
                    >
                      <div className="w-7 h-7 mb-0.5 flex items-center justify-center">
                        {meta.iconPath ? (
                          <img
                            src={meta.iconPath}
                            alt={meta.name}
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                        ) : (
                          <span aria-hidden className="text-xl">
                            {meta.emoji}
                          </span>
                        )}
                      </div>
                      <Badge variant="info" size="sm">
                        {unit.quantity}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {inventory.isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Spinner variant="warning" size="lg" />
              <p className="text-kingdom-700 font-game text-sm">
                Chargement des troupes...
              </p>
            </div>
          ) : (
            <UnitList
              units={units}
              trainings={trainings}
              barracksLevel={barracksLevel}
              onUnitClick={(u) => setSelectedUnit(u)}
              onUpgradeBarracks={barracks ? () => setIsBarracksModalOpen(true) : undefined}
            />
          )}

          <Panel variant="stone" padding="md" className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-cinzel text-base font-bold text-white">
                Garnison
              </h2>
              <Badge variant="info" size="sm">
                {garrisonLines.length}
              </Badge>
            </div>

            {garrison.isLoading ? (
              <div className="flex items-center gap-3 py-4">
                <Spinner variant="warning" size="sm" />
                <p className="text-sm text-white/85">Chargement de la garnison...</p>
              </div>
            ) : !hasGarrison ? (
              <p className="rounded-md border border-white/15 bg-white/10 px-3 py-4 text-sm text-white/85">
                Aucun renfort stationné ou envoyé.
              </p>
            ) : (
              <div className="space-y-4">
                {incomingGarrison.length > 0 && (
                  <div>
                    <h3 className="font-cinzel text-sm font-semibold text-white/90 mb-2">
                      Stationnées ici
                    </h3>
                    <div className="space-y-2">
                      {incomingGarrison.map((line) => {
                        const meta = unitMetaFor(line.unitType);
                        const recallKey = `${line.villageId}:${line.originVillageId}:${line.unitType}`;
                        const isPending = recallReinforcement.isPending && pendingRecallKey === recallKey;

                        return (
                          <div
                            key={`incoming-${recallKey}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-white/15 bg-white/10 p-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {meta.iconPath ? (
                                  <img
                                    src={meta.iconPath}
                                    alt={meta.name}
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                  />
                                ) : (
                                  <span aria-hidden className="text-lg">
                                    {meta.emoji}
                                  </span>
                                )}
                                <p className="truncate text-sm font-semibold text-white">
                                  {meta.name}
                                </p>
                                <Badge variant="success" size="sm">
                                  {line.quantity}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-white/70">
                                Origine : village {line.originVillageId}
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                recallReinforcement.mutate({
                                  villageId: line.villageId,
                                  originVillageId: line.originVillageId,
                                  units: { [line.unitType]: line.quantity },
                                })
                              }
                            >
                              {isPending ? 'Renvoi...' : 'Renvoyer'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {outgoingGarrison.length > 0 && (
                  <div>
                    <h3 className="font-cinzel text-sm font-semibold text-white/90 mb-2">
                      En soutien ailleurs
                    </h3>
                    <div className="space-y-2">
                      {outgoingGarrison.map((line) => {
                        const meta = unitMetaFor(line.unitType);
                        const recallKey = `${line.villageId}:${line.originVillageId}:${line.unitType}`;
                        const isPending = recallReinforcement.isPending && pendingRecallKey === recallKey;

                        return (
                          <div
                            key={`outgoing-${recallKey}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-white/15 bg-white/10 p-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {meta.iconPath ? (
                                  <img
                                    src={meta.iconPath}
                                    alt={meta.name}
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                  />
                                ) : (
                                  <span aria-hidden className="text-lg">
                                    {meta.emoji}
                                  </span>
                                )}
                                <p className="truncate text-sm font-semibold text-white">
                                  {meta.name}
                                </p>
                                <Badge variant="success" size="sm">
                                  {line.quantity}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-white/70">
                                Hôte : village {line.villageId}
                              </p>
                            </div>
                            <Button
                              variant="warning"
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                recallReinforcement.mutate({
                                  villageId: line.villageId,
                                  originVillageId: line.originVillageId,
                                  units: { [line.unitType]: line.quantity },
                                })
                              }
                            >
                              {isPending ? 'Rappel...' : 'Rappeler'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {recallReinforcement.isError && (
              <p className="mt-3 rounded-md border border-red-200/40 bg-red-900/30 px-3 py-2 text-sm text-red-100">
                Impossible de rappeler ce renfort pour le moment.
              </p>
            )}
          </Panel>

          <Panel variant="info" padding="md" className="flex items-start gap-3 mt-6">
            <span className="text-2xl" aria-hidden>
              💡
            </span>
            <div>
              <p className="font-cinzel font-semibold text-sm text-game-blue-border mb-1">
                Conseil Stratégique
              </p>
              <p className="text-xs text-white leading-relaxed">
                Entraînez plusieurs types d&apos;unités pour constituer une armée
                équilibrée. Améliorez la <span className="font-bold">Caserne</span>{' '}
                pour débloquer des troupes plus puissantes&nbsp;!
              </p>
            </div>
          </Panel>
        </main>
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

      {isBarracksModalOpen && barracks && villageId && (
        <BuildingDetailModal
          villageId={villageId}
          building={barracks}
          onClose={() => setIsBarracksModalOpen(false)}
        />
      )}

      <PowerBottomSheet
        isOpen={isPowerSheetOpen}
        onClose={() => setIsPowerSheetOpen(false)}
      />

      <BottomSheet
        isOpen={isExpeditionsOpen}
        onClose={() => setIsExpeditionsOpen(false)}
        maxHeight="82vh"
      >
        <KingdomActivitiesBottomSheet
          activeTab={kingdomActivityTab}
          onClose={() => setIsExpeditionsOpen(false)}
          onTabChange={setKingdomActivityTab}
          worldId={worldId}
        />
      </BottomSheet>

      <ToastStack />
    </div>
  );
}
