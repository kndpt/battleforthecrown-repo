import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';
import { BarbarianSeedingCatchupWorker } from '../src/modules/world/barbarian-seeding-catchup.worker';
import { BarbarianSeedingService } from '../src/modules/world/barbarian-seeding.service';
import { BarbarianRuntimeService } from '../src/modules/world/barbarian-runtime.service';
import { BarbarianVillageFactory } from '../src/modules/world/barbarian-village.factory';

describe('barbarians smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('barbarian seeding catchup: enabled world → handleSeedingCatchup seeds new BVs around recent villages', async () => {
    const worldId = `smoke-bf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await ctx.prisma.world.create({
      data: {
        id: worldId,
        name: worldId,
        status: 'OPEN',
        config: {
          ...SMOKE_WORLD_CONFIG,
          barbarianSeeding: {
            ...SMOKE_WORLD_CONFIG.barbarianSeeding,
            enabled: true,
            targetMin: 1,
            targetMax: 2,
          },
        },
      },
    });

    const user = await registerUser(ctx.server);
    await ctx.prisma.village.create({
      data: {
        worldId,
        userId: user.userId,
        name: 'recent-anchor',
        x: 50,
        y: 50,
      },
    });

    const before = await ctx.prisma.village.count({
      where: { worldId, isBarbarian: true },
    });
    await ctx.app.get(BarbarianSeedingCatchupWorker).handleSeedingCatchup();
    const after = await ctx.prisma.village.count({
      where: { worldId, isBarbarian: true },
    });

    expect(after).toBeGreaterThan(before);
  });

  it('barbarian runtime: factory persists troops and lazy catchup regenerates troops/resources', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const factory = ctx.app.get(BarbarianVillageFactory);
    const runtime = ctx.app.get(BarbarianRuntimeService);

    const barbarian = await ctx.prisma.$transaction((tx) =>
      factory.create(tx, {
        worldId: world.id,
        tier: 'T1',
        x: 320,
        y: 320,
      }),
    );

    const initialUnits = await ctx.prisma.unitInventory.findMany({
      where: { villageId: barbarian.id },
    });
    const initialTotal = initialUnits.reduce(
      (sum, unit) => sum + unit.quantity,
      0,
    );
    expect(initialTotal).toBeGreaterThanOrEqual(9);
    expect(initialTotal).toBeLessThanOrEqual(15);

    const oldTs = new Date(Date.now() - 250 * 60 * 60 * 1_000);
    await ctx.prisma.unitInventory.updateMany({
      where: { villageId: barbarian.id },
      data: { quantity: 0 },
    });
    await ctx.prisma.village.update({
      where: { id: barbarian.id },
      data: { barbarianTroopsLastRegenTs: oldTs },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: barbarian.id },
      data: {
        wood: 0,
        stone: 0,
        iron: 0,
        lastUpdateTs: oldTs,
      },
    });

    const caughtUp = await ctx.prisma.$transaction((tx) =>
      runtime.catchUpVillage(tx, barbarian.id, SMOKE_WORLD_CONFIG.tempo),
    );

    expect(caughtUp.units).toEqual({ MILITIA: 15 });
    expect(caughtUp.resources.wood).toBeGreaterThan(0);
    expect(caughtUp.resources.stone).toBeGreaterThan(0);
    expect(caughtUp.resources.iron).toBeGreaterThan(0);

    const persisted = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: {
          villageId: barbarian.id,
          unitType: 'MILITIA',
        },
      },
    });
    expect(persisted.quantity).toBe(15);
  });

  it('barbarian seeding: fresh join does not guarantee a reachable global T1 in watchtower radius', async () => {
    const worldId = `smoke-bf-no-reach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await ctx.prisma.world.create({
      data: {
        id: worldId,
        name: worldId,
        status: 'OPEN',
        config: {
          ...SMOKE_WORLD_CONFIG,
          barbarianSeeding: {
            ...SMOKE_WORLD_CONFIG.barbarianSeeding,
            enabled: true,
            targetMin: 0,
            targetMax: 0,
          },
        },
      },
    });

    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      worldId,
      'no-reachable-t1-anchor',
    );

    await ctx.app.get(BarbarianSeedingService).seedAroundVillage({
      worldId,
      villageX: join.village.x,
      villageY: join.village.y,
      anchorVillageId: join.village.id,
    });

    const reachableCount = (
      await ctx.prisma.village.findMany({
        where: { worldId, isBarbarian: true, tier: 'T1' },
        select: { x: true, y: true },
      })
    ).filter(
      (village) =>
        Math.hypot(village.x - join.village.x, village.y - join.village.y) <=
        10,
    ).length;
    expect(reachableCount).toBe(0);
  });

  it('barbarian factory: global T1 keeps real defense roll between 60-100% of blueprint', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const factory = ctx.app.get(BarbarianVillageFactory);

    await ctx.prisma.$transaction(async (tx) => {
      const village = await factory.create(tx, {
        worldId: world.id,
        tier: 'T1',
        x: 120,
        y: 120,
      });

      const militia = await tx.unitInventory.findUniqueOrThrow({
        where: {
          villageId_unitType: { villageId: village.id, unitType: 'MILITIA' },
        },
      });

      expect(militia.quantity).toBeGreaterThanOrEqual(9);
      expect(militia.quantity).toBeLessThanOrEqual(15);
    });
  });
});
