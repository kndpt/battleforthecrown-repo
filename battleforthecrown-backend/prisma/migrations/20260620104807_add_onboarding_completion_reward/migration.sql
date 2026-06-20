-- AlterTable
ALTER TABLE "onboarding_state" ADD COLUMN     "completion_reward_applied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completion_reward_applied_at" TIMESTAMPTZ(3);
