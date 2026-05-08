-- CreateEnum
CREATE TYPE "VillageStrategy" AS ENUM ('FORTRESS', 'RAIDERS', 'ECONOMIC', 'BALANCED');

-- CreateTable
CREATE TABLE "village_strategy_config" (
    "id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "strategy" "VillageStrategy" NOT NULL,
    "last_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_cost" INTEGER NOT NULL DEFAULT 0,
    "cooldown_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "village_strategy_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "village_strategy_config_village_id_key" ON "village_strategy_config"("village_id");

-- CreateIndex
CREATE INDEX "village_strategy_config_village_id_idx" ON "village_strategy_config"("village_id");

-- CreateIndex
CREATE INDEX "village_strategy_config_strategy_idx" ON "village_strategy_config"("strategy");

-- AddForeignKey
ALTER TABLE "village_strategy_config" ADD CONSTRAINT "village_strategy_config_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;
