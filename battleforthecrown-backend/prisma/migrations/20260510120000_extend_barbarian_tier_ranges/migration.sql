-- Extend barbarianSeeding: rMax 40 → 60, add T4/T5 tiers and two new tierRanges.
-- Idempotent: WHERE clause restricts to rows that still carry the old rMax value.
UPDATE "world"
SET "config" = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        "config",
        '{barbarianSeeding,rMax}',
        '60'::jsonb
      ),
      '{barbarianSeeding,tierRanges}',
      '[
        {"minDistance": 8,  "maxDistance": 20, "tier": "T1"},
        {"minDistance": 20, "maxDistance": 30, "tier": "T2"},
        {"minDistance": 30, "maxDistance": 40, "tier": "T3"},
        {"minDistance": 40, "maxDistance": 50, "tier": "T4"},
        {"minDistance": 50, "maxDistance": 60, "tier": "T5"}
      ]'::jsonb
    ),
    '{barbarianSeeding,tiers,T4}',
    '{
      "minPoints": 4500,
      "maxPoints": 5800,
      "buildingRatio": 0.4,
      "loot": {
        "wood": {"min": 2200, "max": 3300},
        "stone": {"min": 2200, "max": 3300},
        "iron": {"min": 1500, "max": 2500}
      },
      "visibleIndexNoise": 0.14
    }'::jsonb
  ),
  '{barbarianSeeding,tiers,T5}',
  '{
    "minPoints": 7000,
    "maxPoints": 9000,
    "buildingRatio": 0.35,
    "loot": {
      "wood": {"min": 3300, "max": 4500},
      "stone": {"min": 3300, "max": 4500},
      "iron": {"min": 2200, "max": 3300}
    },
    "visibleIndexNoise": 0.16
  }'::jsonb
)
WHERE ("config"->'barbarianSeeding'->>'rMax')::int < 60;
