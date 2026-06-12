-- AlterTable
ALTER TABLE "village" ADD COLUMN "is_onboarding_narrative_target" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "onboarding_state" ADD COLUMN "narrative_target_village_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_state_narrative_target_village_id_key" ON "onboarding_state"("narrative_target_village_id");

-- CreateIndex
CREATE INDEX "village_world_id_is_onboarding_narrative_target_idx" ON "village"("world_id", "is_onboarding_narrative_target");

-- AddForeignKey
ALTER TABLE "onboarding_state" ADD CONSTRAINT "onboarding_state_narrative_target_village_id_fkey" FOREIGN KEY ("narrative_target_village_id") REFERENCES "village"("id") ON DELETE SET NULL ON UPDATE CASCADE;
