import request from 'supertest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
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
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';
import { ConquestService } from '../src/modules/combat/conquest.service';
import { BarbarianBackfillWorker } from '../src/modules/world/barbarian-backfill.worker';

describe('smoke', () => {
  let ctx: SmokeContext;

  let port: number;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
    port = (ctx.server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('production tick: ResourceStock.lastUpdateTs is bumped for active villages', async () => {
    // ProductionWorker does NOT emit resources.changed by design — frontend
    // interpolates between mutation-driven events (cf. production.worker.ts).
    // We assert on the DB side-effect (lastUpdateTs progression) instead.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'tick-village',
    );
    const villageId = join.village.id;

    const before = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    await new Promise((r) => setTimeout(r, 1100));
    await ctx.boss.send('production:tick', {});

    await waitFor(
      async () => {
        const after = await ctx.prisma.resourceStock.findUniqueOrThrow({
          where: { villageId },
        });
        return after.lastUpdateTs > before.lastUpdateTs ? after : null;
      },
      { timeoutMs: 10_000 },
    );
  });

  it('construction: upgrade WOOD → Building.level=2 + building.completed dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'WOOD' });
    expect(res.status).toBeLessThan(300);

    const upgradedBuilding = await waitFor(
      () =>
        ctx.prisma.building.findFirst({
          where: { villageId, type: 'WOOD', level: 2 },
        }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'building.completed', aggregateId: upgradedBuilding.id },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('training: train 1 MILITIA → UnitInventory + unit.training.completed dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-village',
    );
    const villageId = join.village.id;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 1 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 100_000,
        stone: 100_000,
        iron: 100_000,
        maxPerType: 1_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 0, max: 1000 },
    });

    const res = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: 'MILITIA', quantity: 1 });
    expect(res.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId, unitType: 'MILITIA', quantity: { gte: 1 } },
        }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'unit.training.completed', aggregateId: villageId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('combat: attack a barbarian → battle.resolved + battle.returned dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'attacker',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'MILITIA', quantity: 100 },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 100 },
      });
    expect(res.status).toBeLessThan(300);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();

    const returned = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.returned', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(returned?.dispatchedAt).toBeTruthy();
  });

  it('conquest: ConquestService → village.userId reassigned + village.conquered dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'conqueror',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-conquer-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    const conquest = ctx.app.get(ConquestService);
    const result = await conquest.conquerVillage({
      attackerVillageId: attackerId,
      targetVillageId: barbarian.id,
      attackerUserId: user.userId,
    });
    expect(result.success).toBe(true);

    const conquered = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: barbarian.id },
    });
    expect(conquered.userId).toBe(user.userId);

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: barbarian.id },
      { timeoutMs: 5_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('crown production: tick → crowns.changed dispatched for active membership', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(ctx.server, user.accessToken, world.id, 'crown-village');

    // Backdate so the tick computes a non-zero production (event is gated on production > 0)
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { lastUpdateTs: new Date(Date.now() - 86_400_000) },
    });

    await ctx.boss.send('crowns:production', {});

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'crowns.changed', aggregateId: user.userId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('barbarian backfill: enabled world → handleBackfill seeds new BVs around recent villages', async () => {
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
        } as object,
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
    await ctx.app.get(BarbarianBackfillWorker).handleBackfill();
    const after = await ctx.prisma.village.count({
      where: { worldId, isBarbarian: true },
    });

    expect(after).toBeGreaterThan(before);
  });

  it('jwt auth: register → access protected → refresh → access with new token', async () => {
    const {
      email,
      accessToken: t1,
      refreshToken,
    } = await registerUser(ctx.server);

    const r1 = await request(ctx.server)
      .get('/world/me/memberships')
      .set('Authorization', `Bearer ${t1}`);
    expect(r1.status).toBe(200);

    const refreshed = await request(ctx.server)
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(refreshed.status).toBeLessThan(300);
    const t2 = refreshed.body.accessToken as string;
    expect(t2).toBeTruthy();

    const r2 = await request(ctx.server)
      .get('/world/me/memberships')
      .set('Authorization', `Bearer ${t2}`);
    expect(r2.status).toBe(200);

    const login = await request(ctx.server)
      .post('/auth/login')
      .send({ email, password: 'smoke-password-123' });
    expect(login.status).toBeLessThan(300);
    expect(login.body.accessToken).toBeTruthy();
  });

  it('fog of war: GET /world/:id/entities masks barbarians outside vision disks', async () => {
    // Player has no WATCHTOWER → 0 vision disks → every world entity comes back as 'fogged'
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(ctx.server, user.accessToken, world.id, 'fog-watcher');

    await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'fogged-barb',
        x: 250,
        y: 250,
        tier: 'T1',
      },
    });

    const res = await request(ctx.server)
      .get(`/world/${world.id}/entities`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(200);

    const entities = res.body as Array<{
      id: string;
      kind: string;
      x: number;
      y: number;
    }>;
    const found = entities.find((e) => e.x === 250 && e.y === 250);
    expect(found).toBeTruthy();
    expect(found?.kind).toBe('fogged');
  });

  it('outbox dispatch: real Socket.IO client receives building.completed', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'ws-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });

    const client: ClientSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: user.accessToken },
      transports: ['websocket'],
      forceNew: true,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        client.once('connect', () => resolve());
        client.once('connect_error', (err) => reject(err));
        setTimeout(() => reject(new Error('socket connect timeout')), 5_000);
      });

      const received = new Promise<unknown>((resolve, reject) => {
        client.once('building.completed', (data) => resolve(data));
        setTimeout(
          () => reject(new Error('building.completed not received within 15s')),
          15_000,
        );
      });

      await request(ctx.server)
        .post(`/village/${villageId}/upgrade`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ buildingType: 'WOOD' });

      const payload = await received;
      expect(payload).toBeTruthy();
    } finally {
      client.disconnect();
    }
  });
});
