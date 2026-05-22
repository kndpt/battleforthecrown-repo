import { useMemo, useState } from 'react';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';
import { ApiError, type BuildingDto } from '@/api';
import {
  useChangeVillageStrategyMutation,
  useCrownsQuery,
  useResourcesQuery,
  useVillageStrategyQuery,
} from '@/api/queries';
import {
  VillageStyleModal,
  VillageStyleTrigger,
  villageStyleOptions,
  type VillageStyleCost,
} from '@/features/design-system/components';
import { useGameStore } from '@/stores/game';

interface VillageStyleControlProps {
  buildings: BuildingDto[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  villageId: string;
}

function isCouncilHallBuilt(buildings: BuildingDto[]): boolean {
  return buildings.some(
    (building) => building.type === 'COUNCIL_HALL' && building.level >= 1 && !building.isUnderConstruction,
  );
}

function strategyErrorMessage(error: Error | null): string | null {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : error.message;
  if (message.includes('Council Hall')) return 'Salle du Conseil absente';
  if (message.includes('cooldown')) return 'Cooldown actif';
  if (message.includes('Insufficient crowns')) return 'Couronnes insuffisantes';
  if (message.includes('Insufficient resources')) return 'Ressources insuffisantes';
  if (message.includes('already uses')) return 'Cette voie est déjà active';
  return message || 'Changement impossible';
}

export function VillageStyleControl({
  buildings,
  onOpenChange,
  open,
  showTrigger = true,
  villageId,
}: VillageStyleControlProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const worldId = useGameStore((state) => state.worldId);
  const hasCouncilHall = isCouncilHallBuilt(buildings);
  const strategyQuery = useVillageStrategyQuery(villageId, hasCouncilHall);
  const resourcesQuery = useResourcesQuery(villageId);
  const crownsQuery = useCrownsQuery(worldId);
  const changeStrategy = useChangeVillageStrategyMutation();

  const currentStyleId = strategyQuery.data?.currentStrategy ?? 'BALANCED';
  const options = useMemo(() => {
    const info = strategyQuery.data;
    return villageStyleOptions.map((option) => ({
      ...option,
      cost: info?.changeCosts[option.id] ?? option.cost,
      name: info?.strategies[option.id]?.displayName ?? option.name,
      tagline: info?.strategies[option.id]?.description ?? option.tagline,
    }));
  }, [strategyQuery.data]);

  const stock: VillageStyleCost | null =
    resourcesQuery.data && crownsQuery.data
      ? {
          crowns: crownsQuery.data.balance,
          iron: resourcesQuery.data.iron,
          stone: resourcesQuery.data.stone,
          wood: resourcesQuery.data.wood,
        }
      : null;

  if (!hasCouncilHall) {
    return null;
  }

  const errorMessage =
    strategyErrorMessage(changeStrategy.error) ??
    strategyErrorMessage(strategyQuery.error);

  const handleAdopt = (strategy: VillageStrategyType) => {
    changeStrategy.mutate(
      { villageId, strategy },
      {
        onSuccess: () => {
          setOpen(false);
        },
      },
    );
  };

  return (
    <>
      {showTrigger ? (
        <div className="fixed bottom-28 left-1/2 z-20 -translate-x-1/2">
          <VillageStyleTrigger currentStyleId={currentStyleId} onClick={() => setOpen(true)} options={options} />
        </div>
      ) : null}
      <VillageStyleModal
        canChange={Boolean(strategyQuery.data?.canChange)}
        cooldownEndsAt={strategyQuery.data?.cooldownEndsAt ?? null}
        currentStyleId={currentStyleId}
        errorMessage={errorMessage}
        hasCouncilHall={strategyQuery.data?.hasCouncilHall ?? hasCouncilHall}
        isStockLoading={!stock}
        isSubmitting={changeStrategy.isPending}
        onAdopt={handleAdopt}
        onClose={() => setOpen(false)}
        open={isOpen}
        options={options}
        scaleCosts={false}
        stock={stock ?? { crowns: 0, iron: 0, stone: 0, wood: 0 }}
      />
    </>
  );
}
