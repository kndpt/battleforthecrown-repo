import { useEffect } from 'react';
import { Hammer, X, XCircle, Zap } from 'lucide-react';
import {
  Badge,
  BottomSheet,
  Button,
  IconButton,
  Panel,
  PanelBody,
  PanelHeader,
  ProgressBar,
  Tooltip,
} from '@/ui';
import {
  useBuildingQueueQuery,
  useCancelConstructionMutation,
  useVillageBuildingsQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useTickingNow } from '@/lib/useTickingNow';
import { metaFor } from './buildingMeta';

interface QueueBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(milliseconds: number): string {
  const safeMs = Math.max(0, milliseconds);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
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

  const visibleItems = buildingQueue.slice(0, 3);
  const remainingCount = Math.max(0, buildingQueue.length - 3);

  const handleCancel = (buildingId: string) => {
    if (!villageId) return;
    cancel.mutate({ villageId, buildingId });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="50vh" zIndex={40}>
      <Panel variant="parchment" padding="none" className="rounded-t-2xl shadow-2xl">
        <PanelHeader
          variant="wood"
          className="flex items-center justify-between sticky top-0 z-10 rounded-t-2xl"
        >
          <div className="flex items-center gap-2">
            <Hammer size={18} className="text-white" />
            <span className="font-bold">Constructions actives</span>
            <Badge variant="warning" size="sm">
              {buildingQueue.length} / 3
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X size={24} className="text-white" />
          </button>
        </PanelHeader>

        <PanelBody className="p-4 space-y-3 overflow-y-auto">
          {visibleItems.map((queueItem, index) => {
            const startMs = Date.parse(queueItem.startTime);
            const endMs = Date.parse(queueItem.endTime);
            const isCurrentlyBuilding = index === 0;
            const isCompleted = endMs <= now;
            const timeRemaining = Math.max(0, endMs - now);
            const totalTime = Math.max(1, endMs - startMs);
            const elapsed = now - startMs;
            const progress = isCompleted
              ? 100
              : Math.min((elapsed / totalTime) * 100, 100);

            const building = buildings.find((b) => b.id === queueItem.id);
            const currentLevel = building?.level ?? queueItem.level - 1;
            const meta = metaFor(queueItem.type);

            return (
              <div
                key={`${queueItem.id}-${queueItem.startTime}`}
                className={`border rounded-lg p-3 transition-all ${
                  isCurrentlyBuilding
                    ? 'border-kingdom-300 bg-kingdom-50'
                    : 'border-gray-200 bg-gray-50'
                } ${isCompleted ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {meta.iconPath ? (
                      <div className="relative h-8 w-8 flex-shrink-0 rounded overflow-hidden">
                        <img
                          src={meta.iconPath}
                          alt={meta.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span aria-hidden className="text-2xl">
                        {meta.emoji}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-kingdom-800">
                          {meta.label}
                        </span>
                        <Badge variant="success" size="sm">
                          En cours
                        </Badge>
                      </div>
                      <div className="text-xs text-kingdom-600">
                        Niv. {currentLevel} → {currentLevel + 1}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <div className="text-sm font-bold text-kingdom-700">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-xs text-kingdom-500">{progress.toFixed(1)}%</div>
                    </div>
                    <Tooltip content="Annuler la construction" variant="error" position="left">
                      <IconButton
                        icon={XCircle}
                        variant="danger"
                        size="sm"
                        label="Annuler la construction"
                        disabled={isCompleted || cancel.isPending}
                        onClick={() => handleCancel(queueItem.id)}
                        className="shadow-lg"
                      />
                    </Tooltip>
                  </div>
                </div>

                <ProgressBar
                  value={progress}
                  variant={isCompleted ? 'success' : 'warning'}
                  size="sm"
                  animated={!isCompleted}
                />
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div className="text-center py-2">
              <Badge variant="neutral" size="md">
                +{remainingCount} construction{remainingCount > 1 ? 's' : ''} en attente
              </Badge>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button
              variant="neutral"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed flex items-center gap-1"
            >
              <Zap size={14} />
              Booster (bientôt disponible)
            </Button>
          </div>
        </PanelBody>
      </Panel>
    </BottomSheet>
  );
}
