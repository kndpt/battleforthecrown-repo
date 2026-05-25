ALTER TABLE "world" ADD COLUMN "planned_open_at" TIMESTAMPTZ(3);

UPDATE "world"
SET "config" =
  "config" ||
  jsonb_build_object(
    'lifecycle',
    jsonb_build_object(
      'worldDuration', 60,
      'inscriptionMainDays', 7,
      'inscriptionLateDays', 3,
      'newWorldEverydays', 7,
      'newbieShieldHours', 48
    ) || COALESCE("config"->'lifecycle', '{}'::jsonb),
    'identity',
    jsonb_build_object(
      'displayName', "name",
      'tagline', 'Un royaume neuf attend sa couronne.',
      'sigil', 'crown',
      'themeColor', 'green',
      'tier', 'DEBUTANTS'
    ) || COALESCE("config"->'identity', '{}'::jsonb)
  );
