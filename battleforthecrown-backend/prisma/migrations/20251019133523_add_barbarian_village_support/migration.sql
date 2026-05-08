-- AlterTable
ALTER TABLE "village" ADD COLUMN     "conquered_at" TIMESTAMP(3),
ADD COLUMN     "is_barbarian" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "village_world_id_is_barbarian_idx" ON "village"("world_id", "is_barbarian");

-- CreateIndex
CREATE INDEX "village_world_id_tier_idx" ON "village"("world_id", "tier");
