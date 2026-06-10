CREATE TYPE "RankingSignal" AS ENUM ('ASSAULT_GLORY', 'RAMPART_GLORY');

ALTER TABLE "expedition"
ADD COLUMN "attacker_kingdom_power_snapshot" INTEGER,
ADD COLUMN "defender_kingdom_power_snapshot" INTEGER;

CREATE TABLE "glory_ledger" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "signal" "RankingSignal" NOT NULL,
    "scorer_user_id" TEXT NOT NULL,
    "opponent_user_id" TEXT NOT NULL,
    "pair_key" TEXT NOT NULL,
    "combat_report_id" TEXT NOT NULL,
    "raw_points" INTEGER NOT NULL,
    "pair_raw_points_24h_before" INTEGER NOT NULL DEFAULT 0,
    "effective_raw_points" INTEGER NOT NULL,
    "opponent_multiplier" DOUBLE PRECISION NOT NULL,
    "points" INTEGER NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "glory_ledger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "glory_ledger_combat_report_id_signal_scorer_user_id_key" ON "glory_ledger"("combat_report_id", "signal", "scorer_user_id");
CREATE INDEX "glory_ledger_world_id_signal_occurred_at_idx" ON "glory_ledger"("world_id", "signal", "occurred_at");
CREATE INDEX "glory_ledger_world_id_signal_scorer_user_id_idx" ON "glory_ledger"("world_id", "signal", "scorer_user_id");
CREATE INDEX "glory_ledger_world_id_pair_key_occurred_at_idx" ON "glory_ledger"("world_id", "pair_key", "occurred_at");

ALTER TABLE "glory_ledger" ADD CONSTRAINT "glory_ledger_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "glory_ledger" ADD CONSTRAINT "glory_ledger_scorer_user_id_fkey" FOREIGN KEY ("scorer_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "glory_ledger" ADD CONSTRAINT "glory_ledger_combat_report_id_fkey" FOREIGN KEY ("combat_report_id") REFERENCES "combat_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
