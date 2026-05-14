-- Backfill unbuilt advanced building rows for villages conquered before
-- barbarian conquest materialized level-0 rows for future unlocks.
INSERT INTO "building" ("id", "village_id", "type", "level")
SELECT
  'backfill-' || v."id" || '-' || missing."type",
  v."id",
  missing."type",
  0
FROM "village" v
CROSS JOIN (
  VALUES
    ('WATCHTOWER'),
    ('COUNCIL_HALL'),
    ('THRONE_HALL')
) AS missing("type")
WHERE v."is_barbarian" = false
  AND v."conquered_at" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "building" b
    WHERE b."village_id" = v."id"
      AND b."type" = missing."type"
  );
