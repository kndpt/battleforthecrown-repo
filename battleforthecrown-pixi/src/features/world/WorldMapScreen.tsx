import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { GameSession } from '@/features/game/GameSession';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { Spinner } from '@/ui/spinners';
import { WorldMapCanvas } from './WorldMapCanvas';
import { SelectedEntityPanel } from './SelectedEntityPanel';
import { buildMapEntities } from './buildMapEntities';
import { ExpeditionList } from '@/features/combat/ExpeditionList';
import { AttackDetailModal } from '@/features/combat/AttackDetailModal';
import {
  useMyVillagesQuery,
  useWorldDetailsQuery,
  useWorldEntitiesQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';
import { useWorldMapStore } from '@/stores/worldMap';
import type { MapEntity } from '@/api/world-types';

const FALLBACK_GRID = { gridWidth: 500, gridHeight: 500 };

export function WorldMapScreen() {
  const worldId = useGameStore((state) => state.worldId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldEntities = useWorldEntitiesQuery(worldId);
  const myVillages = useMyVillagesQuery(worldId);
  const worldDetails = useWorldDetailsQuery(worldId);

  const setEntities = useWorldMapStore((state) => state.setEntities);
  const selectedEntityId = useWorldMapStore((state) => state.selectedEntityId);
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const [attackTarget, setAttackTarget] = useState<MapEntity | null>(null);

  const entities: MapEntity[] = useMemo(
    () => buildMapEntities(worldEntities.data ?? [], myVillages.data ?? [], userId),
    [worldEntities.data, myVillages.data, userId],
  );

  useEffect(() => {
    setEntities(entities);
  }, [entities, setEntities]);

  // Clean store entry when leaving the map.
  useEffect(() => {
    return () => {
      useWorldMapStore.getState().clear();
    };
  }, []);

  const myVillage = entities.find((e) => e.isMine);
  const selectedEntity = selectedEntityId ? entities.find((e) => e.id === selectedEntityId) ?? null : null;

  const dims = worldDetails.data
    ? {
        gridWidth: worldDetails.data.gridWidth ?? FALLBACK_GRID.gridWidth,
        gridHeight: worldDetails.data.gridHeight ?? FALLBACK_GRID.gridHeight,
      }
    : FALLBACK_GRID;

  return (
    <GameSession>
      <div className="flex h-full flex-col gap-3 px-3 py-3">
        <GameHeader />

        <main className="relative flex-1 overflow-hidden rounded-md border-2 border-game-gold-border bg-[#0d0f17]">
          {worldEntities.isLoading || myVillages.isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <WorldMapCanvas
              gridWidth={dims.gridWidth}
              gridHeight={dims.gridHeight}
              myVillage={myVillage ?? null}
            />
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col">
            <div className="flex justify-between p-3">
              <Link
                to="/game"
                className="pointer-events-auto rounded border-2 border-game-gold-border bg-black/70 px-3 py-1 text-xs uppercase tracking-widest text-game-gold-light hover:bg-game-gold-dark hover:text-white"
              >
                ← Retour au village
              </Link>
              <div className="pointer-events-auto rounded border-2 border-game-gold-border bg-black/70 px-3 py-1 text-xs text-parchment/80">
                {entities.length} entité{entities.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 p-3">
              <ExpeditionList />
              <SelectedEntityPanel
                entity={selectedEntity}
                onClose={() => setSelectedEntity(null)}
                onAttack={(target) => setAttackTarget(target)}
              />
            </div>
          </div>
        </main>

        {attackTarget && myVillage && (
          <AttackDetailModal
            target={attackTarget}
            origin={{ x: myVillage.x, y: myVillage.y }}
            onClose={() => setAttackTarget(null)}
          />
        )}

        <ToastStack />
      </div>
    </GameSession>
  );
}
