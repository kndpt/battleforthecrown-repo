CREATE TYPE "OnboardingStatus" AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE "OnboardingStep" AS ENUM ('UPGRADE_CASTLE_LEVEL_2', 'BUILD_BARRACKS', 'TRAIN_TROOPS', 'BUILD_WATCHTOWER', 'ATTACK_BARBARIAN');

CREATE TABLE "onboarding_state" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "world_id" TEXT NOT NULL,
  "first_village_id" TEXT NOT NULL,
  "status" "OnboardingStatus" NOT NULL DEFAULT 'ACTIVE',
  "current_step" "OnboardingStep" NOT NULL DEFAULT 'UPGRADE_CASTLE_LEVEL_2',
  "initial_reward_applied" BOOLEAN NOT NULL DEFAULT false,
  "initial_reward_applied_at" TIMESTAMPTZ(3),
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "onboarding_state_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_step_progress" (
  "id" TEXT NOT NULL,
  "onboarding_state_id" TEXT NOT NULL,
  "step" "OnboardingStep" NOT NULL,
  "event_outbox_id" TEXT,
  "completed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_step_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_progress_event" (
  "event_outbox_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_progress_event_pkey" PRIMARY KEY ("event_outbox_id")
);

CREATE UNIQUE INDEX "onboarding_state_user_id_world_id_key" ON "onboarding_state"("user_id", "world_id");
CREATE INDEX "onboarding_state_world_id_status_idx" ON "onboarding_state"("world_id", "status");
CREATE UNIQUE INDEX "onboarding_step_progress_onboarding_state_id_step_key" ON "onboarding_step_progress"("onboarding_state_id", "step");
CREATE UNIQUE INDEX "onboarding_step_progress_event_outbox_id_key" ON "onboarding_step_progress"("event_outbox_id");
CREATE INDEX "onboarding_step_progress_onboarding_state_id_idx" ON "onboarding_step_progress"("onboarding_state_id");

ALTER TABLE "onboarding_state" ADD CONSTRAINT "onboarding_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_state" ADD CONSTRAINT "onboarding_state_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_step_progress" ADD CONSTRAINT "onboarding_step_progress_onboarding_state_id_fkey" FOREIGN KEY ("onboarding_state_id") REFERENCES "onboarding_state"("id") ON DELETE CASCADE ON UPDATE CASCADE;
