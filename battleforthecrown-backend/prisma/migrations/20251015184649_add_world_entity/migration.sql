/*
  Warnings:

  - A unique constraint covering the columns `[world_id,x,y]` on the table `village` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `world_id` to the `village` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorldStatus" AS ENUM ('PLANNED', 'OPEN', 'LOCKED', 'ENDED');

-- CreateTable
CREATE TABLE "world" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorldStatus" NOT NULL DEFAULT 'PLANNED',
    "config" JSONB NOT NULL DEFAULT '{}',
    "gridWidth" INTEGER NOT NULL DEFAULT 500,
    "gridHeight" INTEGER NOT NULL DEFAULT 500,
    "continent_width" INTEGER NOT NULL DEFAULT 100,
    "continent_height" INTEGER NOT NULL DEFAULT 100,
    "speed_multipliers" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_pkey" PRIMARY KEY ("id")
);

-- Insert default world for existing data
INSERT INTO "world" ("id", "name", "status") VALUES ('default', 'Default World', 'OPEN');

-- DropIndex
DROP INDEX "public"."village_x_y_idx";

-- AlterTable: Add world_id with default value
ALTER TABLE "village" ADD COLUMN "world_id" TEXT NOT NULL DEFAULT 'default';

-- AlterTable: Remove default after data is populated
ALTER TABLE "village" ALTER COLUMN "world_id" DROP DEFAULT;

-- AlterTable: Update world_entity
ALTER TABLE "world_entity" ALTER COLUMN "world_id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "village_world_id_idx" ON "village"("world_id");

-- CreateIndex
CREATE UNIQUE INDEX "village_world_id_x_y_key" ON "village"("world_id", "x", "y");

-- AddForeignKey
ALTER TABLE "village" ADD CONSTRAINT "village_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_entity" ADD CONSTRAINT "world_entity_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
