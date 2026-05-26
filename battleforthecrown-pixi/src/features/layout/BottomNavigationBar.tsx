import { useLayoutEffect, useRef } from 'react';
import { Globe, Hammer, Home, Lock, Mail, Swords } from 'lucide-react';
import { Tooltip } from '@/ui';
import { useBuildingsForLockCheck } from './useBuildingsForLockCheck';

type Tab = 'army' | 'buildings' | 'world' | 'messages';

export const BOTTOM_NAV_HEIGHT_VAR = '--bftc-bottom-nav-height';
export const BOTTOM_NAV_GAP_VAR = '--bftc-bottom-nav-gap';
const BOTTOM_NAV_GAP_PX = 18;

interface BottomNavigationBarProps {
  onBuildingsClick: () => void;
  onArmyClick?: () => void;
  onWorldClick?: () => void;
  onMessagesClick?: () => void;
  activeTab?: Tab;
  density?: 'compact' | 'cozy';
  /** Number of unread combat reports — drives the red bubble on Messages. */
  unreadCount?: number;
}

export function BottomNavigationBar({
  onBuildingsClick,
  onArmyClick,
  onWorldClick,
  onMessagesClick,
  activeTab = 'buildings',
  density = 'compact',
  unreadCount = 0,
}: BottomNavigationBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isBarracksBuilt, isWatchtowerBuilt } = useBuildingsForLockCheck();

  const isCompact = density === 'compact';

  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        BOTTOM_NAV_HEIGHT_VAR,
        `${node.getBoundingClientRect().height}px`,
      );
      document.documentElement.style.setProperty(
        BOTTOM_NAV_GAP_VAR,
        `${BOTTOM_NAV_GAP_PX}px`,
      );
    };

    syncHeight();
    window.addEventListener('resize', syncHeight);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncHeight);
    observer?.observe(node);

    return () => {
      window.removeEventListener('resize', syncHeight);
      observer?.disconnect();
      document.documentElement.style.removeProperty(BOTTOM_NAV_HEIGHT_VAR);
      document.documentElement.style.removeProperty(BOTTOM_NAV_GAP_VAR);
    };
  }, [density]);

  const baseBar =
    'fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#2b1a10] ' +
    'bg-[linear-gradient(180deg,#523720_0%,#4a301e_54%,#3f2718_100%)]';

  const wrapper = `max-w-screen-lg mx-auto flex justify-around
    ${isCompact ? 'px-3 pt-3' : 'px-4 pt-3.5'}
    pb-[max(env(safe-area-inset-bottom),8px)]
  `;

  const iconWrapBase =
    'flex items-center justify-center rounded-full border-2 transition-all ' +
    (isCompact ? 'w-10 h-10' : 'w-11 h-11');

  const iconInactive =
    'bg-gradient-to-b from-[#8b6f47] to-[#5d4a32] border-[#6a5033] ' +
    'hover:from-[#9d7f57] hover:to-[#6d5a42]';

  const iconActive =
    'bg-gradient-to-b from-[#f6d57b] to-[#c59e3f] border-[#f4d88d] ' +
    'shadow-[0_0_16px_rgba(250,224,120,0.45)]';

  const btnBase =
    'flex flex-col items-center transition-all duration-200 rounded-lg ' +
    (isCompact ? 'gap-0.5 px-3' : 'gap-1 px-4');

  const labelBase =
    'font-game font-semibold tracking-wide ' +
    (isCompact ? 'text-[10px]' : 'text-xs');

  const labelActive = 'text-[#fff4cf] text-shadow-game';
  const labelInactive = 'text-[#f0e0c0]/90';

  const iconSize = isCompact ? 18 : 20;

  return (
    <div className={baseBar} ref={rootRef}>
      <div className={wrapper}>
        {/* Army */}
        <Tooltip
          content={!isBarracksBuilt ? 'Construisez la caserne pour débloquer' : undefined}
          position="top"
          variant="dark"
        >
          <button
            onClick={isBarracksBuilt ? onArmyClick : undefined}
            disabled={!isBarracksBuilt}
            title={
              !isBarracksBuilt
                ? 'Construisez la caserne pour débloquer'
                : 'Gérer votre armée'
            }
            className={`${btnBase} ${
              !isBarracksBuilt
                ? 'opacity-40 cursor-not-allowed'
                : activeTab === 'army'
                  ? 'scale-105'
                  : 'hover:scale-[1.02] active:scale-95'
            }`}
          >
            <div
              className={`${iconWrapBase} ${
                !isBarracksBuilt
                  ? 'bg-gradient-to-b from-[#a5a29a] to-[#6f6c63] border-[#59554b]'
                  : activeTab === 'army'
                    ? iconActive
                    : iconInactive
              }`}
            >
              {!isBarracksBuilt ? (
                <Lock size={iconSize} className="text-white" />
              ) : (
                <Swords size={iconSize} className="text-white drop-shadow-md" />
              )}
            </div>
            <span
              className={`${labelBase} ${activeTab === 'army' ? labelActive : labelInactive}`}
            >
              Armée
            </span>
          </button>
        </Tooltip>

        {/* Buildings */}
        <button
          onClick={onBuildingsClick}
          className={`${btnBase} ${
            activeTab === 'buildings' ? 'scale-105' : 'hover:scale-[1.02] active:scale-95'
          }`}
        >
          <div
            className={`${iconWrapBase} ${activeTab === 'buildings' ? iconActive : iconInactive}`}
          >
            {activeTab === 'buildings' ? (
              <Hammer size={iconSize} className="text-white drop-shadow-md" />
            ) : (
              <Home size={iconSize} className="text-white drop-shadow-md" />
            )}
          </div>
          <span
            className={`${labelBase} ${
              activeTab === 'buildings' ? labelActive : labelInactive
            }`}
          >
            {activeTab === 'buildings' ? 'Bâtiments' : 'Village'}
          </span>
        </button>

        {/* Messages */}
        <button
          onClick={onMessagesClick}
          className={`${btnBase} ${
            activeTab === 'messages' ? 'scale-105' : 'hover:scale-[1.02] active:scale-95'
          }`}
          title="Consulter vos messages"
        >
          <div
            className={`${iconWrapBase} ${
              activeTab === 'messages' ? iconActive : iconInactive
            } relative`}
          >
            <Mail size={iconSize} className="text-white drop-shadow-md" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-game-red-dark text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
                {unreadCount}
              </div>
            )}
          </div>
          <span
            className={`${labelBase} ${
              activeTab === 'messages' ? labelActive : labelInactive
            }`}
          >
            Messages
          </span>
        </button>

        {/* World */}
        <Tooltip
          content={!isWatchtowerBuilt ? 'Construisez la tour de guet pour débloquer' : undefined}
          position="top"
          variant="dark"
        >
          <button
            onClick={isWatchtowerBuilt ? onWorldClick : undefined}
            disabled={!isWatchtowerBuilt}
            title={
              !isWatchtowerBuilt
                ? 'Construisez la tour de guet pour débloquer'
                : 'Explorer la carte du monde'
            }
            className={`${btnBase} ${
              !isWatchtowerBuilt
                ? 'opacity-40 cursor-not-allowed'
                : activeTab === 'world'
                  ? 'scale-105'
                  : 'hover:scale-[1.02] active:scale-95'
            }`}
          >
            <div
              className={`${iconWrapBase} ${
                !isWatchtowerBuilt
                  ? 'bg-gradient-to-b from-[#a5a29a] to-[#6f6c63] border-[#59554b]'
                  : activeTab === 'world'
                    ? iconActive
                    : iconInactive
              }`}
            >
              {!isWatchtowerBuilt ? (
                <Lock size={iconSize} className="text-white" />
              ) : (
                <Globe size={iconSize} className="text-white drop-shadow-md" />
              )}
            </div>
            <span
              className={`${labelBase} ${
                activeTab === 'world' ? labelActive : labelInactive
              }`}
            >
              Monde
            </span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
