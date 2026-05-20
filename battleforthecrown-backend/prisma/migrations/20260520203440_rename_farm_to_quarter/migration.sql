-- Rename building type FARM -> QUARTER (Moulin -> Quartier)
-- The `building.type` column is a free String; no enum or check constraint to update.
UPDATE "building" SET "type" = 'QUARTER' WHERE "type" = 'FARM';
