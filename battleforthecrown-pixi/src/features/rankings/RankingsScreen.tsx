import { Trophy } from "lucide-react";
import { useRankingsSummaryQuery } from "@/api/queries";
import { useGameStore } from "@/stores/game";
import { Panel, Spinner } from "@/ui";
import { formatScore, periodLabel } from "./rankingsFormat";

export function RankingsScreen() {
  const worldId = useGameStore((state) => state.worldId);
  const rankings = useRankingsSummaryQuery(worldId);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div
        className="flex-1 overflow-y-auto pb-24 overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <main className="container mx-auto max-w-3xl px-3 py-4">
          <div className="mb-4 flex items-center gap-3 text-kingdom-900">
            <div className="grid size-11 place-items-center rounded-2xl bg-game-gold/20 text-game-gold shadow-inner">
              <Trophy className="size-6" />
            </div>
            <div>
              <h1 className="font-cinzel text-2xl font-bold">Classements</h1>
              <p className="text-sm text-kingdom-700">
                Puissance live et gloires PvP publiques du monde.
              </p>
            </div>
          </div>

          {rankings.isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : null}

          {rankings.isError ? (
            <Panel variant="stone" padding="lg" className="text-white">
              Impossible de charger les classements pour le moment.
            </Panel>
          ) : null}

          <div className="grid gap-4">
            {(rankings.data?.leaderboards ?? []).map((board) => (
              <Panel
                key={`${board.signal}-${board.period}`}
                padding="lg"
                className="shadow-xl"
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="font-cinzel text-lg font-bold text-kingdom-900">
                    {board.label}
                  </h2>
                  <span className="rounded-full bg-kingdom-100 px-2 py-1 text-xs font-semibold text-kingdom-700">
                    {periodLabel(board.period)}
                  </span>
                </div>

                {board.entries.length === 0 ? (
                  <p className="text-sm text-kingdom-600">
                    Aucun score pour l'instant.
                  </p>
                ) : (
                  <ol className="divide-y divide-kingdom-100">
                    {board.entries.map((entry) => (
                      <li
                        key={entry.userId}
                        className="flex items-center gap-3 py-2"
                      >
                        <span className="w-8 text-center font-cinzel text-lg font-bold text-game-gold">
                          #{entry.rank}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-kingdom-900">
                          {entry.playerName}
                        </span>
                        <span className="tabular-nums font-bold text-kingdom-900">
                          {formatScore(entry.score)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
