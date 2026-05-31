import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BottomSheet } from '@/ui';
import { Spinner } from '@/ui/spinners';
import { VillageCanvas } from '@/features/village/VillageCanvas';
import { useGameShellResourceClick } from '@/features/layout/GameShellLayoutContext';
import { BuildingManagementPanel } from '@/features/village/BuildingManagementPanel';
import { BuildingDetailModal } from '@/features/village/BuildingDetailModal';
import { QueueFloatingButton } from '@/features/village/QueueFloatingButton';
import { QueueBottomSheet } from '@/features/village/QueueBottomSheet';
import { VillageStyleControl } from '@/features/village/VillageStyleControl';
import { DailyRetentionWidget } from '@/features/retention/DailyRetentionWidget';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import {
  isBuildingsPanelSearchOpen,
  withBuildingsPanelSearch,
  withoutBuildingsPanelSearch,
} from '@/features/game/gamePanelSearch';
import { metaFor } from '@/features/village/buildingMeta';
import { KingdomActivitiesBottomSheet } from '@/features/combat/KingdomActivitiesBottomSheet';
import {
  useClaimDailyCardMutation,
  useMyVillagesQuery,
  useOnboardingSummaryQuery,
  useRetentionSummaryQuery,
  useVillageBuildingsQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import type { BuildingDto } from '@/api';
import type { KingdomActivityTab } from '@/features/design-system/components';
import { BUILDING_TYPES, type BuildingType } from '@battleforthecrown/shared/village/buildings';

const RESOURCE_BUILDING_BY_HEADER_RESOURCE: Record<'iron' | 'stone' | 'wood', BuildingType> = {
  iron: BUILDING_TYPES.IRON,
  stone: BUILDING_TYPES.STONE,
  wood: BUILDING_TYPES.WOOD,
};

function VillageCanvasFrame({
  villageId,
  buildings,
  onSelectBuilding,
}: {
  villageId: string;
  buildings: BuildingDto[];
  onSelectBuilding: (building: BuildingDto) => void;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <VillageCanvas
        villageId={villageId}
        buildings={buildings}
        onSelectBuilding={onSelectBuilding}
      />
    </div>
  );
}

export function VillageView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const myVillages = useMyVillagesQuery(worldId);
  const retentionSummary = useRetentionSummaryQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const claimDailyCard = useClaimDailyCardMutation();

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDto | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isExpeditionsOpen, setIsExpeditionsOpen] = useState(false);
  const [isVillageStyleOpen, setIsVillageStyleOpen] = useState(false);
  const [kingdomActivityTab, setKingdomActivityTab] =
    useState<KingdomActivityTab>('expeditions');
  const isBuildingPanelOpen = isBuildingsPanelSearchOpen(searchParams);

  const buildings = useMemo(() => {
    return [...(buildingsQuery.data ?? [])].sort(
      (a, b) =>
        metaFor(a.type).sortKey - metaFor(b.type).sortKey || a.type.localeCompare(b.type),
    );
  }, [buildingsQuery.data]);
  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data);

  const handleSelectBuilding = (building: BuildingDto) => {
    if (building.type === BUILDING_TYPES.COUNCIL_HALL && building.level >= 1 && !building.isUnderConstruction) {
      setSelectedBuilding(null);
      setIsVillageStyleOpen(true);
      return;
    }
    setIsVillageStyleOpen(false);
    setSelectedBuilding(building);
  };

  const handleSelectResourceBuilding = useCallback((resource: 'iron' | 'stone' | 'wood') => {
    const buildingType = RESOURCE_BUILDING_BY_HEADER_RESOURCE[resource];
    const building = buildings.find((candidate) => candidate.type === buildingType);
    if (building) setSelectedBuilding(building);
  }, [buildings]);

  useGameShellResourceClick(handleSelectResourceBuilding);

  const handleCloseDetail = () => {
    setSelectedBuilding(null);
  };

  const runVillageAction = (actionId: GameActionId) => {
    runGameAction(actionId, {
      navigate,
      openBuildingManagement: () => {
        setSearchParams((current) => withBuildingsPanelSearch(current));
      },
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative h-full overflow-hidden">
        <div className="absolute right-4 top-4 z-30">
          <DailyRetentionWidget
            activeVillageId={villageId}
            isClaiming={claimDailyCard.isPending}
            isLoading={retentionSummary.isLoading}
            onClaim={(input) => claimDailyCard.mutate(input)}
            onAction={runVillageAction}
            onNavigate={navigate}
            summary={retentionSummary.data}
            villages={myVillages.data ?? []}
          />
        </div>
        <OnboardingGuidance
          guidance={onboardingGuidance}
          isLoading={onboardingSummary.isLoading || !villageId || buildingsQuery.isLoading}
          onAction={runVillageAction}
          onNavigate={navigate}
        />

        {!villageId ? (
          <div className="h-full flex items-center justify-center text-kingdom-700 font-game text-sm">
            Pas de village actif.
          </div>
        ) : buildingsQuery.isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <VillageCanvasFrame
            villageId={villageId}
            buildings={buildings}
            onSelectBuilding={handleSelectBuilding}
          />
        )}
      </div>

      <BuildingManagementPanel
        isOpen={isBuildingPanelOpen}
        onClose={() => {
          setSearchParams((current) => withoutBuildingsPanelSearch(current), { replace: true });
        }}
        buildings={buildings}
        onBuildingClick={handleSelectBuilding}
      />

      <div className="fixed bottom-28 right-4 z-30">
        <QueueFloatingButton
          isOpen={isQueueOpen}
          onToggle={() => setIsQueueOpen((prev) => !prev)}
        />
      </div>

      {villageId && (
        <VillageStyleControl
          villageId={villageId}
          buildings={buildings}
          open={isVillageStyleOpen}
          onOpenChange={setIsVillageStyleOpen}
        />
      )}

      <QueueBottomSheet
        isOpen={isQueueOpen && !isBuildingPanelOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {selectedBuilding && villageId && (
        <BuildingDetailModal
          villageId={villageId}
          building={selectedBuilding}
          onClose={handleCloseDetail}
        />
      )}

      <BottomSheet
        isOpen={isExpeditionsOpen}
        onClose={() => setIsExpeditionsOpen(false)}
        maxHeight="82vh"
      >
        <KingdomActivitiesBottomSheet
          activeTab={kingdomActivityTab}
          onClose={() => setIsExpeditionsOpen(false)}
          onTabChange={setKingdomActivityTab}
          worldId={worldId}
        />
      </BottomSheet>
    </div>
  );
}
