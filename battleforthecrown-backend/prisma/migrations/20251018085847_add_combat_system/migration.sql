-- CreateEnum
CREATE TYPE "ExpeditionStatus" AS ENUM ('EN_ROUTE', 'RESOLVED', 'RETURNING');

-- CreateEnum
CREATE TYPE "TargetKind" AS ENUM ('PLAYER_VILLAGE', 'BARBARIAN_VILLAGE');

-- CreateTable
CREATE TABLE "expedition" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "attacker_village_id" TEXT NOT NULL,
    "target_kind" "TargetKind" NOT NULL,
    "target_ref_id" TEXT NOT NULL,
    "target_x" INTEGER NOT NULL,
    "target_y" INTEGER NOT NULL,
    "units" JSONB NOT NULL,
    "status" "ExpeditionStatus" NOT NULL DEFAULT 'EN_ROUTE',
    "depart_at" TIMESTAMP(3) NOT NULL,
    "arrival_at" TIMESTAMP(3) NOT NULL,
    "return_at" TIMESTAMP(3),
    "report_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expedition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_report" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "attacker_village_id" TEXT NOT NULL,
    "attacker_user_id" TEXT NOT NULL,
    "defender_village_id" TEXT,
    "defender_user_id" TEXT,
    "target_kind" "TargetKind" NOT NULL,
    "target_x" INTEGER NOT NULL,
    "target_y" INTEGER NOT NULL,
    "loot" JSONB NOT NULL,
    "losses_attacker" JSONB NOT NULL,
    "losses_defender" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB NOT NULL,

    CONSTRAINT "combat_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expedition_report_id_key" ON "expedition"("report_id");

-- CreateIndex
CREATE INDEX "expedition_attacker_village_id_idx" ON "expedition"("attacker_village_id");

-- CreateIndex
CREATE INDEX "expedition_status_idx" ON "expedition"("status");

-- CreateIndex
CREATE INDEX "expedition_arrival_at_idx" ON "expedition"("arrival_at");

-- CreateIndex
CREATE INDEX "expedition_return_at_idx" ON "expedition"("return_at");

-- CreateIndex
CREATE INDEX "combat_report_attacker_user_id_idx" ON "combat_report"("attacker_user_id");

-- CreateIndex
CREATE INDEX "combat_report_defender_user_id_idx" ON "combat_report"("defender_user_id");

-- CreateIndex
CREATE INDEX "combat_report_world_id_idx" ON "combat_report"("world_id");

-- CreateIndex
CREATE INDEX "combat_report_timestamp_idx" ON "combat_report"("timestamp");

-- AddForeignKey
ALTER TABLE "expedition" ADD CONSTRAINT "expedition_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "combat_report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
