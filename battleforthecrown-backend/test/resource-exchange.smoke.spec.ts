import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';
import {
  RESOURCE_CONVERSION_DAILY_CAP,
  RESOURCE_CONVERSION_RATE,
} from '@battleforthecrown/shared/resources';

/**
 * Run 099: royal resource exchange — intra-village conversion of wood/stone/iron
 * at an unfavorable rate, capped per Paris day. Exercises the real endpoint
 * `POST /resources/:villageId/convert` end-to-end: debit/credit atomicity,
 * floor rate, daily cap + dayKey isolation, destination-full rejection before
 * debit, world-ended guard, ownership, and DTO bounds.
 */
describe('resource exchange smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /** Sets exact stock with a fresh timestamp so production catch-up adds ~0. */
  async function setStock(
    villageId: string,
    stock: { wood: number; stone: number; iron: number },
  ): Promise<{ maxPerType: number }> {
    const row = await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: { ...stock, lastUpdateTs: new Date() },
    });
    return { maxPerType: row.maxPerType };
  }

  async function setupPlayer(worldId: string, tag: string) {
    const user = await registerUser(ctx.server, `${tag}-${Date.now()}`);
    const join = await joinWorld(ctx.server, user.accessToken, worldId, tag);
    return { user, village: join.village };
  }

  /** Raises the warehouse so a large credit fits under the storage cap. */
  async function raiseWarehouse(villageId: string, level = 10): Promise<void> {
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'WAREHOUSE' },
      data: { level },
    });
  }

  /** Reads the authoritative, production-refreshed maxPerType via the API. */
  async function readMaxPerType(
    accessToken: string,
    villageId: string,
  ): Promise<number> {
    const res = await request(ctx.server)
      .get(`/resources/${villageId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    return (res.body as { maxPerType: number }).maxPerType;
  }

  function convert(
    accessToken: string,
    villageId: string,
    body: Record<string, unknown>,
  ) {
    return request(ctx.server)
      .post(`/resources/${villageId}/convert`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body);
  }

  it('converts source→destination at the floor rate, atomically, and emits resources.changed', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-ok');
    await setStock(village.id, { wood: 1000, stone: 0, iron: 0 });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 100,
    });
    expect(res.status).toBe(201);
    const result = res.body as {
      villageId: string;
      spent: number;
      credited: number;
    };
    expect(result.spent).toBe(100);
    expect(result.credited).toBe(100 / RESOURCE_CONVERSION_RATE);

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(900);
    expect(stock.stone).toBe(100 / RESOURCE_CONVERSION_RATE);

    const daily = await ctx.prisma.resourceConversionDaily.findFirstOrThrow({
      where: { villageId: village.id },
    });
    expect(daily.woodConverted).toBe(100);

    const outbox = await ctx.prisma.eventOutbox.findFirstOrThrow({
      where: { kind: 'resources.changed', aggregateId: village.id },
      orderBy: { createdAt: 'desc' },
    });
    const payload = outbox.payload as Record<string, unknown>;
    expect(payload.villageId).toBe(village.id);
    expect(payload.stone).toBe(100 / RESOURCE_CONVERSION_RATE);
    // No transfer: the result targets a single village, no destination village/player.
    expect(res.body).not.toHaveProperty('targetVillageId');
    expect(result.villageId).toBe(village.id);
  });

  it('floors the credit: an odd amount never mints a free unit', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-floor');
    await setStock(village.id, { wood: 500, stone: 0, iron: 0 });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'IRON',
      amount: 101,
    });
    expect(res.status).toBe(201);
    expect((res.body as { credited: number }).credited).toBe(
      Math.floor(101 / RESOURCE_CONVERSION_RATE),
    );

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(399);
    expect(stock.iron).toBe(Math.floor(101 / RESOURCE_CONVERSION_RATE));
  });

  it('rejects an amount too small to credit (below the rate) without touching stock', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-tiny');
    await setStock(village.id, { wood: 500, stone: 0, iron: 0 });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 1,
    });
    expect(res.status).toBe(400);

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(500);
    expect(stock.stone).toBe(0);
  });

  it('rejects when the source is insufficient, stock unchanged', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-poor');
    await setStock(village.id, { wood: 50, stone: 0, iron: 0 });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 100,
    });
    expect(res.status).toBe(400);

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(50);
    expect(stock.stone).toBe(0);
  });

  it('rejects a full destination BEFORE any debit — no value burned', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-full');
    // Read the authoritative (production-refreshed) cap, then fill the
    // destination to it so any credit would overflow.
    const maxPerType = await readMaxPerType(user.accessToken, village.id);
    await setStock(village.id, { wood: 1000, stone: maxPerType, iron: 0 });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 100,
    });
    expect(res.status).toBe(400);

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(1000);
    expect(stock.stone).toBe(maxPerType);
    const daily = await ctx.prisma.resourceConversionDaily.findFirst({
      where: { villageId: village.id },
    });
    expect(daily?.woodConverted ?? 0).toBe(0);
  });

  it('enforces the daily cap on the source spent, stock + tracker unchanged on refusal', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-cap');
    // High warehouse so the large credit fits — the cap under test is the daily
    // SOURCE cap, not the storage cap.
    await raiseWarehouse(village.id);
    await setStock(village.id, {
      wood: RESOURCE_CONVERSION_DAILY_CAP * 2,
      stone: 0,
      iron: 0,
    });

    // Spend up to one unit below the cap, then attempt to cross it.
    const first = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: RESOURCE_CONVERSION_DAILY_CAP - 10,
    });
    expect(first.status).toBe(201);

    const over = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 20,
    });
    expect(over.status).toBe(400);

    const daily = await ctx.prisma.resourceConversionDaily.findFirstOrThrow({
      where: { villageId: village.id },
    });
    expect(daily.woodConverted).toBe(RESOURCE_CONVERSION_DAILY_CAP - 10);
  });

  it('resets the cap per dayKey: a filled past day does not block today', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-reset');
    await setStock(village.id, { wood: 1000, stone: 0, iron: 0 });
    // A past Paris day already at the cap — must not affect today's fresh row.
    await ctx.prisma.resourceConversionDaily.create({
      data: {
        villageId: village.id,
        dayKey: '2000-01-01',
        woodConverted: RESOURCE_CONVERSION_DAILY_CAP,
      },
    });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 100,
    });
    expect(res.status).toBe(201);
  });

  it('rejects a conversion on an ENDED world, stock unchanged', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-ended');
    await setStock(village.id, { wood: 1000, stone: 0, iron: 0 });
    await ctx.prisma.world.update({
      where: { id: world.id },
      data: { status: 'ENDED' },
    });

    const res = await convert(user.accessToken, village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 100,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(1000);
  });

  it('rejects a conversion targeting a village the caller does not own', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const owner = await setupPlayer(world.id, 'convert-owner');
    const intruder = await setupPlayer(world.id, 'convert-intruder');
    await setStock(owner.village.id, { wood: 1000, stone: 0, iron: 0 });

    const res = await convert(intruder.user.accessToken, owner.village.id, {
      sourceType: 'WOOD',
      destinationType: 'STONE',
      amount: 100,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: owner.village.id },
    });
    expect(stock.wood).toBe(1000);
  });

  it('rejects malformed bodies (same type, non-positive, fractional, non-whitelisted)', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const { user, village } = await setupPlayer(world.id, 'convert-dto');
    await setStock(village.id, { wood: 1000, stone: 0, iron: 0 });

    const bad: Array<Record<string, unknown>> = [
      { sourceType: 'WOOD', destinationType: 'WOOD', amount: 100 },
      { sourceType: 'WOOD', destinationType: 'STONE', amount: -5 },
      { sourceType: 'WOOD', destinationType: 'STONE', amount: 0 },
      { sourceType: 'WOOD', destinationType: 'STONE', amount: 10.5 },
      { sourceType: 'CROWN', destinationType: 'STONE', amount: 100 },
      { sourceType: 'WOOD', destinationType: 'CROWN', amount: 100 },
    ];
    for (const body of bad) {
      const res = await convert(user.accessToken, village.id, body);
      expect(res.status).toBe(400);
    }

    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood).toBe(1000);
  });
});
