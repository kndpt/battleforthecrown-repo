-- CreateEnum
CREATE TYPE "IntelSourceKind" AS ENUM ('SCOUT', 'COMBAT_WIN');

-- CreateTable
CREATE TABLE "village_intel" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "target_village_id" TEXT NOT NULL,
    "source_kind" "IntelSourceKind" NOT NULL,
    "source_report_id" TEXT NOT NULL,
    "units" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "wall_level" INTEGER,
    "strategy" "VillageStrategy",
    "target_name" TEXT,
    "target_x" INTEGER NOT NULL,
    "target_y" INTEGER NOT NULL,
    "target_tier" TEXT,
    "seen_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "village_intel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "village_intel_user_id_world_id_idx" ON "village_intel"("user_id", "world_id");

-- CreateIndex
CREATE UNIQUE INDEX "village_intel_user_id_world_id_target_village_id_key" ON "village_intel"("user_id", "world_id", "target_village_id");
