-- CreateEnum
CREATE TYPE "WorldRole" AS ENUM ('PLAYER', 'MOD');

-- CreateTable
CREATE TABLE "world_membership" (
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "role" "WorldRole" NOT NULL DEFAULT 'PLAYER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "world_membership_pkey" PRIMARY KEY ("user_id","world_id")
);

-- CreateIndex
CREATE INDEX "world_membership_world_id_idx" ON "world_membership"("world_id");

-- AddForeignKey
ALTER TABLE "world_membership" ADD CONSTRAINT "world_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_membership" ADD CONSTRAINT "world_membership_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;
