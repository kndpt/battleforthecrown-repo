import { Hammer } from 'lucide-react';
import { FloatingButton } from '@/ui';
import { useBuildingQueueQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';

interface QueueFloatingButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function QueueFloatingButton({ isOpen: _isOpen, onToggle }: QueueFloatingButtonProps) {
  const villageId = useGameStore((state) => state.villageId);
  const { data: buildingQueue = [] } = useBuildingQueueQuery(villageId);

  if (buildingQueue.length === 0) return null;

  return (
    <FloatingButton
      variant="warning"
      shape="round"
      size="lg"
      icon={<Hammer size={24} />}
      badge={buildingQueue.length}
      onClick={onToggle}
      className="hover:scale-105 transition-transform"
      style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
    />
  );
}
