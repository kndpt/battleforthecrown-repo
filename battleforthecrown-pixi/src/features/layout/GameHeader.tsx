import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  HeaderActions,
  HeaderBar,
  PlayerProfile,
  PopulationIndicator,
  ResourceDisplay,
  type ResourceDisplayItem,
} from '@/ui';
import { useDisplayResources } from '@/features/resources/useDisplayResources';
import { CrownDisplay } from '@/features/crowns/CrownDisplay';
import { PowerBadge } from '@/features/power/PowerBadge';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  useMyVillagesQuery,
  usePopulationQuery,
  useVillagePowerQuery,
} from '@/api/queries';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';

interface GameHeaderProps {
  onPowerClick?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
}

function shortName(email?: string): string {
  if (!email) return 'Sire';
  const handle = email.split('@')[0] ?? email;
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export function GameHeader({
  onPowerClick,
  onNotificationsClick,
  onSettingsClick,
  onMenuClick,
}: GameHeaderProps) {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const setVillage = useGameStore((state) => state.setVillage);
  const user = useAuthStore((state) => state.user);
  const population = usePopulationQuery(villageId);
  const villagePower = useVillagePowerQuery(villageId);
  const myVillages = useMyVillagesQuery(worldId);
  const { display, productionRates, hasSnapshot } = useDisplayResources(villageId);
  const [isVillageMenuOpen, setIsVillageMenuOpen] = useState(false);
  const villages = myVillages.data ?? [];
  const fallbackVillageId = villages.find((village) => village.isCapital)?.id
    ?? villages[0]?.id
    ?? null;
  const activeVillage =
    villages.find((village) => village.id === villageId) ?? villages[0] ?? null;
  const activeVillageIndex = activeVillage
    ? villages.findIndex((village) => village.id === activeVillage.id)
    : -1;

  useEffect(() => {
    if (
      fallbackVillageId &&
      (!villageId || !villages.some((village) => village.id === villageId))
    ) {
      setVillage(fallbackVillageId);
    }
  }, [fallbackVillageId, setVillage, villageId, villages]);

  const headerResources: ResourceDisplayItem[] = useMemo(() => {
    if (!hasSnapshot || !display) return [];
    return [
      {
        type: 'wood',
        current: Math.floor(display.wood),
        max: display.maxPerType,
        production: productionRates?.wood,
      },
      {
        type: 'stone',
        current: Math.floor(display.stone),
        max: display.maxPerType,
        production: productionRates?.stone,
      },
      {
        type: 'iron',
        current: Math.floor(display.iron),
        max: display.maxPerType,
        production: productionRates?.iron,
      },
    ];
  }, [hasSnapshot, display, productionRates]);

  const populationAvailable = population.data
    ? Math.max(0, population.data.max - population.data.used)
    : undefined;

  const powerValue = villagePower.data?.total ?? 0;

  const switchVillage = (direction: -1 | 1) => {
    if (villages.length <= 1) return;
    const index = activeVillageIndex >= 0 ? activeVillageIndex : 0;
    const nextIndex = (index + direction + villages.length) % villages.length;
    setVillage(villages[nextIndex].id);
    setIsVillageMenuOpen(false);
  };

  return (
    <HeaderBar className="relative h-24 flex-col items-stretch justify-start px-0">
      <div className="flex h-16 w-full items-center gap-1 px-4">
        <PlayerProfile playerName={shortName(user?.email)} level={1} showTextProfile={false} />

        <div className="flex-1 flex flex-col items-start gap-2">
          <div className="w-full flex items-center justify-between gap-2 isolate">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <PowerBadge value={powerValue} className="w-max" onClick={onPowerClick} />
            </div>
            <CrownDisplay />
          </div>

          <div className="w-full flex flex-wrap items-center justify-end gap-2 isolate">
            <ResourceDisplay resources={headerResources} compact />
            <PopulationIndicator
              availablePopulation={populationAvailable}
              loading={population.isLoading}
            />
          </div>
        </div>

        <HeaderActions
          notificationCount={0}
          onSettingsClick={onSettingsClick}
          onNotificationsClick={onNotificationsClick}
          onMenuClick={onMenuClick}
        />
      </div>
      {activeVillage && (
        <div className="relative flex h-8 items-center justify-center border-t border-[#3d2f1f]/35 bg-[#4b3826]/35 px-3">
          <button
            type="button"
            onClick={() => switchVillage(-1)}
            disabled={villages.length <= 1}
            className="absolute left-3 inline-flex size-7 items-center justify-center rounded-full text-parchment disabled:opacity-35"
            aria-label="Village précédent"
          >
            <img
              src="/assets/arrow-top.png"
              alt=""
              className="size-6 -rotate-90 object-contain"
            />
          </button>

          <button
            type="button"
            onClick={() => setIsVillageMenuOpen((open) => !open)}
            className="mx-10 flex min-w-0 max-w-[18rem] items-center gap-1 text-center font-game text-sm font-bold uppercase tracking-wide text-parchment"
            aria-expanded={isVillageMenuOpen}
            aria-label="Choisir le village actif"
          >
            <span className="truncate">
              {activeVillage.isCapital
                ? 'Capitale'
                : activeVillage.label
                  ? VILLAGE_LABEL_DISPLAY[activeVillage.label]
                  : 'Village'}
              {' — '}
              {activeVillage.name}
            </span>
            {villages.length > 1 && <ChevronDown size={16} className="shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => switchVillage(1)}
            disabled={villages.length <= 1}
            className="absolute right-3 inline-flex size-7 items-center justify-center rounded-full text-parchment disabled:opacity-35"
            aria-label="Village suivant"
          >
            <img
              src="/assets/arrow-top.png"
              alt=""
              className="size-6 rotate-90 object-contain"
            />
          </button>

          {isVillageMenuOpen && villages.length > 1 && (
            <div className="absolute left-1/2 top-full z-50 mt-1 w-[min(21rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded border-2 border-game-gold-border bg-parchment shadow-xl">
              {villages.map((village) => (
                <button
                  type="button"
                  key={village.id}
                  onClick={() => {
                    setVillage(village.id);
                    setIsVillageMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-game text-sm font-bold text-kingdom-900 ${
                    village.id === activeVillage.id ? 'bg-game-gold/25' : 'hover:bg-kingdom-100'
                  }`}
                >
                  <span className="truncate">{village.name}</span>
                  <span className="shrink-0 text-[10px] uppercase text-kingdom-700">
                    {village.isCapital
                      ? 'Capitale'
                      : village.label
                        ? VILLAGE_LABEL_DISPLAY[village.label]
                        : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </HeaderBar>
  );
}
