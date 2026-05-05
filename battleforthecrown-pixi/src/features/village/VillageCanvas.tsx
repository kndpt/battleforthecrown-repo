import { useCallback, useEffect, useRef } from 'react';
import { type Application } from 'pixi.js';
import { PixiCanvas } from '@/pixi/PixiCanvas';
import { SceneManager } from '@/pixi/scenes/SceneManager';
import { createVillageScene, type VillageSceneHandle } from '@/pixi/scenes/VillageScene';
import { loadBundle } from '@/pixi/assets/loader';
import { gameSocket } from '@/api/ws';
import type { BuildingDto } from '@/api';

interface VillageCanvasProps {
  villageId: string;
  buildings: BuildingDto[];
  onSelectBuilding?: (building: BuildingDto) => void;
}

export function VillageCanvas({ villageId, buildings, onSelectBuilding }: VillageCanvasProps) {
  const handleRef = useRef<VillageSceneHandle | null>(null);
  const buildingsRef = useRef<BuildingDto[]>(buildings);
  const onSelectRef = useRef<typeof onSelectBuilding>(onSelectBuilding);

  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);

  useEffect(() => {
    onSelectRef.current = onSelectBuilding;
  }, [onSelectBuilding]);

  useEffect(() => {
    void loadBundle('village');
  }, []);

  const onReady = useCallback(
    (app: Application) => {
      const manager = new SceneManager(app);
      const handle = createVillageScene(app, {
        onSelectBuilding: (id) => {
          const building = buildingsRef.current.find((b) => b.id === id);
          if (building) onSelectRef.current?.(building);
        },
      });
      handleRef.current = handle;
      manager.register('village', () => handle.scene);
      manager.switchTo('village');
      handle.reconcile(buildingsRef.current);

      const offBuildingCompleted = gameSocket.on('building.completed', (payload) => {
        if (payload.villageId === villageId) {
          handle.flashBuilding(payload.buildingId);
        }
      });

      return () => {
        offBuildingCompleted();
        handleRef.current = null;
        manager.destroy();
      };
    },
    [villageId],
  );

  useEffect(() => {
    handleRef.current?.reconcile(buildings);
  }, [buildings]);

  return <PixiCanvas className="absolute inset-0" onReady={onReady} />;
}
