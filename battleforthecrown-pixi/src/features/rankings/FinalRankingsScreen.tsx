import { useNavigate, useParams } from "react-router";
import type {
  WorldFinalRankingLeaderboard,
  WorldFinalRankingSnapshotEntry,
} from "@battleforthecrown/shared/rankings";
import { useFinalRankingsQuery } from "@/api/queries";
import { useAuthStore } from "@/stores/auth";
import {
  EmptyState,
  LeaderboardHeader,
  LeaderboardRow,
  type LeaderboardRankTone,
} from "@/features/design-system/components";
import { Button, Panel, Spinner } from "@/ui";
import { formatScore } from "./rankingsFormat";

function rankTone(rank: number): LeaderboardRankTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}

function FinalBoardSection({
  board,
  currentUserId,
}: {
  board: WorldFinalRankingLeaderboard;
  currentUserId: string | null;
}) {
  return (
    <section className="px-2 pt-2">
      <div className="px-0.5 pb-1 pt-1">
        <h2 className="font-game text-sm font-extrabold tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
          {board.label}
        </h2>
      </div>
      {board.entries.length === 0 ? (
        <Panel className="text-white" padding="md" variant="stone">
          Aucun héraut classé sur ce signal.
        </Panel>
      ) : (
        <div className="flex flex-col gap-1">
          <LeaderboardHeader deltaLabel="" scoreLabel="Score" />
          {board.entries.map((entry: WorldFinalRankingSnapshotEntry) => {
            const self = entry.userId === currentUserId;
            return (
              <LeaderboardRow
                avatarIcon="assets/crown.png"
                avatarTone={self ? "gold" : "default"}
                key={`${board.signal}-${entry.userId}`}
                name={entry.playerName}
                points={formatScore(entry.score)}
                rank={entry.rank}
                rankTone={rankTone(entry.rank)}
                scoreLabel="pts"
                self={self}
                subtitle="Seigneur du royaume"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export function FinalRankingsScreen() {
  const navigate = useNavigate();
  const { worldId = null } = useParams<{ worldId: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const finalRankings = useFinalRankingsQuery(worldId);
  const boards = finalRankings.data?.leaderboards ?? [];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)]">
      {/* Header strip — dark wood, with a back affordance */}
      <div className="flex items-center gap-2 border-b-2 border-black/55 bg-[linear-gradient(to_bottom,rgba(45,28,14,.98),rgba(65,44,26,.98))] px-2.5 py-2">
        <Button
          onClick={() => navigate("/worlds")}
          size="xs"
          variant="neutral"
        >
          ← Royaumes
        </Button>
        <h1 className="font-game text-sm font-extrabold tracking-[.02em] text-parchment">
          Hall of fame · Classement final
        </h1>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain pb-24"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {finalRankings.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : finalRankings.isError ? (
          <div className="px-2 pt-3">
            <EmptyState
              grayscale
              icon="assets/crown.png"
              quote="Le hall of fame n'est gravé qu'une fois le monde achevé."
              title="Classement final indisponible"
            />
          </div>
        ) : boards.length === 0 ? (
          <div className="px-2 pt-3">
            <EmptyState
              grayscale
              icon="assets/crown.png"
              quote="Nul héraut n'a encore été couronné."
              title="Aucun classement"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {boards.map((board) => (
              <FinalBoardSection
                board={board}
                currentUserId={currentUserId}
                key={board.signal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
