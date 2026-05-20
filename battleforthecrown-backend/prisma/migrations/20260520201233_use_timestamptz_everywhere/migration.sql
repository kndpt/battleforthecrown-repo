/*
  Warnings:

  - You are about to drop the `world_entity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "world_entity" DROP CONSTRAINT "world_entity_world_id_fkey";

-- AlterTable
ALTER TABLE "building" ALTER COLUMN "start_time" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "end_time" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "chunk_spawn_state" ALTER COLUMN "last_seeded_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "combat_report" ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "crown_balance" ALTER COLUMN "last_update_ts" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "daily_card" ALTER COLUMN "claimed_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "daily_card_progress_event" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "daily_card_task" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "daily_oyez" ALTER COLUMN "starts_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "ends_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "event_outbox" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "dispatched_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "expedition" ALTER COLUMN "depart_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "arrival_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "return_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "pending_conquest" ALTER COLUMN "opened_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "capture_until" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "resource_stock" ALTER COLUMN "last_update_ts" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "scout_report" ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "unit_training" ALTER COLUMN "next_unit_eta_ts" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "village" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "conquered_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "barbarian_troops_last_regen_ts" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "village_strategy_config" ALTER COLUMN "last_changed_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "cooldown_ends_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "world" ALTER COLUMN "started_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "ends_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "world_membership" ALTER COLUMN "joined_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "world_seed_state" ALTER COLUMN "seeded_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "zone_capacity" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- DropTable
DROP TABLE "world_entity";
