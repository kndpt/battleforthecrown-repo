-- CreateTable
CREATE TABLE "crown_balance" (
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "production_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_update_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crown_balance_pkey" PRIMARY KEY ("user_id","world_id")
);

-- CreateIndex
CREATE INDEX "crown_balance_user_id_idx" ON "crown_balance"("user_id");

-- CreateIndex
CREATE INDEX "crown_balance_world_id_idx" ON "crown_balance"("world_id");

-- AddForeignKey
ALTER TABLE "crown_balance" ADD CONSTRAINT "crown_balance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
