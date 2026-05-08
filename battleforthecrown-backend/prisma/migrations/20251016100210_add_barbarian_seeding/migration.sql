/*
  Warnings:

  - A unique constraint covering the columns `[world_id,x,y]` on the table `world_entity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."world_entity_world_id_x_y_idx";

-- CreateTable
CREATE TABLE "chunk_spawn_state" (
    "world_id" TEXT NOT NULL,
    "cx" INTEGER NOT NULL,
    "cy" INTEGER NOT NULL,
    "last_seeded_at" TIMESTAMP(3),
    "seed_version" INTEGER NOT NULL DEFAULT 1,
    "existing_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunk_spawn_state_pkey" PRIMARY KEY ("world_id","cx","cy")
);

-- CreateIndex
CREATE INDEX "chunk_spawn_state_world_id_idx" ON "chunk_spawn_state"("world_id");

-- CreateIndex
CREATE INDEX "world_entity_world_id_kind_idx" ON "world_entity"("world_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "world_entity_world_id_x_y_key" ON "world_entity"("world_id", "x", "y");

-- AddForeignKey
ALTER TABLE "chunk_spawn_state" ADD CONSTRAINT "chunk_spawn_state_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
