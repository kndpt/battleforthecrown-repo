-- AlterTable
ALTER TABLE "daily_oyez" ADD COLUMN "day_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "daily_oyez_world_id_day_key_key" ON "daily_oyez"("world_id", "day_key");
