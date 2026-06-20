-- CreateEnum
CREATE TYPE "FinalRankingSignal" AS ENUM ('POWER', 'ASSAULT_GLORY', 'RAMPART_GLORY');

-- CreateTable
CREATE TABLE "world_final_ranking_snapshot" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "signal" "FinalRankingSignal" NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "snapshot_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_final_ranking_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "world_final_ranking_snapshot_world_id_signal_rank_idx" ON "world_final_ranking_snapshot"("world_id", "signal", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "world_final_ranking_snapshot_world_signal_user_key" ON "world_final_ranking_snapshot"("world_id", "signal", "user_id");

-- AddForeignKey
ALTER TABLE "world_final_ranking_snapshot" ADD CONSTRAINT "world_final_ranking_snapshot_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_final_ranking_snapshot" ADD CONSTRAINT "world_final_ranking_snapshot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
