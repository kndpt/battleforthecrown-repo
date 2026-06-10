-- CreateEnum
CREATE TYPE "CaravanReportType" AS ENUM ('ARRIVED', 'RETURNED');

-- AlterEnum
ALTER TYPE "InboxKind" ADD VALUE 'CARAVAN';

-- AlterTable
ALTER TABLE "inbox_entry" ADD COLUMN "caravan_report_id" TEXT;

-- CreateTable
CREATE TABLE "caravan_report" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "expedition_id" TEXT NOT NULL,
    "type" "CaravanReportType" NOT NULL,
    "origin_village_id" TEXT NOT NULL,
    "origin_village_name" TEXT,
    "origin_x" INTEGER NOT NULL,
    "origin_y" INTEGER NOT NULL,
    "target_village_id" TEXT NOT NULL,
    "target_village_name" TEXT,
    "target_x" INTEGER NOT NULL,
    "target_y" INTEGER NOT NULL,
    "resources" JSONB NOT NULL,
    "credited" JSONB NOT NULL,
    "returned" JSONB NOT NULL,
    "lost" JSONB NOT NULL,
    "porters" INTEGER NOT NULL DEFAULT 0,
    "recalled" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caravan_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "caravan_report_expedition_id_type_key" ON "caravan_report"("expedition_id", "type");

-- CreateIndex
CREATE INDEX "caravan_report_world_id_idx" ON "caravan_report"("world_id");

-- CreateIndex
CREATE INDEX "caravan_report_timestamp_idx" ON "caravan_report"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_entry_user_id_caravan_report_id_key" ON "inbox_entry"("user_id", "caravan_report_id");

-- AddForeignKey
ALTER TABLE "inbox_entry" ADD CONSTRAINT "inbox_entry_caravan_report_id_fkey" FOREIGN KEY ("caravan_report_id") REFERENCES "caravan_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
