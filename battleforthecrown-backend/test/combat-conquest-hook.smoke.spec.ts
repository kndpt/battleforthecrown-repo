import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  truncateAll,
  waitFor,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

const T1_CAPTURE_DURATION_MS = 2 * 60 * 60 * 1000;

describe('combat conquest hook smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedWorld(config: object = SMOKE_WORLD_CONFIG) {
    return ctx.prisma.world.create({
      data: {
        id: `combat-conquest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Combat Conquest Hook',
        status: 'OPEN',
        config: {
          ...config,
          fogOfWar: { enabled: false },
        } as object,
      },
    });
  }

  async function seedConquestOrigin(
    worldId: string,
    suffix: string,
    units = { MILITIA: 100, NOBLE: 1 },
  ) {
    const user = await registerUser(ctx.server, suffix);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      worldId,
      `${suffix}-origin`,
    );

    await ctx.prisma.unitInventory.createMany({
      data: Object.entries(units).map(([unitType, quantity]) => ({
        villageId: join.village.id,
        unitType,
        quantity,
      })),
    });
    await ctx.prisma.population.update({
      where: { villageId: join.village.id },
      data: {
        used: (units.MILITIA ?? 0) + (units.NOBLE ?? 0) * 15,
        max: 200,
      },
    });

    return { user, village: join.village };
  }

  async function seedBarbarianTarget(
    worldId: string,
    x: number,
    y: number,
    units = { MILITIA: 1 },
  ) {
    return ctx.prisma.village.create({
      data: {
        worldId,
        name: `conquest-target-${x}-${y}`,
        x,
        y,
        isBarbarian: true,
        tier: 'T1',
        resourceStock: {
          create: { wood: 100, stone: 100, iron: 100, maxPerType: 100_000 },
        },
        buildings: {
          create: [{ type: 'CASTLE', level: 1 }],
        },
        unitInventory: {
          create: Object.entries(units).map(([unitType, quantity]) => ({
            unitType,
            quantity,
          })),
        },
      },
    });
  }

  async function launchConquest(worldId: string, suffix: string) {
    const origin = await seedConquestOrigin(worldId, suffix);
    const target = await seedBarbarianTarget(
      worldId,
      origin.village.x + 1,
      origin.village.y,
    );

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${origin.user.accessToken}`)
      .send({
        villageId: origin.village.id,
        targetX: target.x,
        targetY: target.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: target.id,
        units: { MILITIA: 100, NOBLE: 1 },
      });
    expect(attackRes.status).toBeLessThan(300);
    const attackBody = attackRes.body as { id: string };

    const pending = await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: {
            attackerVillageId: origin.village.id,
            targetVillageId: target.id,
            status: 'OPEN',
          },
        }),
      { timeoutMs: 30_000 },
    );

    return {
      ...origin,
      target,
      pending,
      expeditionId: attackBody.id,
    };
  }

  function expectCaptureDuration(
    pending: { openedAt: Date; captureUntil: Date },
    expectedMs: number,
  ) {
    const actualMs =
      pending.captureUntil.getTime() - pending.openedAt.getTime();
    expect(Math.abs(actualMs - expectedMs)).toBeLessThanOrEqual(5000);
  }

  it('opens a capture window and immobilizes the surviving escort in occupation garrison', async () => {
    const world = await seedWorld();
    const conquest = await launchConquest(world.id, `open-${Date.now()}`);

    await outboxDispatched(
      ctx.prisma,
      {
        kind: 'village.capture-window-opened',
        aggregateId: conquest.target.id,
      },
      { timeoutMs: 10_000 },
    );

    const garrison = await ctx.prisma.garrison.findMany({
      where: {
        villageId: conquest.target.id,
        originVillageId: conquest.village.id,
      },
      orderBy: { unitType: 'asc' },
    });
    expect(
      Object.fromEntries(
        garrison.map((line) => [line.unitType, line.quantity]),
      ),
    ).toEqual({
      MILITIA: 100,
      NOBLE: 1,
    });

    const resolvedEvent = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: conquest.village.id },
      { timeoutMs: 10_000 },
    );
    expect(resolvedEvent.payload).toMatchObject({
      expeditionId: conquest.expeditionId,
      survivingUnits: {},
      loot: { resources: { wood: 0, stone: 0, iron: 0 } },
      returnAt: null,
    });

    const expedition = await ctx.prisma.expedition.findUniqueOrThrow({
      where: { id: conquest.expeditionId },
    });
    expect(expedition.status).toBe('RESOLVED');
    expect(expedition.returnAt).toBeNull();
    expect(expedition.survivingUnits).toEqual({});
    expect(expedition.loot).toEqual({
      resources: { wood: 0, stone: 0, iron: 0 },
      metadata: {
        cappedByCapacity: false,
        totalCapacityAvailable: 2500,
        totalCapacityUsed: 0,
      },
    });

    const returnJobs = await ctx.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM pgboss.job
      WHERE name = 'combat:return'
        AND data->>'expeditionId' = ${conquest.expeditionId}
    `;
    expect(returnJobs).toHaveLength(0);

    const entitiesRes = await request(ctx.server)
      .get(`/world/${world.id}/entities`)
      .set('Authorization', `Bearer ${conquest.user.accessToken}`);
    expect(entitiesRes.status).toBe(200);
    const entitiesBody = entitiesRes.body as {
      entities: Array<{ id: string; data?: unknown }>;
    };
    const targetEntity = entitiesBody.entities.find(
      (entity) => entity.id === conquest.target.id,
    );
    expect(targetEntity).toMatchObject({
      id: conquest.target.id,
      data: {
        captureWindow: {
          status: 'OPEN',
          pendingConquestId: conquest.pending.id,
          attackerVillageId: conquest.village.id,
          captureUntil: conquest.pending.captureUntil.toISOString(),
        },
      },
    });
  }, 45_000);

  it('applies world capture tempo and keeps reference tempo at normal duration', async () => {
    const acceleratedWorld = await seedWorld({
      ...SMOKE_WORLD_CONFIG,
      tempo: {
        ...SMOKE_WORLD_CONFIG.tempo,
        overrides: {
          ...SMOKE_WORLD_CONFIG.tempo.overrides,
          captureWindow: 0.1,
        },
      },
    });
    const accelerated = await launchConquest(
      acceleratedWorld.id,
      `capture-speed-${Date.now()}`,
    );

    expectCaptureDuration(accelerated.pending, T1_CAPTURE_DURATION_MS / 10);

    const referenceWorld = await seedWorld(SMOKE_WORLD_CONFIG);
    const reference = await launchConquest(
      referenceWorld.id,
      `capture-reference-${Date.now()}`,
    );

    expectCaptureDuration(reference.pending, T1_CAPTURE_DURATION_MS);
  }, 60_000);

  it('interrupts an open capture window when a hostile attack kills the immobilized noble', async () => {
    const world = await seedWorld();
    const conquest = await launchConquest(world.id, `interrupt-${Date.now()}`);

    const attacker = await registerUser(ctx.server, `hostile-${Date.now()}`);
    const attackerJoin = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'hostile-origin',
    );
    await ctx.prisma.village.update({
      where: { id: attackerJoin.village.id },
      data: { x: conquest.target.x + 1, y: conquest.target.y },
    });
    await ctx.prisma.unitInventory.create({
      data: {
        villageId: attackerJoin.village.id,
        unitType: 'MILITIA',
        quantity: 200,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: attackerJoin.village.id },
      data: { used: 200, max: 250 },
    });

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerJoin.village.id,
        targetX: conquest.target.x,
        targetY: conquest.target.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: conquest.target.id,
        units: { MILITIA: 200 },
      });
    expect(attackRes.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: conquest.pending.id, status: 'INTERRUPTED' },
        }),
      { timeoutMs: 30_000 },
    );

    await outboxDispatched(
      ctx.prisma,
      {
        kind: 'village.capture-window-interrupted',
        aggregateId: conquest.target.id,
      },
      { timeoutMs: 10_000 },
    );
    const attackedEvent = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.attacked', aggregateId: conquest.target.id },
      { timeoutMs: 10_000 },
    );
    expect(attackedEvent.payload).toMatchObject({
      defenderUserId: conquest.user.userId,
      defenderVillageId: conquest.target.id,
      losses: { MILITIA: 100, NOBLE: 1 },
    });

    const occupationGarrison = await ctx.prisma.garrison.findMany({
      where: {
        villageId: conquest.target.id,
        originVillageId: conquest.village.id,
      },
    });
    expect(occupationGarrison).toHaveLength(0);

    const originPop = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: conquest.village.id },
    });
    expect(originPop.used).toBe(0);

    const reportsRes = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${conquest.user.accessToken}`);
    expect(reportsRes.status).toBe(200);
    const occupationDefenseReport = (
      reportsRes.body as Array<{
        id: string;
        defenderUserId?: string;
        defenderVillageId?: string;
        isAttacker: boolean;
        lossesDefender?: Record<string, number>;
      }>
    ).find(
      (report) =>
        report.defenderUserId === conquest.user.userId &&
        report.defenderVillageId === conquest.target.id,
    );
    expect(occupationDefenseReport).toMatchObject({
      defenderUserId: conquest.user.userId,
      defenderVillageId: conquest.target.id,
      isAttacker: false,
      lossesDefender: { MILITIA: 100, NOBLE: 1 },
    });

    const deleteRes = await request(ctx.server)
      .delete(`/combat/report/${occupationDefenseReport!.id}`)
      .set('Authorization', `Bearer ${conquest.user.accessToken}`);
    expect(deleteRes.status).toBeLessThan(300);

    const afterDeleteRes = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${conquest.user.accessToken}`);
    expect(afterDeleteRes.status).toBe(200);
    expect(
      (
        afterDeleteRes.body as Array<{
          defenderUserId?: string;
          defenderVillageId?: string;
        }>
      ).some(
        (report) =>
          report.defenderUserId === conquest.user.userId &&
          report.defenderVillageId === conquest.target.id,
      ),
    ).toBe(false);
  }, 60_000);

  it('presents a self-attack against an occupied capture as a defense report', async () => {
    const world = await seedWorld();
    const conquest = await launchConquest(world.id, `self-${Date.now()}`);

    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: {
          villageId: conquest.village.id,
          unitType: 'MILITIA',
        },
      },
      create: {
        villageId: conquest.village.id,
        unitType: 'MILITIA',
        quantity: 200,
      },
      update: { quantity: { increment: 200 } },
    });
    await ctx.prisma.population.update({
      where: { villageId: conquest.village.id },
      data: { used: 200, max: 350 },
    });

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${conquest.user.accessToken}`)
      .send({
        villageId: conquest.village.id,
        targetX: conquest.target.x,
        targetY: conquest.target.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: conquest.target.id,
        units: { MILITIA: 200 },
      });
    expect(attackRes.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: conquest.pending.id, status: 'INTERRUPTED' },
        }),
      { timeoutMs: 30_000 },
    );

    const reportsRes = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${conquest.user.accessToken}`);
    expect(reportsRes.status).toBe(200);
    const occupationDefenseReport = (
      reportsRes.body as Array<{
        defenderUserId?: string;
        defenderVillageId?: string;
        isAttacker: boolean;
        lossesDefender?: Record<string, number>;
      }>
    ).find(
      (report) =>
        report.defenderUserId === conquest.user.userId &&
        report.defenderVillageId === conquest.target.id,
    );
    expect(occupationDefenseReport).toMatchObject({
      defenderUserId: conquest.user.userId,
      defenderVillageId: conquest.target.id,
      isAttacker: false,
      lossesDefender: { MILITIA: 100, NOBLE: 1 },
    });
  }, 60_000);

  it('keeps a costly conquest victory as a raid when the noble dies', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const world = await seedWorld();
      const origin = await seedConquestOrigin(world.id, `fatal-${Date.now()}`, {
        MILITIA: 99,
        NOBLE: 1,
      });
      const target = await seedBarbarianTarget(
        world.id,
        origin.village.x + 1,
        origin.village.y,
        { MILITIA: 101 },
      );

      const attackRes = await request(ctx.server)
        .post('/combat/attack')
        .set('Authorization', `Bearer ${origin.user.accessToken}`)
        .send({
          villageId: origin.village.id,
          targetX: target.x,
          targetY: target.y,
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: target.id,
          units: { MILITIA: 99, NOBLE: 1 },
        });
      expect(attackRes.status).toBeLessThan(300);
      const attackBody = attackRes.body as { id: string };

      await waitFor(
        () =>
          ctx.prisma.eventOutbox.findFirst({
            where: {
              kind: 'noble.killed',
              aggregateId: origin.village.id,
            },
          }),
        { timeoutMs: 30_000 },
      );

      const resolvedEvent = await outboxDispatched(
        ctx.prisma,
        { kind: 'battle.resolved', aggregateId: origin.village.id },
        { timeoutMs: 30_000 },
      );
      expect(resolvedEvent.payload).toMatchObject({
        expeditionId: attackBody.id,
        isVictory: true,
        lossesAttacker: { MILITIA: 50, NOBLE: 1 },
        survivingUnits: { MILITIA: 49 },
        loot: { resources: { wood: 50, stone: 50, iron: 50 } },
      });

      const pending = await ctx.prisma.pendingConquest.findFirst({
        where: {
          attackerVillageId: origin.village.id,
          targetVillageId: target.id,
        },
      });
      expect(pending).toBeNull();
    } finally {
      randomSpy.mockRestore();
    }
  }, 45_000);
});
