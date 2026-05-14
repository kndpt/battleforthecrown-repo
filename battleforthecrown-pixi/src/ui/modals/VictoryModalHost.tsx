import { useNavigate } from 'react-router';
import { useUiStore } from '@/stores/ui';
import { useWorldMapStore } from '@/stores/worldMap';
import { VictoryModal } from './VictoryModal';

export const VictoryModalHost = () => {
  const navigate = useNavigate();
  const current = useUiStore((state) => state.victoryModals[0] ?? null);
  const dismissVictoryModal = useUiStore((state) => state.dismissVictoryModal);
  const setPendingFocus = useWorldMapStore((state) => state.setPendingFocus);

  if (!current) return null;

  const handleClose = () => {
    dismissVictoryModal(current.id);
  };

  const handleViewVillage = () => {
    setPendingFocus({ x: current.x, y: current.y });
    dismissVictoryModal(current.id);
    navigate('/game/world');
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
