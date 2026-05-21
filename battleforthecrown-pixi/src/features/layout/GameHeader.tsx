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
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });

interface GameHeaderProps {
  onPowerClick?: () => void;
  onResourceClick?: (resource: 'iron' | 'stone' | 'wood') => void;
}

export function GameHeader({ onPowerClick, onResourceClick }: GameHeaderProps = {}) {
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
        onClick: onResourceClick ? () => onResourceClick('wood') : undefined,
      },
      {
        icon: '/assets/resources/stone.png',
        label: 'Pierre',
        value: formatResourceAmount(stoneCurrent),
        fillRatio: ratio(stoneCurrent),
        onClick: onResourceClick ? () => onResourceClick('stone') : undefined,
      },
      {
        icon: '/assets/resources/iron.png',
        label: 'Fer',
        value: formatResourceAmount(ironCurrent),
        fillRatio: ratio(ironCurrent),
        onClick: onResourceClick ? () => onResourceClick('iron') : undefined,
      },
    ];
  }, [hasSnapshot, display, onResourceClick]);

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

  const villageInsights = useMemo(() => {
    return villages
      .map((village) => {
        const foundedAt = village.createdAt ? new Date(village.createdAt) : null;
        const hasFoundedDate = foundedAt && !Number.isNaN(foundedAt.getTime());
        const distanceFromActive = activeVillage
          ? Math.round(Math.hypot(village.x - activeVillage.x, village.y - activeVillage.y))
          : null;

        return {
          village,
          foundedLabel: hasFoundedDate ? dateFormatter.format(foundedAt) : null,
          distanceFromActive,
          isActive: village.id === activeVillage?.id,
        };
      })
      .sort((a, b) => {
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        if (a.village.isCapital) return -1;
        if (b.village.isCapital) return 1;
        return a.village.name.localeCompare(b.village.name, 'fr-FR');
      });
  }, [activeVillage, villages]);

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" role="presentation">
              <button
                type="button"
                className="absolute inset-0 cursor-default"
                aria-label="Fermer la gestion multi-village"
                onClick={() => setIsVillageMenuOpen(false)}
              />

              <section
                role="dialog"
                aria-modal="true"
                aria-label="Gestion multi-village"
                className="relative z-10 flex w-full max-w-[52rem] flex-col overflow-hidden rounded-2xl border-2 border-game-gold-border bg-[#f8edd2] shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              >
                <header className="border-b border-[#b88f4f] bg-[linear-gradient(180deg,#5b3e24_0%,#3d2717_100%)] px-5 py-4 text-parchment">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-game text-[11px] uppercase tracking-[0.18em] text-game-gold">Gestion du royaume</p>
                      <h2 className="font-game text-xl font-bold uppercase tracking-wide">Choix du village actif</h2>
                      <p className="mt-1 text-xs text-parchment/80">Sélection rapide et vue claire de tes positions clés.</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-game-gold/40 px-2 py-1 text-xs font-bold uppercase text-parchment transition hover:bg-white/10"
                      onClick={() => setIsVillageMenuOpen(false)}
                    >
                      Fermer
                    </button>
                  </div>
                </header>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  {villageInsights.map(({ village, foundedLabel, distanceFromActive, isActive }) => (
                    <button
                      type="button"
                      key={village.id}
                      onClick={() => {
                        setVillage(village.id);
                        setIsVillageMenuOpen(false);
                      }}
                      className={`rounded-xl border-2 p-3 text-left transition ${
                        isActive
                          ? 'border-game-gold-border bg-game-gold/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
                          : 'border-[#d9be8a] bg-[#fff8ea] hover:border-[#c59a55] hover:bg-[#fff1d6]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-game text-base font-bold uppercase tracking-wide text-kingdom-900">{village.name}</p>
                        {isActive && <span className="rounded-full bg-game-green/20 px-2 py-0.5 text-[10px] font-bold uppercase text-game-green">Actif</span>}
                      </div>
                      <p className="mt-1 font-game text-[11px] uppercase tracking-wide text-kingdom-700">
                        {village.isCapital
                          ? 'Capitale'
                          : village.label
                            ? VILLAGE_LABEL_DISPLAY[village.label]
                            : 'Village'}
                        {' · '}
                        {village.x}|{village.y}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-kingdom-800">
                        <div className="rounded-lg border border-[#d9be8a] bg-white/75 px-2 py-1">
                          <p className="font-semibold uppercase text-kingdom-600">Distance</p>
                          <p className="font-game font-bold">
                            {distanceFromActive === null || isActive ? '—' : `${distanceFromActive} cases`}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#d9be8a] bg-white/75 px-2 py-1">
                          <p className="font-semibold uppercase text-kingdom-600">Fondé le</p>
                          <p className="font-game font-bold">{foundedLabel ?? 'Inconnu'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
