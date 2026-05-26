import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@/ui';
import { Spinner } from '@/ui/spinners';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { VillageCanvas } from '@/features/village/VillageCanvas';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { BuildingManagementPanel } from '@/features/village/BuildingManagementPanel';
import { BuildingDetailModal } from '@/features/village/BuildingDetailModal';
import { QueueFloatingButton } from '@/features/village/QueueFloatingButton';
import { QueueBottomSheet } from '@/features/village/QueueBottomSheet';
import { VillageStyleControl } from '@/features/village/VillageStyleControl';
import { DailyRetentionWidget } from '@/features/retention/DailyRetentionWidget';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import { metaFor } from '@/features/village/buildingMeta';
import { KingdomActivitiesBottomSheet } from '@/features/combat/KingdomActivitiesBottomSheet';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
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
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const myVillages = useMyVillagesQuery(worldId);
  const retentionSummary = useRetentionSummaryQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const claimDailyCard = useClaimDailyCardMutation();

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDto | null>(null);
  const [isBuildingPanelOpen, setIsBuildingPanelOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  const [isExpeditionsOpen, setIsExpeditionsOpen] = useState(false);
  const [isVillageStyleOpen, setIsVillageStyleOpen] = useState(false);
  const [kingdomActivityTab, setKingdomActivityTab] =
    useState<KingdomActivityTab>('expeditions');
  const unreadCount = useUnreadReportsCount();

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
      setIsBuildingPanelOpen(false);
      setIsVillageStyleOpen(true);
      return;
    }
    setIsVillageStyleOpen(false);
    setSelectedBuilding(building);
  };

  const handleSelectResourceBuilding = (resource: 'iron' | 'stone' | 'wood') => {
    const buildingType = RESOURCE_BUILDING_BY_HEADER_RESOURCE[resource];
    const building = buildings.find((candidate) => candidate.type === buildingType);
    if (building) setSelectedBuilding(building);
  };

  const handleCloseDetail = () => {
    setSelectedBuilding(null);
  };

  const runVillageAction = (actionId: GameActionId) => {
    runGameAction(actionId, {
      navigate,
      openBuildingManagement: () => setIsBuildingPanelOpen(true),
    });
  };

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden">
    <div className="flex-shrink">
      <GameHeader
        onPowerClick={() => setIsPowerSheetOpen(true)}
        onResourceClick={handleSelectResourceBuilding}
      />
    </div>

    <div className="relative flex-1 overflow-hidden">
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

      <BottomNavigationBar
        activeTab="buildings"
        onBuildingsClick={() => setIsBuildingPanelOpen(true)}
        onArmyClick={() => navigate('/game/army')}
        onWorldClick={() => navigate('/game/world')}
        onMessagesClick={() => navigate('/game/messages')}
        unreadCount={unreadCount}
      />

      <BuildingManagementPanel
        isOpen={isBuildingPanelOpen}
        onClose={() => setIsBuildingPanelOpen(false)}
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

      <PowerBottomSheet
        isOpen={isPowerSheetOpen}
        onClose={() => setIsPowerSheetOpen(false)}
      />

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

      <ToastStack />
    </div>
  );
}
