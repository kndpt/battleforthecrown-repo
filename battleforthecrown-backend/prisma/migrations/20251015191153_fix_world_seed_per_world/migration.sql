/*
  Warnings:

  - Added the required column `world_id` to the `world_seed_state` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."world_seed_state_user_id_key";

-- AlterTable: Add world_id with default, then remove default
ALTER TABLE "world_seed_state" ADD COLUMN "world_id" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "world_seed_state" ALTER COLUMN "world_id" DROP DEFAULT;

-- Add composite primary key
ALTER TABLE "world_seed_state" ADD CONSTRAINT "world_seed_state_pkey" PRIMARY KEY ("user_id", "world_id");

-- AddForeignKey
ALTER TABLE "world_seed_state" ADD CONSTRAINT "world_seed_state_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
