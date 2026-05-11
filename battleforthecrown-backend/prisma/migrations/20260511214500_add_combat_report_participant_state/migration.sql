-- Add per-recipient inbox state while keeping the legacy global is_read column
-- for backward compatibility with already-applied migrations.
ALTER TABLE "combat_report"
ADD COLUMN "read_by_attacker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "read_by_defender" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hidden_by_attacker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hidden_by_defender" BOOLEAN NOT NULL DEFAULT false;

UPDATE "combat_report"
SET
  "read_by_attacker" = "is_read",
  "read_by_defender" = "is_read";
