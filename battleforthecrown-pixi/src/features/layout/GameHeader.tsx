import { useMemo } from 'react';
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
import { usePopulationQuery } from '@/api/queries';

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
  const user = useAuthStore((state) => state.user);
  const population = usePopulationQuery(villageId);
  const { display, productionRates, hasSnapshot } = useDisplayResources(villageId);

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

  // Power non câblé côté backend Phase 9 — placeholder à 0, ouvrir un sheet stub.
  const powerValue = 0;

  return (
    <HeaderBar>
      <div className="flex w-full items-center gap-1">
        {/* Left: profile (avatar + level badge, no text) */}
        <PlayerProfile playerName={shortName(user?.email)} level={1} showTextProfile={false} />

        {/* Right: takes all remaining width with two rows */}
        <div className="flex-1 flex flex-col items-start gap-2">
          {/* Row 1: Power + Crowns */}
          <div className="w-full flex justify-between isolate">
            <PowerBadge value={powerValue} className="w-max" onClick={onPowerClick} />
            <CrownDisplay />
          </div>

          {/* Row 2: Resources (compact) + Population */}
          <div className="w-full flex items-center justify-end gap-3 isolate">
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
    </HeaderBar>
  );
}
