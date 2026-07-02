-- CreateEnum
CREATE TYPE "MapMarkerKind" AS ENUM ('TO_SCOUT', 'TARGET', 'DANGER', 'FUTURE_VILLAGE', 'INTEREST', 'NOTE');

-- CreateTable
CREATE TABLE "map_marker" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "kind" "MapMarkerKind" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "map_marker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "map_marker_user_id_world_id_idx" ON "map_marker"("user_id", "world_id");

-- CreateIndex
CREATE INDEX "map_marker_world_id_idx" ON "map_marker"("world_id");

-- CreateIndex
CREATE UNIQUE INDEX "map_marker_user_id_world_id_x_y_key" ON "map_marker"("user_id", "world_id", "x", "y");
