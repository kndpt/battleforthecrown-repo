import { useUiStore } from '@/stores/ui';
import { useWorldMapNavigation } from '@/features/world/worldMapNavigation';
import { VictoryModal } from './VictoryModal';

export const VictoryModalHost = () => {
  const current = useUiStore((state) => state.victoryModals[0] ?? null);
  const dismissVictoryModal = useUiStore((state) => state.dismissVictoryModal);
  const { navigateToWorldMapFocus } = useWorldMapNavigation();

  if (!current) return null;

  const handleClose = () => {
    dismissVictoryModal(current.id);
  };

  const handleViewVillage = () => {
    dismissVictoryModal(current.id);
    navigateToWorldMapFocus({ x: current.x, y: current.y });
  };

  return (
    <VictoryModal
      key={current.id}
      isOpen
      villageName={current.villageName}
      x={current.x}
      y={current.y}
      onClose={handleClose}
      onViewVillage={handleViewVillage}
    />
  );
};
