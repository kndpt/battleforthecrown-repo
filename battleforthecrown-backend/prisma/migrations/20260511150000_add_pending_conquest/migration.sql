-- CreateEnum
CREATE TYPE "PendingConquestStatus" AS ENUM ('OPEN', 'COMPLETED', 'INTERRUPTED');

-- CreateTable
CREATE TABLE "pending_conquest" (
    "id" TEXT NOT NULL,
    "attacker_village_id" TEXT NOT NULL,
    "attacker_user_id" TEXT NOT NULL,
    "attacker_noble_id" TEXT,
    "target_village_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capture_until" TIMESTAMP(3) NOT NULL,
    "status" "PendingConquestStatus" NOT NULL DEFAULT 'OPEN',
    "finalize_job_id" TEXT,

    CONSTRAINT "pending_conquest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_conquest_open_target_village_id_key" ON "pending_conquest"("target_village_id") WHERE "status" = 'OPEN';

-- CreateIndex
CREATE INDEX "pending_conquest_capture_until_status_idx" ON "pending_conquest"("capture_until", "status");

-- CreateIndex
CREATE INDEX "pending_conquest_world_id_status_idx" ON "pending_conquest"("world_id", "status");

-- CreateIndex
CREATE INDEX "pending_conquest_target_village_id_status_idx" ON "pending_conquest"("target_village_id", "status");

-- AddForeignKey
ALTER TABLE "pending_conquest" ADD CONSTRAINT "pending_conquest_attacker_village_id_fkey" FOREIGN KEY ("attacker_village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_conquest" ADD CONSTRAINT "pending_conquest_target_village_id_fkey" FOREIGN KEY ("target_village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_conquest" ADD CONSTRAINT "pending_conquest_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
