-- CreateTable
CREATE TABLE "zone_capacity" (
    "world_id" TEXT NOT NULL,
    "zone_index" INTEGER NOT NULL,
    "village_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zone_capacity_pkey" PRIMARY KEY ("world_id","zone_index")
);

-- CreateIndex
CREATE INDEX "zone_capacity_world_id_idx" ON "zone_capacity"("world_id");

-- AddForeignKey
ALTER TABLE "zone_capacity" ADD CONSTRAINT "zone_capacity_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
