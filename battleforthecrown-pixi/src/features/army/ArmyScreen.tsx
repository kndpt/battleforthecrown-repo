import { useNavigate } from 'react-router';
import { Panel } from '@/ui';
import { GameHeader } from '@/features/layout/GameHeader';
import { BottomNavigationBar } from '@/features/village/BottomNavigationBar';
import { GameSession } from '@/features/game/GameSession';

/**
 * Stub temporaire — sera remplacé en Phase 9.D par le portage de
 * battleforthecrown/src/features/army/components/ArmyInterface.tsx.
 */
export function ArmyScreen() {
  const navigate = useNavigate();

  return (
    <GameSession>
      <div className="h-screen flex flex-col mx-auto overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
        <div className="flex-shrink">
          <GameHeader />
        </div>

        <div className="flex-1 overflow-y-auto pb-24 p-4">
          <Panel variant="parchment" padding="lg" className="max-w-2xl mx-auto mt-8">
            <h2 className="font-cinzel text-xl font-bold text-kingdom-900 mb-3">
              Armée
            </h2>
            <p className="text-sm text-kingdom-700 font-game">
              L&apos;entraînement et l&apos;inventaire des troupes seront portés en
              Phase 9.D. Le backend est prêt mais l&apos;interface (ArmyInterface,
              UnitCard, UnitDetailModal, UnitList) attend d&apos;être migrée depuis
              le legacy.
            </p>
          </Panel>
        </div>

        <BottomNavigationBar
          activeTab="army"
          onBuildingsClick={() => navigate('/game')}
          onArmyClick={() => navigate('/game/army')}
          onWorldClick={() => navigate('/game/world')}
          onMessagesClick={() => navigate('/game/messages')}
        />
      </div>
    </GameSession>
  );
}
