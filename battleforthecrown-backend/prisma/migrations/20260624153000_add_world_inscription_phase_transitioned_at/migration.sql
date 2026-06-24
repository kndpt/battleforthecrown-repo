-- Add inscription-phase transition timestamp to World (additive, nullable).
-- Persists the moment a world crosses the main → late inscription boundary so
-- the lifecycle worker stays idempotent (re-emits no event once non-null).
ALTER TABLE "world" ADD COLUMN "inscription_phase_transitioned_at" TIMESTAMPTZ(3);
