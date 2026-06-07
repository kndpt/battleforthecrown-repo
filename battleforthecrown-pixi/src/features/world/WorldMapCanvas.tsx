import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { type Application } from 'pixi.js';
import { PixiCanvas } from '@/pixi/PixiCanvas';
import { SceneManager } from '@/pixi/scenes/SceneManager';
import {
  createWorldMapScene,
  type WorldMapCameraSnapshot,
  type WorldMapHandle,
} from '@/pixi/scenes/WorldMapScene';
import { loadBundle } from '@/pixi/assets/loader';
import { useWorldMapStore } from '@/stores/worldMap';
import { useExpeditionsStore } from '@/stores/expeditions';
import type { MapEntity } from '@/api/world-types';
import type { VisionDisk } from '@battleforthecrown/shared/world';

const EMPTY_VISION_DISKS: readonly VisionDisk[] = [];

export interface WorldMapCanvasController {
  centerOn: (worldX: number, worldY: number) => void;
  onCameraChange: (callback: (camera: WorldMapCameraSnapshot) => void) => () => void;
  worldToScreen: (tileX: number, tileY: number) => { x: number; y: number };
}

interface WorldMapCanvasProps {
  gridWidth: number;
  gridHeight: number;
  myVillage?: MapEntity | null;
  visionDisks?: readonly VisionDisk[];
  fogOfWarEnabled?: boolean;
  onCameraChange?: (camera: WorldMapCameraSnapshot) => void;
  onControllerReady?: (ready: boolean) => void;
  controllerRef?: MutableRefObject<WorldMapCanvasController | null>;
}

export function WorldMapCanvas({
  gridWidth,
  gridHeight,
  myVillage,
  visionDisks = EMPTY_VISION_DISKS,
  fogOfWarEnabled = true,
  onCameraChange,
  onControllerReady,
  controllerRef,
}: WorldMapCanvasProps) {
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const handleRef = useRef<WorldMapHandle | null>(null);
  const myVillageRef = useRef(myVillage);
  const visionDisksRef = useRef(visionDisks);
  const onCameraChangeRef = useRef(onCameraChange);

  useEffect(() => {
    myVillageRef.current = myVillage;
    visionDisksRef.current = visionDisks;
    onCameraChangeRef.current = onCameraChange;
  }, [myVillage, visionDisks, onCameraChange]);

  const onReady = useCallback(
    (app: Application) => {
      const manager = new SceneManager(app);
      const currentMyVillage = myVillageRef.current;
      const initialCenter = currentMyVillage ?? { x: gridWidth / 2, y: gridHeight / 2 };
      const handle = createWorldMapScene(app, {
        gridWidth,
        gridHeight,
        initialCenter: { x: initialCenter.x, y: initialCenter.y },
        initialZoom: 1,
        myVillage: currentMyVillage ? { x: currentMyVillage.x, y: currentMyVillage.y } : null,
        visionDisks: visionDisksRef.current,
        fogOfWarEnabled,
        onSelectEntity: (id) => setSelectedEntity(id),
      });
      handleRef.current = handle;
      if (controllerRef) {
        controllerRef.current = {
          centerOn: handle.centerOn,
          onCameraChange: handle.onCameraChange,
          worldToScreen: handle.worldToScreen,
        };
      }
      onControllerReady?.(true);

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
      const unsubCamera = handle.onCameraChange((camera) => {
        onCameraChangeRef.current?.(camera);
      });

      return () => {
        unsubEntities();
        unsubExpeditions();
        unsubCamera();
        if (controllerRef) controllerRef.current = null;
        onControllerReady?.(false);
        handleRef.current = null;
        manager.destroy();
      };
    },
    [
      gridWidth,
      gridHeight,
      fogOfWarEnabled,
      setSelectedEntity,
      onControllerReady,
      controllerRef,
    ],
  );

  // Update vision overlay when the backend vision disks change without remounting the scene.
  useEffect(() => {
    handleRef.current?.setVision(
      myVillage ? { x: myVillage.x, y: myVillage.y } : null,
      visionDisks,
      fogOfWarEnabled,
    );
  }, [myVillage, visionDisks, fogOfWarEnabled]);

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
