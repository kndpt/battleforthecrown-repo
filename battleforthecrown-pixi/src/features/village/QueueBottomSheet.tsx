import { useEffect } from 'react';
import { MAX_CONSTRUCTION_QUEUE } from '@battleforthecrown/shared/village/buildings';
import { Badge, BottomSheet } from '@/ui';
import { BuildQueueCard, GameBottomSheetPanel } from '@/features/design-system/components';
import {
  useBuildingQueueQuery,
  useCancelConstructionMutation,
  useVillageBuildingsQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useTickingNow } from '@/lib/useTickingNow';
import { metaFor } from './buildingMeta';
import { rawIconFor } from './queueIcons';

interface QueueBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(milliseconds: number): string {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function QueueBottomSheet({ isOpen, onClose }: QueueBottomSheetProps) {
  const villageId = useGameStore((state) => state.villageId);
  const { data: buildingQueue = [] } = useBuildingQueueQuery(villageId);
  const { data: buildings = [] } = useVillageBuildingsQuery(villageId);
  const cancel = useCancelConstructionMutation();
  const now = useTickingNow(1_000);

  useEffect(() => {
    if (buildingQueue.length === 0 && isOpen) {
      onClose();
    }
  }, [buildingQueue.length, isOpen, onClose]);

  if (buildingQueue.length === 0) return null;

  const visibleItems = buildingQueue.slice(0, MAX_CONSTRUCTION_QUEUE);
  const idleSlots = Math.max(0, MAX_CONSTRUCTION_QUEUE - visibleItems.length);

  const handleCancel = (buildingId: string) => {
    if (!villageId) return;
    cancel.mutate({ villageId, buildingId });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="50vh" zIndex={40}>
      <GameBottomSheetPanel
        bodyClassName="flex flex-col gap-2 p-3"
        closeLabel="Fermer"
        eyebrow="Panneau"
        headerActions={(
          <Badge variant="warning" size="sm">
            {visibleItems.length} / {MAX_CONSTRUCTION_QUEUE} actifs
          </Badge>
        )}
        onClose={onClose}
        title="File de construction"
      >
        {visibleItems.map((queueItem) => {
          const startMs = Date.parse(queueItem.startTime);
          const endMs = Date.parse(queueItem.endTime);
          const isCompleted = endMs <= now;
          const timeRemaining = Math.max(0, endMs - now);
          const totalTime = Math.max(1, endMs - startMs);
          const elapsed = now - startMs;
          const progress = isCompleted ? 100 : Math.min((elapsed / totalTime) * 100, 100);

          const building = buildings.find((b) => b.id === queueItem.id);
          const currentLevel = building?.level ?? queueItem.level - 1;
          const meta = metaFor(queueItem.type);

          return (
            <BuildQueueCard
              key={`${queueItem.id}-${queueItem.startTime}`}
              icon={rawIconFor(queueItem.type, meta)}
              onCancel={isCompleted || cancel.isPending ? undefined : () => handleCancel(queueItem.id)}
              progress={progress}
              time={formatTime(timeRemaining)}
              title={`${meta.label} → Niv. ${currentLevel + 1}`}
              tone="build"
            />
          );
        })}

        {Array.from({ length: idleSlots }).map((_, index) => (
          <BuildQueueCard
            key={`idle-${index}`}
            icon="/assets/lock.png"
            title="Slot libre"
            tone="idle"
          />
        ))}
      </GameBottomSheetPanel>
    </BottomSheet>
  );
}
