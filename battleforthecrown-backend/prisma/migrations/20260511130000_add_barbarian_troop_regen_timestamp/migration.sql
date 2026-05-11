-- Add a lazy regeneration cursor for barbarian troop stock.
ALTER TABLE "village" ADD COLUMN "barbarian_troops_last_regen_ts" TIMESTAMP(3);
