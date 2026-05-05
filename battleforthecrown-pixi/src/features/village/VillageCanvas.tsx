import { useCallback, useEffect, useRef, useState } from 'react';
import { type Application } from 'pixi.js';
import { PixiCanvas } from '@/pixi/PixiCanvas';
import { SceneManager } from '@/pixi/scenes/SceneManager';
import { createVillageScene, type VillageSceneHandle } from '@/pixi/scenes/VillageScene';
import { loadBundle } from '@/pixi/assets/loader';
import { gameSocket } from '@/api/ws';
import type { BuildingDto } from '@/api';
import { BuildingDetailModal } from './BuildingDetailModal';

interface VillageCanvasProps {
  villageId: string;
  buildings: BuildingDto[];
}

export function VillageCanvas({ villageId, buildings }: VillageCanvasProps) {
  const handleRef = useRef<VillageSceneHandle | null>(null);
  const buildingsRef = useRef<BuildingDto[]>(buildings);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep an up-to-date ref so the scene callbacks see the latest data without
  // forcing the canvas to remount.
  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);

  // Kick off the village asset bundle on mount; sprites attach themselves
  // when the textures land (BuildingSprite.tick re-checks every frame).
  useEffect(() => {
    void loadBundle('village');
  }, []);

  const onReady = useCallback(
    (app: Application) => {
      const manager = new SceneManager(app);
      const handle = createVillageScene(app, {
        onSelectBuilding: (id) => setSelectedId(id),
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

  // Reconcile when the buildings list changes after the scene is mounted.
  useEffect(() => {
    handleRef.current?.reconcile(buildings);
  }, [buildings]);

  const selectedBuilding = selectedId ? buildings.find((b) => b.id === selectedId) ?? null : null;

  return (
    <div className="relative h-full w-full">
      <PixiCanvas className="absolute inset-0" onReady={onReady} />
      {selectedBuilding && (
        <BuildingDetailModal
          villageId={villageId}
          building={selectedBuilding}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
