import { ArrowLeft, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button, Panel } from '@/ui';
import { GameSession } from '@/features/game/GameSession';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';

/**
 * Shown on /game/world when the player has no Watchtower built yet. The
 * BottomNavigationBar already greys out the World icon, but a deep-link or a
 * destroyed watchtower can still bring the user here, so we render a friendly
 * gate instead of letting them peek at the map without paying the gameplay cost.
 */
export function WorldLockedScreen() {
  const navigate = useNavigate();
  const unreadCount = useUnreadReportsCount();

  return (
    <GameSession>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
        <div className="flex-shrink">
          <GameHeader />
        </div>

        <div className="flex-1 flex items-center justify-center p-4 pb-24">
          <Panel variant="stone" padding="lg" className="text-center max-w-md shadow-2xl">
            <Lock className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="font-cinzel text-2xl font-bold text-white mb-3">
              Carte du monde verrouillée
            </h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Construisez la <span className="font-bold">Tour de guet</span> pour
              débloquer la carte du monde et explorer les territoires voisins.
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

        <BottomNavigationBar
          activeTab="world"
          onBuildingsClick={() => navigate('/game')}
          onArmyClick={() => navigate('/game/army')}
          onWorldClick={() => undefined}
          onMessagesClick={() => navigate('/game/messages')}
          unreadCount={unreadCount}
        />

        <ToastStack />
      </div>
    </GameSession>
  );
}
