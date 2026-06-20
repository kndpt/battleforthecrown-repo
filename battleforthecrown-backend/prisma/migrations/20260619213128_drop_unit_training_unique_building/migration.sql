-- Allow multiple UnitTraining rows per (village, building): the training queue
-- now holds one row per unit type, with deferred pg-boss scheduling (run 062).
-- DropIndex
DROP INDEX "unit_training_village_id_building_key";

-- CreateIndex
CREATE INDEX "unit_training_village_id_building_idx" ON "unit_training"("village_id", "building");
