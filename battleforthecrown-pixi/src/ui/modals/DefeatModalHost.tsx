import { useUiStore, type DefeatModalItem } from '@/stores/ui';
import { useWorldMapNavigation } from '@/features/world/worldMapNavigation';
import { useMarkReportReadMutation } from '@/api/queries';
import { useDefeatCarouselHydration } from '@/features/combat/useDefeatCarouselHydration';
import { DefeatModal } from './DefeatModal';

export const DefeatModalHost = () => {
  // Runs unconditionally (before the early return) so the carousel hydrates from
  // unread reports even before the first item exists.
  useDefeatCarouselHydration();

  const items = useUiStore((state) => state.defeatItems);
  const activeIndex = useUiStore((state) => state.defeatActiveIndex);
  const acknowledgeDefeatItem = useUiStore((state) => state.acknowledgeDefeatItem);
  const setDefeatActiveIndex = useUiStore((state) => state.setDefeatActiveIndex);
  const { navigateToWorldMapFocus } = useWorldMapNavigation();
  const markRead = useMarkReportReadMutation();

  if (items.length === 0) return null;

  const acknowledge = (item: DefeatModalItem) => {
    // Server-authoritative ack: persist readByDefender so the modal never
    // reappears after refresh. Live-only items (no reportId yet) are backfilled
    // by the hydration hook within ~1s of the WS event.
    if (item.reportId) {
      markRead.mutate({ reportId: item.reportId });
    }
    acknowledgeDefeatItem(item.id);
  };

  const handleViewVillage = (item: DefeatModalItem) => {
    acknowledge(item);
    navigateToWorldMapFocus({ x: item.x, y: item.y });
  };

  return (
    <DefeatModal
      isOpen
      items={items}
      activeIndex={activeIndex}
      onIndexChange={setDefeatActiveIndex}
      onAcknowledge={acknowledge}
      onViewVillage={handleViewVillage}
    />
  );
};
