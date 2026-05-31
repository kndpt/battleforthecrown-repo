import { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { withBuildingsPanelSearch } from '@/features/game/gamePanelSearch';
import { BottomNavigationBar } from './BottomNavigationBar';
import { GameHeader } from './GameHeader';
import {
  GameShellHeaderContext,
  type HeaderResourceClickHandler,
} from './GameShellLayoutContext';
import { ToastStack } from './ToastStack';

type GameTab = 'army' | 'buildings' | 'world' | 'messages';

function activeTabForPath(pathname: string): GameTab {
  if (pathname === '/game/army') return 'army';
  if (pathname === '/game/world') return 'world';
  if (pathname === '/game/messages') return 'messages';
  return 'buildings';
}

export function GameShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const unreadCount = useUnreadReportsCount();
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  const [resourceClickHandler, setResourceClickHandler] =
    useState<HeaderResourceClickHandler>(null);
  const activeTab = activeTabForPath(location.pathname);

  const setHeaderResourceClickHandler = useCallback((handler: HeaderResourceClickHandler) => {
    setResourceClickHandler(() => handler);
  }, []);

  const contextValue = useMemo(
    () => ({ setResourceClickHandler: setHeaderResourceClickHandler }),
    [setHeaderResourceClickHandler],
  );

  const handleBuildingsClick = useCallback(() => {
    if (location.pathname !== '/game') {
      navigate('/game');
      return;
    }

    setSearchParams((current) => withBuildingsPanelSearch(current));
  }, [location.pathname, navigate, setSearchParams]);

  return (
    <GameShellHeaderContext.Provider value={contextValue}>
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
        <div className="flex-shrink-0">
          <GameHeader
            onPowerClick={() => setIsPowerSheetOpen(true)}
            onResourceClick={resourceClickHandler ?? undefined}
          />
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>

        <BottomNavigationBar
          activeTab={activeTab}
          onArmyClick={activeTab === 'army' ? undefined : () => navigate('/game/army')}
          onBuildingsClick={handleBuildingsClick}
          onMessagesClick={
            activeTab === 'messages' ? undefined : () => navigate('/game/messages')
          }
          onWorldClick={activeTab === 'world' ? undefined : () => navigate('/game/world')}
          unreadCount={unreadCount}
        />

        <PowerBottomSheet
          isOpen={isPowerSheetOpen}
          onClose={() => setIsPowerSheetOpen(false)}
        />

        <ToastStack />
      </div>
    </GameShellHeaderContext.Provider>
  );
}
