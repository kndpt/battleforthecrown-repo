-- CreateEnum
CREATE TYPE "ReinforcementReportType" AS ENUM ('STATIONED', 'RETURNED');

-- CreateEnum
CREATE TYPE "InboxKind" AS ENUM ('REINFORCEMENT');

-- AlterTable
ALTER TABLE "expedition" ADD COLUMN     "reinforcement_recall_actor_user_id" TEXT;

-- CreateTable
CREATE TABLE "reinforcement_report" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "type" "ReinforcementReportType" NOT NULL,
    "origin_village_id" TEXT NOT NULL,
    "origin_village_name" TEXT,
    "origin_x" INTEGER NOT NULL,
    "origin_y" INTEGER NOT NULL,
    "host_village_id" TEXT NOT NULL,
    "host_village_name" TEXT,
    "host_x" INTEGER NOT NULL,
    "host_y" INTEGER NOT NULL,
    "units" JSONB NOT NULL,
    "actor_user_id" TEXT,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reinforcement_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_entry" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "kind" "InboxKind" NOT NULL,
    "reinforcement_report_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reinforcement_report_world_id_idx" ON "reinforcement_report"("world_id");

-- CreateIndex
CREATE INDEX "reinforcement_report_timestamp_idx" ON "reinforcement_report"("timestamp");

-- CreateIndex
CREATE INDEX "inbox_entry_user_id_world_id_idx" ON "inbox_entry"("user_id", "world_id");

-- CreateIndex
CREATE INDEX "inbox_entry_timestamp_idx" ON "inbox_entry"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_entry_user_id_reinforcement_report_id_key" ON "inbox_entry"("user_id", "reinforcement_report_id");

-- AddForeignKey
ALTER TABLE "inbox_entry" ADD CONSTRAINT "inbox_entry_reinforcement_report_id_fkey" FOREIGN KEY ("reinforcement_report_id") REFERENCES "reinforcement_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
