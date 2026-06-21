-- CreateEnum
CREATE TYPE "RenownSource" AS ENUM ('CONSTRUCTION', 'CONQUEST', 'COMBAT', 'RANKING_BONUS');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "renown_xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "renown_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" "RenownSource" NOT NULL,
    "xp" INTEGER NOT NULL,
    "world_id" TEXT,
    "dedup_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renown_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "renown_ledger_dedup_key_key" ON "renown_ledger"("dedup_key");

-- CreateIndex
CREATE INDEX "renown_ledger_user_id_idx" ON "renown_ledger"("user_id");

-- AddForeignKey
ALTER TABLE "renown_ledger" ADD CONSTRAINT "renown_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
