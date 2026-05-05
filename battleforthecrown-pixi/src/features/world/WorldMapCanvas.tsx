import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { type Application } from 'pixi.js';
import { PixiCanvas } from '@/pixi/PixiCanvas';
import { SceneManager } from '@/pixi/scenes/SceneManager';
import { createWorldMapScene, type WorldMapHandle } from '@/pixi/scenes/WorldMapScene';
import { loadBundle } from '@/pixi/assets/loader';
import { useWorldMapStore } from '@/stores/worldMap';
import { useExpeditionsStore } from '@/stores/expeditions';
import type { MapEntity } from '@/api/world-types';

export interface WorldMapCanvasController {
  centerOn: (worldX: number, worldY: number) => void;
  worldToScreen: (tileX: number, tileY: number) => { x: number; y: number };
}

interface WorldMapCanvasProps {
  gridWidth: number;
  gridHeight: number;
  myVillage?: MapEntity | null;
  visibilityRadius?: number | null;
  controllerRef?: MutableRefObject<WorldMapCanvasController | null>;
}

export function WorldMapCanvas({
  gridWidth,
  gridHeight,
  myVillage,
  visibilityRadius = null,
  controllerRef,
}: WorldMapCanvasProps) {
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
        initialCenter: { x: initialCenter.x, y: initialCenter.y },
        initialZoom: 1,
        myVillage: myVillage ? { x: myVillage.x, y: myVillage.y } : null,
        visibilityRadius,
        onSelectEntity: (id) => setSelectedEntity(id),
      });
      handleRef.current = handle;
      if (controllerRef) {
        controllerRef.current = {
          centerOn: handle.centerOn,
          worldToScreen: handle.worldToScreen,
        };
      }

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
        if (controllerRef) controllerRef.current = null;
        handleRef.current = null;
        manager.destroy();
      };
    },
    [
      gridWidth,
      gridHeight,
      initialCenter.x,
      initialCenter.y,
      myVillage,
      visibilityRadius,
      setSelectedEntity,
      controllerRef,
    ],
  );

  // Update vision overlay when watchtower upgrades without remounting the scene.
  useEffect(() => {
    handleRef.current?.setVision(
      myVillage ? { x: myVillage.x, y: myVillage.y } : null,
      visibilityRadius,
    );
  }, [myVillage, visibilityRadius]);

  useEffect(() => {
    return () => {
      // ensure no stale selection survives navigation
      useWorldMapStore.getState().setSelectedEntity(null);
    };
  }, []);

  // Kick off the world map asset bundle on mount; the scene's update tick
  // promotes circles to sprites once the textures land.
  useEffect(() => {
    void loadBundle('world-map');
  }, []);

  return <PixiCanvas className="absolute inset-0" onReady={onReady} />;
}
