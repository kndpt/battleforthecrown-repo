-- Enforce one UnitTraining row per (village, building, unit type): the
-- sequential queue holds at most one entry per unit type. Combined with the
-- pg_advisory_xact_lock in the recruit use-cases this guards against duplicate
-- queue rows under concurrent recruits (run 062, follow-up to PR review).
-- CreateIndex
CREATE UNIQUE INDEX "unit_training_village_id_building_unit_type_key" ON "unit_training"("village_id", "building", "unit_type");
