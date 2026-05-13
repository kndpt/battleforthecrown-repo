-- CreateEnum
CREATE TYPE "VillageLabel" AS ENUM ('OFFENSIVE', 'DEFENSIVE', 'ECONOMIC');

-- AlterTable
ALTER TABLE "village" ADD COLUMN "label" "VillageLabel";
