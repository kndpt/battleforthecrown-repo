import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HeaderBar, type HeaderBarStat } from '@/features/design-system/components/HeaderBar';
import { useDisplayResources, useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  useKingdomPowerQuery,
  useMyVillagesQuery,
  usePopulationQuery,
} from '@/api/queries';
import { formatResourceAmount } from '@/lib/resourceConfig';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';

const integerFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

interface GameHeaderProps {
  onPowerClick?: () => void;
}

export function GameHeader({ onPowerClick }: GameHeaderProps = {}) {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const setVillage = useGameStore((state) => state.setVillage);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const population = usePopulationQuery(villageId);
  const kingdomPower = useKingdomPowerQuery();
  const myVillages = useMyVillagesQuery(worldId);
  const { display, hasSnapshot } = useDisplayResources(villageId);
  const { balance: crownBalance } = useDisplayCrowns(userId, worldId);
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

  const primaryStats = useMemo<[HeaderBarStat, HeaderBarStat]>(() => {
    const power = kingdomPower.data?.kingdomPower ?? 0;
    const crowns = Number.isFinite(crownBalance ?? NaN) ? Math.floor(crownBalance ?? 0) : 0;
    return [
      {
        icon: '/assets/army-power.png',
        label: 'Puissance',
        value: integerFormatter.format(power),
        onClick: onPowerClick,
      },
      { icon: '/assets/crown.png', label: 'Couronnes', value: integerFormatter.format(crowns) },
    ];
  }, [kingdomPower.data, crownBalance, onPowerClick]);

  const resources = useMemo<[HeaderBarStat, HeaderBarStat, HeaderBarStat]>(() => {
    const max = hasSnapshot && display ? display.maxPerType : 0;
    const woodCurrent = hasSnapshot && display ? Math.floor(display.wood) : 0;
    const stoneCurrent = hasSnapshot && display ? Math.floor(display.stone) : 0;
    const ironCurrent = hasSnapshot && display ? Math.floor(display.iron) : 0;
    const ratio = (current: number) => (max > 0 ? current / max : undefined);
    return [
      {
        icon: '/assets/resources/wood.png',
        label: 'Bois',
        value: formatResourceAmount(woodCurrent),
        fillRatio: ratio(woodCurrent),
      },
      {
        icon: '/assets/resources/stone.png',
        label: 'Pierre',
        value: formatResourceAmount(stoneCurrent),
        fillRatio: ratio(stoneCurrent),
      },
      {
        icon: '/assets/resources/iron.png',
        label: 'Fer',
        value: formatResourceAmount(ironCurrent),
        fillRatio: ratio(ironCurrent),
      },
    ];
  }, [hasSnapshot, display]);

  const populationStat = useMemo<HeaderBarStat>(() => {
    const used = population.data?.used ?? 0;
    const max = population.data?.max ?? 0;
    return {
      icon: '/assets/resources/population.png',
      label: 'Population',
      value: max > 0 ? `${formatResourceAmount(used)}/${formatResourceAmount(max)}` : formatResourceAmount(used),
      fillRatio: max > 0 ? used / max : undefined,
    };
  }, [population.data]);

  const switchVillage = (direction: -1 | 1) => {
    if (villages.length <= 1) return;
    const index = activeVillageIndex >= 0 ? activeVillageIndex : 0;
    const nextIndex = (index + direction + villages.length) % villages.length;
    setVillage(villages[nextIndex].id);
    setIsVillageMenuOpen(false);
  };

  return (
    <div className="flex flex-col bg-[#3c2619]">
      <div className="px-1.5 pt-1.5 pb-1">
        <HeaderBar
          avatarInitials="SK"
          level={12}
          population={populationStat}
          primaryStats={primaryStats}
          resources={resources}
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
    </div>
  );
}
