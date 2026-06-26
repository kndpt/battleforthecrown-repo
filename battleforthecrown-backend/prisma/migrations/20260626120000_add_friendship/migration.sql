-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "friendship" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ(3),

    CONSTRAINT "friendship_pkey" PRIMARY KEY ("id")
);

-- A player can never befriend themselves.
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_distinct_users_check" CHECK ("requester_user_id" <> "recipient_user_id");

-- CreateIndex
CREATE INDEX "friendship_world_id_recipient_user_id_status_idx" ON "friendship"("world_id", "recipient_user_id", "status");

-- CreateIndex
CREATE INDEX "friendship_world_id_requester_user_id_status_idx" ON "friendship"("world_id", "requester_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "friendship_world_id_requester_user_id_recipient_user_id_key" ON "friendship"("world_id", "requester_user_id", "recipient_user_id");

-- AddForeignKey
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "world"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
