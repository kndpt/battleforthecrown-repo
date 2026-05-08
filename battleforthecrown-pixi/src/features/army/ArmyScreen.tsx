import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';
import { Badge, BottomSheet, Button, Panel, Spinner } from '@/ui';
import { GameSession } from '@/features/game/GameSession';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { ExpeditionList } from '@/features/combat/ExpeditionList';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import {
  useArmyInventoryQuery,
  useArmyTrainingQuery,
  useVillageBuildingsQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import type { ArmyUnitDto } from '@/api/queries';
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
  const villageId = useGameStore((state) => state.villageId);
  const buildings = useVillageBuildingsQuery(villageId);
  const inventory = useArmyInventoryQuery(villageId);
  const training = useArmyTrainingQuery(villageId);

  const [selectedUnit, setSelectedUnit] = useState<ArmyUnitDto | null>(null);
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  const [isExpeditionsOpen, setIsExpeditionsOpen] = useState(false);
  const unreadCount = useUnreadReportsCount();

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const barracksLevel = barracks?.level ?? 0;

  if (buildings.isLoading) {
    return (
      <GameSession>
        <div className="h-screen flex items-center justify-center bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
          <Spinner size="lg" />
        </div>
      </GameSession>
    );
  }

  if (barracksLevel === 0) {
    return (
      <GameSession>
        <NoBarracksScreen />
      </GameSession>
    );
  }

  const units = inventory.data ?? [];
  const trainings = training.data ?? [];
  const heldUnits = units.filter((u) => u.quantity > 0);
  const totalQuantity = heldUnits.reduce((sum, u) => sum + u.quantity, 0);

  return (
    <GameSession>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
        <div className="flex-shrink">
          <GameHeader
            onPowerClick={() => setIsPowerSheetOpen(true)}
            onNotificationsClick={() => setIsExpeditionsOpen(true)}
          />
        </div>

        <div
          className="flex-1 overflow-y-auto pb-24 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <main className="container mx-auto px-3 py-4 max-w-4xl">
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
              />
            )}

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
            unit={selectedUnit}
            barracksLevel={barracksLevel}
            onClose={() => setSelectedUnit(null)}
          />
        )}

        <PowerBottomSheet
          isOpen={isPowerSheetOpen}
          onClose={() => setIsPowerSheetOpen(false)}
        />

        <BottomSheet
          isOpen={isExpeditionsOpen}
          onClose={() => setIsExpeditionsOpen(false)}
        >
          <div className="p-4">
            <ExpeditionList />
          </div>
        </BottomSheet>

        <ToastStack />
      </div>
    </GameSession>
  );
}
