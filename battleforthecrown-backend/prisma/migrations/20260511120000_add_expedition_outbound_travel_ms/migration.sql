ALTER TABLE "expedition" ADD COLUMN "outbound_travel_ms" INTEGER;

UPDATE "expedition"
SET "outbound_travel_ms" = GREATEST(
  0,
  FLOOR(EXTRACT(EPOCH FROM ("arrival_at" - "depart_at")) * 1000)
)::INTEGER
WHERE "outbound_travel_ms" IS NULL;

ALTER TABLE "expedition" ALTER COLUMN "outbound_travel_ms" SET NOT NULL;
