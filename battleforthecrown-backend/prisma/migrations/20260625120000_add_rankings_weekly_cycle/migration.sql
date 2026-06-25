-- CreateTable
CREATE TABLE "glory_cycle_snapshot" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "signal" "RankingSignal" NOT NULL,
    "cycle_index" INTEGER NOT NULL,
    "cycle_start_at" TIMESTAMPTZ(3) NOT NULL,
    "cycle_end_at" TIMESTAMPTZ(3) NOT NULL,
    "closed_at" TIMESTAMPTZ(3) NOT NULL,
    "entries" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "glory_cycle_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_cycle_title_award" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "signal" "RankingSignal" NOT NULL,
    "cycle_index" INTEGER NOT NULL,
    "world_display_name" TEXT NOT NULL,
    "cycle_end_at" TIMESTAMPTZ(3) NOT NULL,
    "valid_until_at" TIMESTAMPTZ(3) NOT NULL,
    "awarded_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_cycle_title_award_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "glory_cycle_snapshot_world_id_signal_cycle_end_at_idx" ON "glory_cycle_snapshot"("world_id", "signal", "cycle_end_at");

-- CreateIndex
CREATE UNIQUE INDEX "glory_cycle_snapshot_world_signal_index_key" ON "glory_cycle_snapshot"("world_id", "signal", "cycle_index");

-- CreateIndex
CREATE INDEX "ranking_cycle_title_award_user_id_valid_until_at_idx" ON "ranking_cycle_title_award"("user_id", "valid_until_at");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_cycle_title_award_user_world_signal_index_key" ON "ranking_cycle_title_award"("user_id", "world_id", "signal", "cycle_index");

-- AddForeignKey
ALTER TABLE "glory_cycle_snapshot" ADD CONSTRAINT "glory_cycle_snapshot_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_cycle_title_award" ADD CONSTRAINT "ranking_cycle_title_award_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

