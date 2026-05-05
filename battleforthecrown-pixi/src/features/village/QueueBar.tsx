import { X } from 'lucide-react';
import { IconButton, Panel, ProgressBar } from '@/ui';
import { useBuildingQueueQuery, useCancelConstructionMutation } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';

const MAX_VISIBLE = 5;

export function QueueBar() {
  const villageId = useGameStore((state) => state.villageId);
  const queueQuery = useBuildingQueueQuery(villageId);
  const cancel = useCancelConstructionMutation();
  const now = useTickingNow(1_000);

  const queue = queueQuery.data ?? [];

  if (!villageId) return null;

  return (
    <div className="pointer-events-auto">
      <Panel variant="stone" padding="md" className="shadow-lg">
        <div className="flex items-center justify-between text-game-gold-light mb-2">
          <span className="font-cinzel text-xs uppercase tracking-widest">
            File de construction
          </span>
          <span className="font-cinzel font-bold tabular-nums text-xs">{queue.length}/3</span>
        </div>
        {queue.length === 0 ? (
          <p className="text-xs text-white/70 font-game">Aucun bâtiment en cours.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {queue.slice(0, MAX_VISIBLE).map((entry) => {
              const meta = metaFor(entry.type);
              const progress = computeConstructionProgress(
                { startTime: entry.startTime, endTime: entry.endTime },
                now,
              );
              const isOptimistic = entry.id.startsWith('optimistic-');
              return (
                <li
                  key={entry.id}
                  className="flex min-w-[200px] items-center gap-2 rounded border border-[#3d2f1f] bg-black/30 px-2 py-1.5"
                >
                  {meta.iconPath ? (
                    <img
                      src={meta.iconPath}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      className="h-7 w-7 object-contain drop-shadow"
                    />
                  ) : (
                    <span aria-hidden className="text-2xl leading-none">
                      {meta.emoji}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-cinzel text-[11px] uppercase tracking-widest text-game-gold-light truncate">
                      {meta.label} {entry.level > 0 && `→ ${entry.level}`}
                    </p>
                    <ProgressBar
                      value={isOptimistic ? 5 : progress.percent}
                      variant="success"
                      size="sm"
                      animated={!isOptimistic}
                    />
                    <p className="mt-0.5 text-[10px] text-white/70 font-game">
                      {isOptimistic ? 'Envoi…' : formatRemaining(progress.remainingMs)}
                    </p>
                  </div>
                  {!isOptimistic && (
                    <IconButton
                      size="xs"
                      variant="danger"
                      icon={X}
                      label={`Annuler ${meta.label}`}
                      onClick={() => cancel.mutate({ villageId, buildingId: entry.id })}
                      disabled={cancel.isPending}
                    />
                  )}
                </li>
              );
            })}
            {queue.length > MAX_VISIBLE && (
              <li className="self-center text-white/70 text-xs font-game">
                +{queue.length - MAX_VISIBLE}…
              </li>
            )}
          </ul>
        )}
      </Panel>
    </div>
  );
}
