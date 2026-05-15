CREATE TYPE "DailyCardStatus" AS ENUM ('ACTIVE', 'CLAIMABLE', 'CLAIMED');
CREATE TYPE "DailyCardTaskType" AS ENUM ('TRAIN_UNITS', 'COMPLETE_BUILDING', 'RAID_BARBARIAN', 'SCOUT_TARGET', 'SEND_REINFORCEMENT');
CREATE TYPE "DailyRewardType" AS ENUM ('RESOURCES');

CREATE TABLE "daily_card" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "world_id" TEXT NOT NULL,
  "day_key" TEXT NOT NULL,
  "status" "DailyCardStatus" NOT NULL DEFAULT 'ACTIVE',
  "reward_type" "DailyRewardType" NOT NULL DEFAULT 'RESOURCES',
  "reward_wood" INTEGER NOT NULL DEFAULT 120,
  "reward_stone" INTEGER NOT NULL DEFAULT 120,
  "reward_iron" INTEGER NOT NULL DEFAULT 120,
  "reward_village_id" TEXT,
  "claimed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_card_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_card_task" (
  "id" TEXT NOT NULL,
  "card_id" TEXT NOT NULL,
  "type" "DailyCardTaskType" NOT NULL,
  "label" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "target" INTEGER NOT NULL DEFAULT 1,
  "completed_at" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_card_task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_card_progress_event" (
  "event_outbox_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_card_progress_event_pkey" PRIMARY KEY ("event_outbox_id")
);

CREATE TABLE "daily_oyez" (
  "id" TEXT NOT NULL,
  "world_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "theme" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_oyez_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_card_user_id_world_id_day_key_key" ON "daily_card"("user_id", "world_id", "day_key");
CREATE INDEX "daily_card_user_id_world_id_status_idx" ON "daily_card"("user_id", "world_id", "status");
CREATE INDEX "daily_card_world_id_idx" ON "daily_card"("world_id");
CREATE UNIQUE INDEX "daily_card_task_card_id_type_key" ON "daily_card_task"("card_id", "type");
CREATE INDEX "daily_card_task_card_id_idx" ON "daily_card_task"("card_id");
CREATE INDEX "daily_oyez_world_id_starts_at_ends_at_idx" ON "daily_oyez"("world_id", "starts_at", "ends_at");

ALTER TABLE "daily_card_task" ADD CONSTRAINT "daily_card_task_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "daily_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
