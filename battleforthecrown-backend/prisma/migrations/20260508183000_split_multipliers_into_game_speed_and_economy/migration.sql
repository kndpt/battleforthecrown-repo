-- Split config.multipliers into config.gameSpeed (3 speed dividers) and
-- config.economy (productionRate amplifier). The four fields shared a name
-- but had inverted semantics (production = rate amplifier, others = time
-- dividers), making config edits a footgun.
UPDATE "world"
SET "config" = ("config" - 'multipliers') || jsonb_build_object(
  'gameSpeed', jsonb_build_object(
    'construction', "config"->'multipliers'->'construction',
    'training',     "config"->'multipliers'->'training',
    'travel',       "config"->'multipliers'->'travel'
  ),
  'economy', jsonb_build_object(
    'productionRate', "config"->'multipliers'->'production'
  )
)
WHERE "config" ? 'multipliers';
