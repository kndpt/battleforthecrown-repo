-- CreateEnum
CREATE TYPE "CosmeticAwardKind" AS ENUM ('POWER_CHAMPION_TITLE', 'ASSAULT_CHAMPION_TITLE', 'RAMPART_CHAMPION_TITLE');

-- CreateTable
CREATE TABLE "user_world_cosmetic_award" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "kind" "CosmeticAwardKind" NOT NULL,
    "world_display_name" TEXT NOT NULL,
    "awarded_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_world_cosmetic_award_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_world_cosmetic_award_user_id_idx" ON "user_world_cosmetic_award"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_world_cosmetic_award_user_world_kind_key" ON "user_world_cosmetic_award"("user_id", "world_id", "kind");

-- AddForeignKey
ALTER TABLE "user_world_cosmetic_award" ADD CONSTRAINT "user_world_cosmetic_award_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_world_cosmetic_award" ADD CONSTRAINT "user_world_cosmetic_award_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
