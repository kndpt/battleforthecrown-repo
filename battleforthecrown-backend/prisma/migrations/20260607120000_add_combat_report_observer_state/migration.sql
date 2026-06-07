-- Add a third inbox participant for capture-context combat reports.
ALTER TABLE "combat_report"
  ADD COLUMN "observer_user_id" TEXT,
  ADD COLUMN "read_by_observer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hidden_by_observer" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "combat_report_observer_user_id_idx" ON "combat_report"("observer_user_id");
