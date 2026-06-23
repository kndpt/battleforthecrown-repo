import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { MS_PER_DAY } from "@battleforthecrown/shared/time";
import { usePublicWorldsQuery } from "@/api/queries";
import { useGameStore } from "@/stores/game";

interface EndedWorldViewProps {
  worldId: string;
}

function archiveCountdownLabel(
  archiveAt: string | null | undefined,
  nowMs: number,
): string | null {
  if (!archiveAt) return null;
  const days = Math.ceil((Date.parse(archiveAt) - nowMs) / MS_PER_DAY);
  if (!Number.isFinite(days)) return null;
  if (days <= 0) return "Archivage imminent.";
  return `Ce royaume reste consultable encore ${days}j avant d'être archivé.`;
}

/**
 * In-session landing for a world that has ENDED: the game is frozen
 * server-side, so instead of the interactive GameScreen we render an explicit
 * read-only state with a link to the frozen final leaderboard and an exit to
 * the world selection.
 */
export function EndedWorldView({ worldId }: EndedWorldViewProps) {
  const navigate = useNavigate();
  const clearGame = useGameStore((state) => state.clear);
  const publicWorlds = usePublicWorldsQuery();

  const world = useMemo(
    () => publicWorlds.data?.find((candidate) => candidate.id === worldId),
    [publicWorlds.data, worldId],
  );
  const worldName = world?.identity.displayName ?? "Ce royaume";
  // Capture « now » once at mount — the read-only landing is not time-critical.
  const [nowMs] = useState(() => Date.now());
  const archiveLabel = archiveCountdownLabel(world?.lifecycle.archiveAt, nowMs);

  const handleViewRankings = () => {
    void navigate(`/worlds/${worldId}/rankings/final`);
  };

  const handleChooseOther = () => {
    clearGame();
    void navigate("/worlds");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#d4c094] p-4 font-game">
      <div className="mx-auto w-full max-w-[380px] rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f3e3c2)] p-5 shadow-[0_4px_10px_rgba(60,38,25,.18)]">
        <div className="mb-4 text-center">
          <div className="mb-2 text-[28px]">🏆</div>
          <h1 className="font-game text-[17px] font-black leading-snug tracking-[.02em] text-[#3c2619]">
            {worldName} est terminé.
          </h1>
          <p className="mt-2 font-game text-[12px] leading-relaxed text-[#6d5838]">
            Plus aucune action n'est possible. Tu peux encore consulter le
            classement final et le hall of fame du monde.
          </p>
          {archiveLabel ? (
            <p className="mt-2 font-game text-[11px] font-bold leading-relaxed text-[#8a6d3b]">
              {archiveLabel}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] font-game text-[12px] font-extrabold uppercase tracking-[.08em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_3px_0_rgba(0,0,0,.2)] [text-shadow:0_1px_0_rgba(255,255,255,.35)] active:translate-y-px"
            onClick={handleViewRankings}
            type="button"
          >
            Voir le classement final
          </button>
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#fef9f0,#d8c298)] font-game text-[11px] font-extrabold uppercase tracking-[.08em] text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(60,38,25,.18)] active:translate-y-px"
            onClick={handleChooseOther}
            type="button"
          >
            Choisir un autre monde
          </button>
        </div>
      </div>
    </main>
  );
}
