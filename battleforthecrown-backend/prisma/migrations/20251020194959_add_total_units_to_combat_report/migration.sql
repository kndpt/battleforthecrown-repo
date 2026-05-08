-- AlterTable
ALTER TABLE "combat_report" ADD COLUMN     "total_units_attacker" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "total_units_defender" JSONB;
