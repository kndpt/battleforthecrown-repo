import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type Application } from 'pixi.js';
import { PixiCanvas } from '@/pixi/PixiCanvas';
import { SceneManager } from '@/pixi/scenes/SceneManager';
import { createWorldMapScene, type WorldMapHandle } from '@/pixi/scenes/WorldMapScene';
import { useWorldMapStore } from '@/stores/worldMap';
import { useExpeditionsStore } from '@/stores/expeditions';
import type { MapEntity } from '@/api/world-types';

interface WorldMapCanvasProps {
  gridWidth: number;
  gridHeight: number;
  myVillage?: MapEntity | null;
}

export function WorldMapCanvas({ gridWidth, gridHeight, myVillage }: WorldMapCanvasProps) {
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const handleRef = useRef<WorldMapHandle | null>(null);
  const initialCenter = useMemo(
    () => myVillage ?? { x: gridWidth / 2, y: gridHeight / 2 },
    [myVillage, gridWidth, gridHeight],
  );

  const onReady = useCallback(
    (app: Application) => {
      const manager = new SceneManager(app);
      const handle = createWorldMapScene(app, {
        gridWidth,
        gridHeight,
        tileSize: 8,
        initialCenter: { x: initialCenter.x, y: initialCenter.y },
        initialZoom: 1,
        onSelectEntity: (id) => setSelectedEntity(id),
      });
      handleRef.current = handle;

      manager.register('world-map', () => handle.scene);
      manager.switchTo('world-map');

      // Initial reconcile from stores (might already have data).
      handle.reconcile(Object.values(useWorldMapStore.getState().entities));
      handle.reconcileExpeditions(Object.values(useExpeditionsStore.getState().byId));
      handle.setSelected(useWorldMapStore.getState().selectedEntityId);

      // Subscribe to store updates without triggering React re-renders.
      const unsubEntities = useWorldMapStore.subscribe((state, prev) => {
        if (state.entities !== prev.entities) {
          handle.reconcile(Object.values(state.entities));
        }
        if (state.selectedEntityId !== prev.selectedEntityId) {
          handle.setSelected(state.selectedEntityId);
        }
      });
      const unsubExpeditions = useExpeditionsStore.subscribe((state, prev) => {
        if (state.byId !== prev.byId) {
          handle.reconcileExpeditions(Object.values(state.byId));
        }
      });

      return () => {
        unsubEntities();
        unsubExpeditions();
        handleRef.current = null;
        manager.destroy();
      };
    },
    [gridWidth, gridHeight, initialCenter.x, initialCenter.y, setSelectedEntity],
  );

  useEffect(() => {
    return () => {
      // ensure no stale selection survives navigation
      useWorldMapStore.getState().setSelectedEntity(null);
    };
  }, []);

  return <PixiCanvas className="absolute inset-0" onReady={onReady} />;
}
