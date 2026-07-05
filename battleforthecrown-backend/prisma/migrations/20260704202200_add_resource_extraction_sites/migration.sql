-- CreateEnum
CREATE TYPE "ExtractionResourceType" AS ENUM ('WOOD', 'STONE', 'IRON');

-- CreateEnum
CREATE TYPE "ExtractionSiteState" AS ENUM ('ACTIVE', 'DEPLETED');

-- AlterEnum
ALTER TYPE "ExpeditionKind" ADD VALUE 'EXTRACTION';

-- AlterEnum
ALTER TYPE "ExpeditionStatus" ADD VALUE 'EXPLOITING';

-- AlterEnum
ALTER TYPE "TargetKind" ADD VALUE 'EXTRACTION_SITE';

-- AlterTable
ALTER TABLE "expedition" ADD COLUMN     "exploitation_ends_at" TIMESTAMPTZ(3),
ADD COLUMN     "extraction_duration_ms" INTEGER,
ADD COLUMN     "extraction_site_id" TEXT,
ADD COLUMN     "extraction_villagers" INTEGER;

-- CreateTable
CREATE TABLE "resource_extraction_site" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "resource_type" "ExtractionResourceType" NOT NULL,
    "initial_capacity" INTEGER NOT NULL,
    "remaining_capacity" INTEGER NOT NULL,
    "state" "ExtractionSiteState" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "resource_extraction_site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_extraction_site_world_id_state_idx" ON "resource_extraction_site"("world_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "resource_extraction_site_world_id_x_y_key" ON "resource_extraction_site"("world_id", "x", "y");

-- CreateIndex
CREATE INDEX "expedition_extraction_site_id_status_idx" ON "expedition"("extraction_site_id", "status");

-- AddForeignKey
ALTER TABLE "expedition" ADD CONSTRAINT "expedition_extraction_site_id_fkey" FOREIGN KEY ("extraction_site_id") REFERENCES "resource_extraction_site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_extraction_site" ADD CONSTRAINT "resource_extraction_site_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
