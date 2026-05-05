import { useNavigate } from 'react-router';
import { Panel } from '@/ui';
import { GameHeader } from '@/features/layout/GameHeader';
import { BottomNavigationBar } from '@/features/village/BottomNavigationBar';
import { GameSession } from '@/features/game/GameSession';

/**
 * Stub temporaire — sera remplacé en Phase 9.D par le portage de
 * battleforthecrown/src/features/combat/components/ReportsList.tsx.
 */
export function MessagesScreen() {
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
              Messages
            </h2>
            <p className="text-sm text-kingdom-700 font-game">
              Les rapports de combat (ReportsList, ReportCard, AttackDetailModal)
              seront portés en Phase 9.D depuis le legacy. Les events WS{' '}
              <code>battle.resolved</code> sont déjà reçus, mais l&apos;UI de
              consultation des rapports est encore à faire.
            </p>
          </Panel>
        </div>

        <BottomNavigationBar
          activeTab="messages"
          onBuildingsClick={() => navigate('/game')}
          onArmyClick={() => navigate('/game/army')}
          onWorldClick={() => navigate('/game/world')}
          onMessagesClick={() => navigate('/game/messages')}
        />
      </div>
    </GameSession>
  );
}
