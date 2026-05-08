-- Move speed_multipliers payload into world.config.multipliers, then drop the column.
UPDATE "world"
SET "config" = jsonb_set(
  COALESCE("config", '{}'::jsonb),
  '{multipliers}',
  COALESCE("speed_multipliers", '{}'::jsonb),
  true
);

ALTER TABLE "world" DROP COLUMN "speed_multipliers";
