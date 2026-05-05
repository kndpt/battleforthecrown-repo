import { Globe, Hammer, Home, Lock, Mail, Swords } from 'lucide-react';
import { Tooltip } from '@/ui';
import { useBuildingsForLockCheck } from './useBuildingsForLockCheck';

type Tab = 'army' | 'buildings' | 'world' | 'messages';

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
  const { isBarracksBuilt } = useBuildingsForLockCheck();

  const isCompact = density === 'compact';

  const baseBar =
    'fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#8b7355] ' +
    'bg-gradient-to-t from-[#3c2619]/95 via-[#4e3822]/90 to-[#6b4b2b]/85 ' +
    'backdrop-blur-md shadow-[0_-6px_18px_rgba(0,0,0,0.45)]';

  const wrapper = `max-w-screen-lg mx-auto flex justify-around
    ${isCompact ? 'px-3 py-1.5' : 'px-4 py-2'}
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
    <div className={baseBar}>
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
        <button
          onClick={onWorldClick}
          className={`${btnBase} ${
            activeTab === 'world' ? 'scale-105' : 'hover:scale-[1.02] active:scale-95'
          }`}
          title="Explorer la carte du monde"
        >
          <div
            className={`${iconWrapBase} ${activeTab === 'world' ? iconActive : iconInactive}`}
          >
            <Globe size={iconSize} className="text-white drop-shadow-md" />
          </div>
          <span
            className={`${labelBase} ${
              activeTab === 'world' ? labelActive : labelInactive
            }`}
          >
            Monde
          </span>
        </button>
      </div>
    </div>
  );
}
