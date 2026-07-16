-- CreateTable
CREATE TABLE "resource_conversion_daily" (
    "id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "day_key" TEXT NOT NULL,
    "wood_converted" INTEGER NOT NULL DEFAULT 0,
    "stone_converted" INTEGER NOT NULL DEFAULT 0,
    "iron_converted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "resource_conversion_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_conversion_daily_village_id_day_key_key" ON "resource_conversion_daily"("village_id", "day_key");

-- AddForeignKey
ALTER TABLE "resource_conversion_daily" ADD CONSTRAINT "resource_conversion_daily_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;
