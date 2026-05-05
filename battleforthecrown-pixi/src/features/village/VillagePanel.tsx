import { useMemo, useState } from 'react';
import { Spinner } from '@/ui/spinners';
import { useVillageBuildingsQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import type { BuildingDto } from '@/api';
import { metaFor } from './buildingMeta';
import { BuildingCard } from './BuildingCard';
import { BuildingDetailModal } from './BuildingDetailModal';

export function VillagePanel() {
  const villageId = useGameStore((state) => state.villageId);
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const buildings = useMemo(() => {
    return [...(buildingsQuery.data ?? [])].sort(
      (a, b) => metaFor(a.type).sortKey - metaFor(b.type).sortKey || a.type.localeCompare(b.type),
    );
  }, [buildingsQuery.data]);

  const selectedBuilding = useMemo<BuildingDto | undefined>(
    () => buildings.find((b) => b.id === selectedId),
    [buildings, selectedId],
  );

  if (!villageId) {
    return (
      <div className="rounded-md border-2 border-dashed border-game-gold-border bg-black/30 p-6 text-center text-parchment/80">
        Sélectionne un monde et un village pour gérer tes constructions.
      </div>
    );
  }

  if (buildingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (buildingsQuery.isError) {
    return (
      <p className="rounded border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-sm text-white">
        Impossible de charger les bâtiments.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {buildings.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            onClick={(b) => setSelectedId(b.id)}
          />
        ))}
      </div>

      {selectedBuilding && (
        <BuildingDetailModal
          villageId={villageId}
          building={selectedBuilding}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
