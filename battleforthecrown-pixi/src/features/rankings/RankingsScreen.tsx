import { useState } from "react";
import type {
  RankingCycleCurrent,
  RankingsLeaderboardEntry,
  RankingsLeaderboardResponse,
} from "@battleforthecrown/shared/rankings";
import { useRankingCyclesQuery, useRankingsSummaryQuery } from "@/api/queries";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import {
  EmptyState,
  LeaderboardHeader,
  LeaderboardRow,
  SegmentedControl,
  type LeaderboardRankTone,
  type SegmentedControlOption,
} from "@/features/design-system/components";
import { Panel } from "@/ui";
import { formatScore } from "./rankingsFormat";

type Category = "puissance" | "gloire";
type GlorySub = "assaut" | "rempart";
type GloryPeriod = "WEEKLY" | "ALL_TIME";

const CATEGORY_OPTIONS: SegmentedControlOption[] = [
  { value: "puissance", label: "Puissance", icon: "assets/army-power.png" },
  { value: "gloire", label: "Gloire de Combat", icon: "assets/hand-red.png" },
];

const SUB_OPTIONS: SegmentedControlOption[] = [
  { value: "assaut", label: "Gloire d'Assaut", icon: "assets/hand-red.png" },
  {
    value: "rempart",
    label: "Gloire du Rempart",
    icon: "assets/hand-silver.png",
  },
];

const PERIOD_OPTIONS: SegmentedControlOption[] = [
  { value: "WEEKLY", label: "7 jours" },
  { value: "ALL_TIME", label: "Global" },
];

function rankTone(rank: number): LeaderboardRankTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}

function entrySubtitle(entry: RankingsLeaderboardEntry): string {
  if (entry.villageCount == null) return "Seigneur du royaume";
  return `${entry.villageCount} village${entry.villageCount > 1 ? "s" : ""}`;
}

function findBoard(
  boards: RankingsLeaderboardResponse[],
  signal: string,
  period: string,
): RankingsLeaderboardResponse | null {
  return (
    boards.find(
      (board) => board.signal === signal && board.period === period,
    ) ?? null
  );
}

const cycleDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  // Cycle boundaries are anchored to Monday 00:00 UTC — format in UTC so the
  // banner shows the right day regardless of the viewer's timezone.
  timeZone: "UTC",
});

function formatCycleDate(iso: string): string {
  return cycleDateFormatter.format(new Date(iso));
}

export function RankingsScreen() {
  const worldId = useGameStore((state) => state.worldId);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const rankings = useRankingsSummaryQuery(worldId);
  const cycles = useRankingCyclesQuery(worldId);
  const boards = rankings.data?.leaderboards ?? [];

  const [category, setCategory] = useState<Category>("puissance");
  const [sub, setSub] = useState<GlorySub>("assaut");
  const [period, setPeriod] = useState<GloryPeriod>("WEEKLY");

  const signal =
    category === "puissance"
      ? "POWER"
      : sub === "assaut"
        ? "ASSAULT_GLORY"
        : "RAMPART_GLORY";
  const cycle =
    category === "gloire"
      ? (cycles.data?.cycles.find((entry) => entry.signal === signal) ?? null)
      : null;
  const activePeriod = category === "puissance" ? "LIVE" : period;
  const board = findBoard(boards, signal, activePeriod);

  const title =
    category === "puissance"
      ? "Puissance du Royaume"
      : sub === "assaut"
        ? "Gloire d'Assaut"
        : "Gloire du Rempart";
  const headerScoreLabel = category === "puissance" ? "Puissance" : "Gloire";
  const rowScoreLabel = category === "puissance" ? "pts" : sub;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)]">
      {/* Category strip — dark wood */}
      <div className="border-b-2 border-black/55 bg-[linear-gradient(to_bottom,rgba(45,28,14,.98),rgba(65,44,26,.98))] px-2.5 py-2">
        <SegmentedControl
          ariaLabel="Catégorie de classement"
          block
          onChange={(value) => setCategory(value as Category)}
          options={CATEGORY_OPTIONS}
          tone="dark"
          value={category}
        />
      </div>

      {/* Scrollable list — no horizontal padding so filter bands stay full-bleed */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain pb-24"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {category === "gloire" ? (
          <GloireControls
            onPeriod={setPeriod}
            onSub={setSub}
            period={period}
            sub={sub}
          />
        ) : null}

        <div className="px-2 pt-2">
          {cycle && period === "WEEKLY" ? <CycleBanner cycle={cycle} /> : null}

          <div className="px-0.5 pb-1 pt-1">
            <h1 className="font-game text-sm font-extrabold tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
              {title}
            </h1>
          </div>

          {rankings.isLoading ? (
            <SkeletonList />
          ) : rankings.isError ? (
            <Panel className="text-white" padding="lg" variant="stone">
              Impossible de charger les classements pour le moment.
            </Panel>
          ) : !board || board.entries.length === 0 ? (
            <EmptyState
              grayscale
              icon="assets/crown.png"
              quote="À ceux qui osent, le royaume offre gloire et richesses."
              title="Aucun héraut au tableau"
            />
          ) : (
            <div className="flex flex-col gap-1">
              <LeaderboardHeader deltaLabel="" scoreLabel={headerScoreLabel} />
              {board.entries.map((entry) => {
                const self = entry.userId === currentUserId;
                return (
                  <LeaderboardRow
                    avatarIcon="assets/crown.png"
                    avatarTone={self ? "gold" : "default"}
                    key={entry.userId}
                    name={entry.playerName}
                    points={formatScore(entry.score)}
                    rank={entry.rank}
                    rankTone={rankTone(entry.rank)}
                    scoreLabel={rowScoreLabel}
                    self={self}
                    subtitle={entrySubtitle(entry)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CycleBanner({ cycle }: { cycle: RankingCycleCurrent }) {
  const [showLast, setShowLast] = useState(false);
  const last = cycle.lastClosedSnapshot;
  const top = last?.topEntries ?? [];
  const weekLabel = cycle.cycleIndex >= 1 ? `Semaine ${cycle.cycleIndex}` : "Pré-saison";

  return (
    <div className="mb-2 rounded-[12px] border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fff3d6,#f0dcae)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.12)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-game text-[11px] font-extrabold uppercase tracking-[.08em] text-[#3d2f1f]">
          {weekLabel}
        </span>
        <span className="font-game text-[9.5px] text-[#6d5838]">
          Clôture le {formatCycleDate(cycle.cycleEndAt)}
        </span>
      </div>
      <div className="mt-1 font-game text-[11px] text-[#6d5838]">
        Meneur ·{" "}
        <b className="text-[#3d2f1f]">
          {cycle.leaderName ?? "Aucun prétendant"}
        </b>
      </div>
      {last && top.length > 0 ? (
        <>
          <button
            className="mt-1.5 cursor-pointer font-game text-[9.5px] font-bold uppercase tracking-[.1em] text-[#8a6a1e] underline"
            onClick={() => setShowLast((value) => !value)}
            type="button"
          >
            {showLast ? "Masquer" : `Voir le champion sortant (Semaine ${last.cycleIndex})`}
          </button>
          {showLast ? (
            <div className="mt-1.5 flex flex-col gap-1 border-t border-[rgba(158,123,13,.3)] pt-1.5">
              {top.map((entry) => (
                <div
                  className="flex items-center justify-between font-game text-[10.5px] text-[#3d2f1f]"
                  key={entry.userId}
                >
                  <span>
                    <b>#{entry.rank}</b> {entry.displayName}
                  </span>
                  <span className="tabular-nums text-[#6d5838]">
                    {formatScore(entry.score)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

interface GloireControlsProps {
  onPeriod: (period: GloryPeriod) => void;
  onSub: (sub: GlorySub) => void;
  period: GloryPeriod;
  sub: GlorySub;
}

function GloireControls({ onPeriod, onSub, period, sub }: GloireControlsProps) {
  const periodLabel =
    period === "WEEKLY" ? "7 derniers jours" : "Monde entier · Tout temps";

  return (
    <div className="flex flex-col gap-2 border-b border-[rgba(93,74,50,.22)] bg-[linear-gradient(to_bottom,rgba(93,74,50,.18),rgba(93,74,50,.06))] px-2.5 pb-2.5 pt-2.5">
      <SegmentedControl
        ariaLabel="Type de gloire"
        block
        onChange={(value) => onSub(value as GlorySub)}
        options={SUB_OPTIONS}
        value={sub}
      />
      <div className="flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase tracking-[.12em] text-[#6d5838]">
          {periodLabel}
        </span>
        <SegmentedControl
          ariaLabel="Période du classement"
          onChange={(value) => onPeriod(value as GloryPeriod)}
          options={PERIOD_OPTIONS}
          size="compact"
          value={period}
        />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-1 pt-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="grid grid-cols-[42px_1fr_auto] items-center gap-2.5 rounded-[10px] border-2 border-[#c9b88a] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.4)]"
          key={index}
        >
          <div className="size-[30px] animate-pulse rounded-full bg-[#e0cda0]" />
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-lg bg-[#e0cda0]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#e0cda0]" />
              <div className="h-2 w-1/4 animate-pulse rounded bg-[#e0cda0]" />
            </div>
          </div>
          <div className="h-7 w-16 animate-pulse rounded-lg bg-[#e0cda0]" />
        </div>
      ))}
    </div>
  );
}
