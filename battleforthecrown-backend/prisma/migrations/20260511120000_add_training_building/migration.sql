CREATE TYPE "TrainingBuilding" AS ENUM ('BARRACKS', 'THRONE_HALL');

ALTER TABLE "unit_training"
  ADD COLUMN "building" "TrainingBuilding" NOT NULL DEFAULT 'BARRACKS';
