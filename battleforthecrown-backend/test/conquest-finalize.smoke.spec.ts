import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';
import {
  CONQUEST_FINALIZE_QUEUE,
  ConquestService,
} from '../src/modules/combat/conquest.service';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import {
  BUILDING_TYPES,
  isBuildingEnabled,
  getBuildingLevelValues,
  getQuarterPopulationLimit,
  type BuildingType,
} from '@battleforthecrown/shared/village';

const EXPECTED_MATERIALIZED_BUILDINGS = [
  BUILDING_TYPES.BARRACKS,
  BUILDING_TYPES.CASTLE,
  BUILDING_TYPES.QUARTER,
  BUILDING_TYPES.IRON,
  BUILDING_TYPES.STONE,
  BUILDING_TYPES.WAREHOUSE,
  BUILDING_TYPES.WOOD,
] as const satisfies readonly BuildingType[];
const EXPECTED_MATERIALIZED_BUILDING_SET = new Set<BuildingType>(
  EXPECTED_MATERIALIZED_BUILDINGS,
);
const EXPECTED_UNBUILT_BUILDINGS = (
  Object.values(BUILDING_TYPES) as BuildingType[]
)
  .filter(
    (type) =>
      isBuildingEnabled(type) && !EXPECTED_MATERIALIZED_BUILDING_SET.has(type),
  )
  .sort();
const EXPECTED_T2_BUILDINGS = [
  ...EXPECTED_MATERIALIZED_BUILDINGS,
  ...EXPECTED_UNBUILT_BUILDINGS,
].sort();
const EXPECTED_T2_LEVEL = 1;
const EXPECTED_T2_BUILDING_POPULATION = EXPECTED_MATERIALIZED_BUILDINGS.reduce(
  (total, type) =>
    total + (getBuildingLevelValues(type, EXPECTED_T2_LEVEL)?.population ?? 0),
  0,
);

describe('conquest finalize smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function createTarget(worldId: string, x: number, y: number) {
    return ctx.prisma.village.create({
      data: {
        worldId,
        isBarbarian: true,
        name: `capture-target-${x}-${y}`,
        x,
        y,
        tier: 'T2',
        resourceStock: {
          create: { wood: 100, stone: 100, iron: 100, maxPerType: 100_000 },
        },
        buildings: {
          create: [
            { type: 'WOOD', level: 1 },
            { type: 'WATCHTOWER', level: 1 },
          ],
        },
        unitInventory: {
          create: [{ unitType: 'MILITIA', quantity: 10 }],
        },
      },
    });
  }

  it('opens a capture window then conquest:finalize transfers the village and emits events', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(
      ctx.server,
      `capture-complete-${Date.now()}`,
    );
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'capture-complete-origin',
    );
    const target = await createTarget(
      world.id,
      join.village.x + 1,
      join.village.y,
    );
    await ctx.prisma.garrison.create({
      data: {
        villageId: target.id,
        originVillageId: join.village.id,
        unitType: UNIT_TYPES.NOBLE,
        quantity: 1,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: join.village.id },
      data: { used: { increment: UNIT_COSTS[UNIT_TYPES.NOBLE].population } },
    });

    const conquest = ctx.app.get(ConquestService);
    const pending = await conquest.openCaptureWindow({
      attackerVillageId: join.village.id,
      targetVillageId: target.id,
      attackerUserId: user.userId,
      captureUntil: new Date(Date.now() + 100),
    });

    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.capture-window-opened', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: pending.id, status: 'COMPLETED' },
        }),
      { timeoutMs: 15_000 },
    );

    const conquered = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: target.id },
      include: { resourceStock: true, buildings: true, unitInventory: true },
    });
    const buildingsByType = [...conquered.buildings].sort((a, b) =>
      a.type.localeCompare(b.type),
    );
    const strategyConfig =
      await ctx.prisma.villageStrategyConfig.findUniqueOrThrow({
        where: { villageId: target.id },
      });
    const population = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: target.id },
    });
    const originPopulation = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: join.village.id },
    });
    const noblePopulation = UNIT_COSTS[UNIT_TYPES.NOBLE].population;

    expect(conquered.userId).toBe(user.userId);
    expect(conquered.isBarbarian).toBe(false);
    expect(conquered.resourceStock?.wood).toBe(0);
    expect(conquered.resourceStock?.stone).toBe(0);
    expect(conquered.resourceStock?.iron).toBe(0);
    expect(conquered.resourceStock?.maxPerType).toBe(
      getWarehouseStorageLimit(EXPECTED_T2_LEVEL).wood,
    );
    expect(buildingsByType.map((building) => building.type)).toEqual(
      EXPECTED_T2_BUILDINGS,
    );
    expect(
      buildingsByType.filter((building) =>
        EXPECTED_MATERIALIZED_BUILDING_SET.has(building.type as BuildingType),
      ),
    ).toEqual(
      [...EXPECTED_MATERIALIZED_BUILDINGS]
        .sort()
        .map((type) =>
          expect.objectContaining({ type, level: EXPECTED_T2_LEVEL }),
        ),
    );
    expect(
      buildingsByType.filter((building) =>
        EXPECTED_UNBUILT_BUILDINGS.includes(building.type as BuildingType),
      ),
    ).toEqual(
      EXPECTED_UNBUILT_BUILDINGS.map((type) =>
        expect.objectContaining({ type, level: 0 }),
      ),
    );
    expect(conquered.unitInventory).toHaveLength(0);
    expect(originPopulation.used).toBe(17);
    expect(strategyConfig.strategy).toBe('BALANCED');
    expect(population.used).toBe(
      EXPECTED_T2_BUILDING_POPULATION + noblePopulation,
    );
    expect(population.max).toBe(getQuarterPopulationLimit(EXPECTED_T2_LEVEL));

    const finalReport = await ctx.prisma.combatReport.findFirstOrThrow({
      where: {
        attackerUserId: user.userId,
        defenderVillageId: target.id,
        details: {
          path: ['captureFinalized', 'pendingConquestId'],
          equals: pending.id,
        },
      },
    });
    expect(finalReport.defenderUserId).toBeNull();
    expect(finalReport.attackerVillageName).toBe(join.village.name);
    expect(finalReport.attackerX).toBe(join.village.x);
    expect(finalReport.attackerY).toBe(join.village.y);
    expect(finalReport.defenderVillageName).toBe(target.name);
    expect(finalReport.defenderX).toBe(target.x);
    expect(finalReport.defenderY).toBe(target.y);
    expect(finalReport.targetX).toBe(target.x);
    expect(finalReport.targetY).toBe(target.y);

    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.capture-window-completed', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );
    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );
  }, 30_000);

  it('enriches the player-village loss with conqueror pseudo + castle snapshot and persists readByDefender', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(
      ctx.server,
      `pvp-attacker-${Date.now()}`,
    );
    const victim = await registerUser(ctx.server, `pvp-victim-${Date.now()}`);
    const attackerJoin = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'pvp-attacker-origin',
    );
    const victimJoin = await joinWorld(
      ctx.server,
      victim.accessToken,
      world.id,
      'pvp-victim-target',
    );

    // Snapshot a non-trivial castle level on the lost village so the asset tier
    // carried by the event/report is meaningful (not the default level 1).
    const SNAPSHOT_CASTLE_LEVEL = 3;
    const upgraded = await ctx.prisma.building.updateMany({
      where: { villageId: victimJoin.village.id, type: 'CASTLE' },
      data: { level: SNAPSHOT_CASTLE_LEVEL },
    });
    expect(upgraded.count).toBe(1);

    await ctx.prisma.garrison.create({
      data: {
        villageId: victimJoin.village.id,
        originVillageId: attackerJoin.village.id,
        unitType: UNIT_TYPES.NOBLE,
        quantity: 1,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: attackerJoin.village.id },
      data: { used: { increment: UNIT_COSTS[UNIT_TYPES.NOBLE].population } },
    });

    const conquest = ctx.app.get(ConquestService);
    const pending = await conquest.openCaptureWindow({
      attackerVillageId: attackerJoin.village.id,
      targetVillageId: victimJoin.village.id,
      attackerUserId: attacker.userId,
      captureUntil: new Date(Date.now() + 100),
    });

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: pending.id, status: 'COMPLETED' },
        }),
      { timeoutMs: 15_000 },
    );

    // 1) The village.conquered event carries the conqueror pseudo + castle snapshot.
    const conqueredEvent = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: victimJoin.village.id },
      { timeoutMs: 10_000 },
    );
    const payload = conqueredEvent?.payload as {
      newOwnerId: string;
      newOwnerName: string;
      previousOwnerId: string | null;
      villageCastleLevel: number | null;
    };
    expect(payload.newOwnerId).toBe(attacker.userId);
    expect(payload.newOwnerName).toBe(attacker.displayName);
    expect(payload.previousOwnerId).toBe(victim.userId);
    expect(payload.villageCastleLevel).toBe(SNAPSHOT_CASTLE_LEVEL);

    // 2) The captureFinalized report mirrors the enrichment for boot hydration.
    const finalReport = await ctx.prisma.combatReport.findFirstOrThrow({
      where: {
        attackerUserId: attacker.userId,
        defenderVillageId: victimJoin.village.id,
        details: {
          path: ['captureFinalized', 'pendingConquestId'],
          equals: pending.id,
        },
      },
    });
    expect(finalReport.defenderUserId).toBe(victim.userId);
    expect(finalReport.readByDefender).toBe(false);
    const details = finalReport.details as {
      captureFinalized: { newOwnerName?: string; castleLevel?: number | null };
    };
    expect(details.captureFinalized.newOwnerName).toBe(attacker.displayName);
    expect(details.captureFinalized.castleLevel).toBe(SNAPSHOT_CASTLE_LEVEL);

    // 3) Acknowledgement (PISTE B): defender marks the report read → persisted.
    const ackRes = await request(ctx.server)
      .patch(`/combat/report/${finalReport.id}/read`)
      .set('Authorization', `Bearer ${victim.accessToken}`)
      .set('x-world-id', world.id);
    expect(ackRes.status).toBeLessThan(300);

    const reread = await ctx.prisma.combatReport.findUniqueOrThrow({
      where: { id: finalReport.id },
    });
    expect(reread.readByDefender).toBe(true);
  }, 30_000);

  it('interrupts an open capture window and finalization becomes a no-op', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(
      ctx.server,
      `capture-interrupt-${Date.now()}`,
    );
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'capture-interrupt-origin',
    );
    const target = await createTarget(
      world.id,
      join.village.x + 2,
      join.village.y,
    );

    const conquest = ctx.app.get(ConquestService);
    const pending = await conquest.openCaptureWindow({
      attackerVillageId: join.village.id,
      targetVillageId: target.id,
      attackerUserId: user.userId,
      captureUntil: new Date(Date.now() + 60_000),
    });

    const interrupted = await conquest.interruptCaptureWindow(
      target.id,
      'noble-killed',
    );
    expect(interrupted).toEqual({
      interrupted: true,
      pendingConquestId: pending.id,
    });

    await ctx.boss.send(CONQUEST_FINALIZE_QUEUE, {
      pendingConquestId: pending.id,
    });

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: pending.id, status: 'INTERRUPTED' },
        }),
      { timeoutMs: 10_000 },
    );

    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.capture-window-interrupted', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );

    const targetAfter = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(targetAfter.userId).toBeNull();
    expect(targetAfter.isBarbarian).toBe(true);
  }, 30_000);
});
