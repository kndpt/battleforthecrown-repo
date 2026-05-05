import { Hammer, Lock, X } from 'lucide-react';
import { Badge, BottomSheet, Panel, PanelBody, PanelHeader } from '@/ui';
import {
  BUILDING_UNLOCK_REQUIREMENTS,
  MAX_CONSTRUCTION_QUEUE,
  type BuildingType,
} from '@battleforthecrown/shared';
import { useBuildingQueueQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import type { BuildingDto } from '@/api';
import { BuildingCard } from './BuildingCard';

interface BuildingManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: BuildingDto[];
  onBuildingClick: (building: BuildingDto) => void;
}

interface ManagedBuilding extends BuildingDto {
  lockReason?: string;
}

const SECTION_GRID_STYLE = { animation: 'staggerFadeIn 0.6s ease-out' } as const;

function makeAnimationStyle(index: number): React.CSSProperties {
  return {
    animationDelay: `${index * 50}ms`,
    animationFillMode: 'backwards',
  };
}

export function BuildingManagementPanel({
  isOpen,
  onClose,
  buildings,
  onBuildingClick,
}: BuildingManagementPanelProps) {
  const villageId = useGameStore((state) => state.villageId);
  const { data: buildingQueue = [] } = useBuildingQueueQuery(villageId);

  const castle = buildings.find((b) => b.type === 'CASTLE');
  const castleLevel = castle?.level ?? 0;

  const buildingStatuses = buildings.map((building) => {
    const requiredCastleLevel =
      BUILDING_UNLOCK_REQUIREMENTS[building.type as BuildingType];
    const isLockedByCastle =
      building.level === 0 &&
      requiredCastleLevel !== undefined &&
      castleLevel < requiredCastleLevel;
    return { building, isLockedByCastle, requiredCastleLevel };
  });

  const availableBuildings: BuildingDto[] = buildingStatuses
    .filter(({ building, isLockedByCastle }) => building.level > 0 || !isLockedByCastle)
    .map(({ building }) => building);

  const lockedBuildings: ManagedBuilding[] = buildingStatuses
    .filter(({ building, isLockedByCastle }) => building.level === 0 && isLockedByCastle)
    .map(({ building, requiredCastleLevel }) => ({
      ...building,
      lockReason: requiredCastleLevel
        ? `Château niv. ${requiredCastleLevel} requis`
        : 'Verrouillé',
    }));

  const castleBuilding = availableBuildings.find((b) => b.type === 'CASTLE');
  const resourceBuildings = availableBuildings.filter(
    (b) => b.type === 'WOOD' || b.type === 'STONE' || b.type === 'IRON',
  );
  const infrastructureBuildings = availableBuildings.filter(
    (b) => b.type === 'WAREHOUSE' || b.type === 'FARM',
  );
  const explorationBuildings = availableBuildings.filter((b) => b.type === 'WATCHTOWER');
  const militaryBuildings = availableBuildings.filter(
    (b) => b.type === 'BARRACKS' || b.type === 'WALL',
  );

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="85vh" zIndex={50}>
        <Panel
          variant="parchment"
          padding="none"
          className="rounded-t-3xl shadow-2xl"
        >
          <PanelHeader
            variant="wood"
            className="flex items-center justify-between sticky top-0 z-10 rounded-t-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                🏗️
              </span>
              <span className="font-bold">Bâtiments</span>
              <Badge variant="warning" size="sm">
                {buildingQueue.length} / {MAX_CONSTRUCTION_QUEUE}
              </Badge>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X size={24} className="text-white" />
            </button>
          </PanelHeader>

          <PanelBody
            className="p-3 overflow-y-auto max-h-[calc(85vh-140px)] overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {availableBuildings.length > 0 && (
              <PanelHeader
                variant="info"
                className="flex items-center justify-between mb-4 rounded-lg"
              >
                <div className="flex items-center gap-2 text-white">
                  <Hammer size={20} />
                  <span className="font-cinzel font-bold">À construire</span>
                </div>
                <Badge
                  variant="default"
                  size="sm"
                  className="bg-white/20 text-white border-white/40"
                >
                  {availableBuildings.length}
                </Badge>
              </PanelHeader>
            )}

            {castleBuilding && (
              <>
                <div className="mb-4 px-1">
                  <span className="font-cinzel font-bold text-lg text-kingdom-900">
                    ⭐ Centre de Commandement
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-4 items-stretch"
                  style={SECTION_GRID_STYLE}
                >
                  <div className="mb-4 animate-fadeIn">
                    <BuildingCard building={castleBuilding} onClick={onBuildingClick} />
                  </div>
                </div>
              </>
            )}

            {resourceBuildings.length > 0 && (
              <>
                <div className="mt-1 mb-4 px-1">
                  <span className="font-cinzel font-bold text-lg text-kingdom-900">
                    📦 Ressources
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-4 items-stretch"
                  style={SECTION_GRID_STYLE}
                >
                  {resourceBuildings.map((building, index) => (
                    <div
                      key={building.id}
                      className="animate-fadeIn"
                      style={makeAnimationStyle(index)}
                    >
                      <BuildingCard building={building} onClick={onBuildingClick} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {infrastructureBuildings.length > 0 && (
              <>
                <div className="mt-4 mb-4 px-1">
                  <span className="font-cinzel font-bold text-lg text-kingdom-900">
                    🏛️ Infrastructure
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-4 items-stretch"
                  style={SECTION_GRID_STYLE}
                >
                  {infrastructureBuildings.map((building, index) => (
                    <div
                      key={building.id}
                      className="animate-fadeIn"
                      style={makeAnimationStyle(index)}
                    >
                      <BuildingCard building={building} onClick={onBuildingClick} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {explorationBuildings.length > 0 && (
              <>
                <div className="mt-4 mb-4 px-1">
                  <span className="font-cinzel font-bold text-lg text-kingdom-900">
                    🧭 Exploration
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-4 items-stretch"
                  style={SECTION_GRID_STYLE}
                >
                  {explorationBuildings.map((building, index) => (
                    <div
                      key={building.id}
                      className="animate-fadeIn"
                      style={makeAnimationStyle(index)}
                    >
                      <BuildingCard building={building} onClick={onBuildingClick} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {militaryBuildings.length > 0 && (
              <>
                <div className="mt-4 mb-4 px-1">
                  <span className="font-cinzel font-bold text-lg text-kingdom-900">
                    ⚔️ Militaire
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-4 items-stretch"
                  style={SECTION_GRID_STYLE}
                >
                  {militaryBuildings.map((building, index) => (
                    <div
                      key={building.id}
                      className="animate-fadeIn"
                      style={makeAnimationStyle(index)}
                    >
                      <BuildingCard building={building} onClick={onBuildingClick} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {lockedBuildings.length > 0 && (
              <>
                <PanelHeader
                  variant="stone"
                  className="flex items-center justify-between mt-6 mb-4 mx-1 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-white">
                    <Lock size={20} />
                    <span className="font-cinzel font-bold">À débloquer</span>
                  </div>
                  <Badge
                    variant="default"
                    size="sm"
                    className="bg-white/20 text-white border-white/40"
                  >
                    {lockedBuildings.length}
                  </Badge>
                </PanelHeader>
                <div
                  className="grid grid-cols-2 gap-4 items-stretch"
                  style={SECTION_GRID_STYLE}
                >
                  {lockedBuildings.map((building, index) => (
                    <div
                      key={building.id}
                      className="animate-fadeIn"
                      style={makeAnimationStyle(index)}
                    >
                      <BuildingCard building={building} onClick={onBuildingClick} />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 p-3 bg-game-blue-light/10 border-2 border-game-blue-border/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-xl" aria-hidden>
                  💡
                </span>
                <div>
                  <p className="font-game font-semibold text-xs text-kingdom-800 mb-1">
                    Conseil du Royaume
                  </p>
                  <p className="text-xs text-kingdom-600 leading-relaxed">
                    Améliorez le <span className="font-bold">Château</span> pour
                    débloquer de nouveaux niveaux. Développez vos{' '}
                    <span className="font-bold">ressources</span> et construisez
                    la <span className="font-bold">Caserne</span> pour former
                    une armée !
                  </p>
                </div>
              </div>
            </div>

            <div className="h-20" />
          </PanelBody>
        </Panel>
      </BottomSheet>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes staggerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
