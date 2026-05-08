-- Move config.combat.travelSpeed to config.multipliers.travel.
-- Semantically a speed multiplier (divides time), now grouped with the others.
UPDATE "world"
SET "config" = jsonb_set(
  "config" #- '{combat,travelSpeed}',
  '{multipliers,travel}',
  "config"->'combat'->'travelSpeed'
)
WHERE "config"->'combat' ? 'travelSpeed';
