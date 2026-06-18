-- Add VillageOriginKind enum (STANDARD = default, ONBOARDING_NARRATIVE = onboarding-only
-- weakened target). Non-destructive: every existing village gets STANDARD via the default.
CREATE TYPE "VillageOriginKind" AS ENUM ('STANDARD', 'ONBOARDING_NARRATIVE');

ALTER TABLE "village"
  ADD COLUMN "origin_kind" "VillageOriginKind" NOT NULL DEFAULT 'STANDARD';

-- 1:1 link from OnboardingState to its narrative target village. SET NULL on village delete
-- so a wiped target cannot ghost-block the unique constraint.
ALTER TABLE "onboarding_state"
  ADD COLUMN "narrative_target_village_id" TEXT;

ALTER TABLE "onboarding_state"
  ADD CONSTRAINT "onboarding_state_narrative_target_village_id_fkey"
  FOREIGN KEY ("narrative_target_village_id") REFERENCES "village"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "onboarding_state_narrative_target_village_id_key"
  ON "onboarding_state"("narrative_target_village_id");
