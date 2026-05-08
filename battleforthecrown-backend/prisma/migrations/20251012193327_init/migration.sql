-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "village" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "village_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building" (
    "id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_stock" (
    "village_id" TEXT NOT NULL,
    "wood" INTEGER NOT NULL DEFAULT 0,
    "stone" INTEGER NOT NULL DEFAULT 0,
    "iron" INTEGER NOT NULL DEFAULT 0,
    "max_per_type" INTEGER NOT NULL DEFAULT 1000,
    "last_update_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_stock_pkey" PRIMARY KEY ("village_id")
);

-- CreateTable
CREATE TABLE "population" (
    "village_id" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "max" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "population_pkey" PRIMARY KEY ("village_id")
);

-- CreateTable
CREATE TABLE "unit_inventory" (
    "village_id" TEXT NOT NULL,
    "unit_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unit_inventory_pkey" PRIMARY KEY ("village_id","unit_type")
);

-- CreateTable
CREATE TABLE "unit_training" (
    "id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "unit_type" TEXT NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "completed_qty" INTEGER NOT NULL DEFAULT 0,
    "time_per_unit_ms" INTEGER NOT NULL,
    "next_unit_eta_ts" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_entity" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL DEFAULT 'default',
    "kind" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "world_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_seed_state" (
    "user_id" TEXT NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "seeded_at" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "event_outbox" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMP(3),

    CONSTRAINT "event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_snapshot" (
    "village_id" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "kingdom" INTEGER NOT NULL,
    "army" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_snapshot_pkey" PRIMARY KEY ("village_id","created_at")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "village_user_id_idx" ON "village"("user_id");

-- CreateIndex
CREATE INDEX "village_x_y_idx" ON "village"("x", "y");

-- CreateIndex
CREATE INDEX "building_village_id_type_idx" ON "building"("village_id", "type");

-- CreateIndex
CREATE INDEX "unit_training_village_id_idx" ON "unit_training"("village_id");

-- CreateIndex
CREATE INDEX "world_entity_world_id_x_y_idx" ON "world_entity"("world_id", "x", "y");

-- CreateIndex
CREATE UNIQUE INDEX "world_seed_state_user_id_key" ON "world_seed_state"("user_id");

-- CreateIndex
CREATE INDEX "event_outbox_dispatched_at_idx" ON "event_outbox"("dispatched_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village" ADD CONSTRAINT "village_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building" ADD CONSTRAINT "building_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_stock" ADD CONSTRAINT "resource_stock_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "population" ADD CONSTRAINT "population_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_inventory" ADD CONSTRAINT "unit_inventory_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_training" ADD CONSTRAINT "unit_training_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_seed_state" ADD CONSTRAINT "world_seed_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_snapshot" ADD CONSTRAINT "power_snapshot_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "village"("id") ON DELETE CASCADE ON UPDATE CASCADE;
