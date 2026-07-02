-- Natural trait fixed per tile (spec 27). NOT NULL, NO db default: new villages
-- must pose it explicitly at create (deriveNaturalTrait, TS/shared) so a missing
-- value fails loudly instead of silently defaulting.
--
-- Pre-existing villages are backfilled here via a SQL-native md5 hash over
-- (world_id, x, y) bucketed on the SAME weighted distribution as the runtime
-- derivation (15 % DENSE_FOREST / 15 % RICH_QUARRY / 15 % IRON_VEIN / 55 %
-- PLAINS). Per-tile parity with the runtime FNV-1a hash is intentionally NOT
-- required: a village's trait is fixed once assigned and the hash function is not
-- player-observable — only per-village stability and distribution homogeneity
-- matter, both guaranteed. Cf. docs/gameplay/27-village-natural-traits.md
-- § « Persistance & backfill ».
CREATE TYPE "VillageNaturalTrait" AS ENUM ('DENSE_FOREST', 'RICH_QUARRY', 'IRON_VEIN', 'PLAINS');

ALTER TABLE "village" ADD COLUMN "natural_trait" "VillageNaturalTrait";

UPDATE "village" AS v
SET "natural_trait" =
  CASE
    WHEN h.bucket < 15 THEN 'DENSE_FOREST'::"VillageNaturalTrait"
    WHEN h.bucket < 30 THEN 'RICH_QUARRY'::"VillageNaturalTrait"
    WHEN h.bucket < 45 THEN 'IRON_VEIN'::"VillageNaturalTrait"
    ELSE 'PLAINS'::"VillageNaturalTrait"
  END
FROM (
  SELECT
    "id",
    ((('x' || substr(md5("world_id" || ':' || "x"::text || ':' || "y"::text), 1, 8))::bit(32)::int % 100) + 100) % 100 AS bucket
  FROM "village"
) AS h
WHERE v."id" = h."id";

ALTER TABLE "village" ALTER COLUMN "natural_trait" SET NOT NULL;
