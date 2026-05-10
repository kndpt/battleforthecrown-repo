-- CreateEnum
CREATE TYPE "ExpeditionKind" AS ENUM ('ATTACK', 'REINFORCE');

-- AlterTable
ALTER TABLE "expedition" ADD COLUMN     "kind" "ExpeditionKind" NOT NULL DEFAULT 'ATTACK';

-- CreateTable
CREATE TABLE "garrison" (
    "id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "origin_village_id" TEXT NOT NULL,
    "unit_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "garrison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "garrison_village_id_idx" ON "garrison"("village_id");

-- CreateIndex
CREATE INDEX "garrison_origin_village_id_idx" ON "garrison"("origin_village_id");

-- CreateIndex
CREATE UNIQUE INDEX "garrison_village_id_origin_village_id_unit_type_key" ON "garrison"("village_id", "origin_village_id", "unit_type");

-- AddForeignKey
ALTER TABLE "garrison" ADD CONSTRAINT "garrison_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garrison" ADD CONSTRAINT "garrison_origin_village_id_fkey" FOREIGN KEY ("origin_village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;
