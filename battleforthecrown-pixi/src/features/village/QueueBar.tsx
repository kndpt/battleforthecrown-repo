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
    <div className="pointer-events-auto rounded-md border-2 border-game-gold-border bg-black/70 px-3 py-2 text-xs text-white shadow-game-inset">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-game-gold-light">
        <span>File de construction</span>
        <span>{queue.length}/3</span>
      </div>
      {queue.length === 0 ? (
        <p className="text-parchment/60">Aucun bâtiment en cours.</p>
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
                className="flex min-w-[180px] items-center gap-2 rounded border border-game-gold-border/60 bg-[#2a1f12]/80 px-2 py-1.5"
              >
                <span aria-hidden className="text-lg">
                  {meta.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-game text-[11px] uppercase tracking-widest text-game-gold-light">
                    {meta.label} {entry.level > 0 && `→ ${entry.level}`}
                  </p>
                  <div className="mt-1 h-1 w-full rounded bg-black/50">
                    <div
                      className="h-1 rounded bg-game-green-light"
                      style={{ width: `${isOptimistic ? 5 : progress.percent.toFixed(1)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-parchment/70">
                    {isOptimistic ? 'Envoi…' : formatRemaining(progress.remainingMs)}
                  </p>
                </div>
                {!isOptimistic && (
                  <button
                    type="button"
                    onClick={() => cancel.mutate({ villageId, buildingId: entry.id })}
                    disabled={cancel.isPending}
                    className="text-[10px] uppercase tracking-widest text-game-red-light hover:text-white disabled:opacity-50"
                    aria-label={`Annuler ${meta.label}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            );
          })}
          {queue.length > MAX_VISIBLE && (
            <li className="text-parchment/70">+{queue.length - MAX_VISIBLE}…</li>
          )}
        </ul>
      )}
    </div>
  );
}
