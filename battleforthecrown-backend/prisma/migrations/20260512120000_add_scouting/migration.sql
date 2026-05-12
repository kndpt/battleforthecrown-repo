ALTER TYPE "ExpeditionKind" ADD VALUE IF NOT EXISTS 'SCOUT';

CREATE TABLE "scout_report" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "scout_village_id" TEXT NOT NULL,
    "scout_user_id" TEXT NOT NULL,
    "target_village_id" TEXT,
    "target_kind" "TargetKind" NOT NULL,
    "target_x" INTEGER NOT NULL,
    "target_y" INTEGER NOT NULL,
    "target_name" TEXT,
    "target_tier" TEXT,
    "units" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "strategy" "VillageStrategy",
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB NOT NULL,

    CONSTRAINT "scout_report_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "expedition" ADD COLUMN "scout_report_id" TEXT;

CREATE UNIQUE INDEX "expedition_scout_report_id_key" ON "expedition"("scout_report_id");
CREATE INDEX "scout_report_scout_user_id_idx" ON "scout_report"("scout_user_id");
CREATE INDEX "scout_report_world_id_idx" ON "scout_report"("world_id");
CREATE INDEX "scout_report_timestamp_idx" ON "scout_report"("timestamp");

ALTER TABLE "expedition" ADD CONSTRAINT "expedition_scout_report_id_fkey" FOREIGN KEY ("scout_report_id") REFERENCES "scout_report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
