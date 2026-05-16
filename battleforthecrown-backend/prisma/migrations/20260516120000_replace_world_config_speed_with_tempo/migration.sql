-- Clean-cut world config tempo migration.
-- Old semantics:
-- - config.gameSpeed.* used speed multipliers where higher = faster.
-- - config.economy.productionRate used a rate multiplier where higher = faster.
-- New semantics:
-- - config.tempo.* uses tempo where lower = faster.
-- - duration axes multiply by tempo; rate axes divide by tempo.

UPDATE "world"
SET "config" =
  ("config" - 'gameSpeed' - 'economy') ||
  jsonb_build_object(
    'tempo',
    jsonb_build_object(
      'global', 1,
      'overrides', jsonb_strip_nulls(jsonb_build_object(
        'constructionSpeed',
          CASE
            WHEN ("config"->'gameSpeed'->>'construction')::numeric > 0
            THEN to_jsonb(1 / ("config"->'gameSpeed'->>'construction')::numeric)
            ELSE NULL
          END,
        'unitTrainingSpeed',
          CASE
            WHEN ("config"->'gameSpeed'->>'training')::numeric > 0
            THEN to_jsonb(1 / ("config"->'gameSpeed'->>'training')::numeric)
            ELSE NULL
          END,
        'lordTrainingSpeed',
          CASE
            WHEN ("config"->'gameSpeed'->>'training')::numeric > 0
            THEN to_jsonb(1 / ("config"->'gameSpeed'->>'training')::numeric)
            ELSE NULL
          END,
        'travelSpeed',
          CASE
            WHEN ("config"->'gameSpeed'->>'travel')::numeric > 0
            THEN to_jsonb(1 / ("config"->'gameSpeed'->>'travel')::numeric)
            ELSE NULL
          END,
        'captureWindow',
          CASE
            WHEN ("config"->'gameSpeed'->>'capture')::numeric > 0
            THEN to_jsonb(1 / ("config"->'gameSpeed'->>'capture')::numeric)
            ELSE to_jsonb(1)
          END,
        'barbarianRegen', to_jsonb(1),
        'resourceProduction',
          CASE
            WHEN ("config"->'economy'->>'productionRate')::numeric > 0
            THEN to_jsonb(1 / ("config"->'economy'->>'productionRate')::numeric)
            ELSE NULL
          END,
        'crownsYield', to_jsonb(1)
      ))
    )
  )
WHERE "config" ? 'gameSpeed'
   OR "config" ? 'economy';
