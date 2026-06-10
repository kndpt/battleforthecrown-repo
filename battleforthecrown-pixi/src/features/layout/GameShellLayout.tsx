import { useCallback, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { BottomNavigationBar } from './BottomNavigationBar';
import { GameHeader } from './GameHeader';
import { ToastStack } from './ToastStack';

type GameTab = 'army' | 'buildings' | 'world' | 'messages' | 'rankings';

function activeTabForPath(pathname: string): GameTab {
  if (pathname === '/game/army') return 'army';
  if (pathname === '/game/world') return 'world';
  if (pathname === '/game/messages') return 'messages';
  if (pathname === '/game/rankings') return 'rankings';
  return 'buildings';
}

export function GameShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadReportsCount();
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  // Village view is fully self-contained (own header + nav bar)
  const isVillageView = location.pathname === '/game';
  const activeTab = activeTabForPath(location.pathname);

  const handleBuildingsClick = useCallback(() => {
    if (location.pathname !== '/game') {
      navigate('/game');
      return;
    }

  }, [location.pathname, navigate]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
      {/* GameHeader hidden on village view — VillageView has its own header */}
      {!isVillageView && (
        <div className="flex-shrink-0">
          <GameHeader
            onPowerClick={() => setIsPowerSheetOpen(true)}
            showResources={activeTab === 'army'}
            showVillageSwitcher={activeTab === 'army' || activeTab === 'world'}
          />
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* BottomNavigationBar hidden on village view — VillageView renders its own */}
      {!isVillageView && (
        <BottomNavigationBar
          activeTab={activeTab}
          animateActiveOnMount
          onArmyClick={activeTab === 'army' ? undefined : () => navigate('/game/army')}
          onBuildingsClick={handleBuildingsClick}
          onMessagesClick={
            activeTab === 'messages' ? undefined : () => navigate('/game/messages')
          }
          onRankingsClick={
            activeTab === 'rankings' ? undefined : () => navigate('/game/rankings')
          }
          onWorldClick={activeTab === 'world' ? undefined : () => navigate('/game/world')}
          unreadCount={unreadCount}
        />
      )}

      {/* PowerBottomSheet for non-village views; village view manages its own */}
      {!isVillageView && (
        <PowerBottomSheet
          isOpen={isPowerSheetOpen}
          onClose={() => setIsPowerSheetOpen(false)}
        />
      )}

      <ToastStack />
    </div>
  );
}
