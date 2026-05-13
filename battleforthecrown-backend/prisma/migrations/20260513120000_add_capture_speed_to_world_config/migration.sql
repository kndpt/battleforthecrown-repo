UPDATE "world"
SET "config" = jsonb_set(
  "config",
  '{gameSpeed,capture}',
  '1'::jsonb,
  true
)
WHERE "config" ? 'gameSpeed'
  AND NOT ("config"->'gameSpeed' ? 'capture');
