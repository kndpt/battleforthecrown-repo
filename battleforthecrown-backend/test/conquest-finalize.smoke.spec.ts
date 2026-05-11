import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  waitFor,
  type SmokeContext,
} from './helpers';
import {
  CONQUEST_FINALIZE_QUEUE,
  ConquestService,
} from '../src/modules/combat/conquest.service';

describe('conquest finalize smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
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
        tier: 'T1',
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
    expect(conquered.userId).toBe(user.userId);
    expect(conquered.isBarbarian).toBe(false);
    expect(conquered.resourceStock?.wood).toBe(0);
    expect(
      conquered.buildings.some((building) => building.type === 'WATCHTOWER'),
    ).toBe(false);
    expect(conquered.unitInventory).toHaveLength(0);

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
