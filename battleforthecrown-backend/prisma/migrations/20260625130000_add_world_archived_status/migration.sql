-- World end-of-life archive (run 065).
-- Additive + non-destructive: extends the lifecycle enum with a terminal
-- ARCHIVED status and records when the world was archived (audit, independent
-- of the status flag). The ENDED → ARCHIVED transition + player-data purge is
-- orchestrated by WorldLifecycleWorker.archiveEndedWorlds.
ALTER TYPE "WorldStatus" ADD VALUE 'ARCHIVED';

ALTER TABLE "world" ADD COLUMN "archived_at" TIMESTAMPTZ(3);
