import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

/**
 * Run #086 — defender-facing incoming-attack visibility.
 *
 * Covers: the `attack.incoming` Outbox event is routed to the defender only,
 * the `GET /combat/:villageId/incoming` endpoint lists the ETA for the owner
 * (ownership enforced), the payload is fog-of-war safe, a barbarian target is
 * never routed, and resolved/past expeditions drop out of the list.
 */
describe('incoming attack smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function expireShield(userId: string, worldId: string): Promise<void> {
    await ctx.prisma.worldMembership.update({
      where: { userId_worldId: { userId, worldId } },
      data: { joinedAt: new Date(Date.now() - 49 * 60 * 60 * 1000) },
    });
  }

  async function setupAttacker(worldId: string, name: string) {
    const user = await registerUser(ctx.server);
    const join = await joinWorld(ctx.server, user.accessToken, worldId, name);
    await ctx.prisma.unitInventory.create({
      data: { villageId: join.village.id, unitType: 'MILITIA', quantity: 50 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: join.village.id, type: 'WATCHTOWER' },
      data: { level: 1 },
    });
    await expireShield(user.userId, worldId);
    return {
      userId: user.userId,
      accessToken: user.accessToken,
      villageId: join.village.id,
      x: join.village.x,
      y: join.village.y,
    };
  }

  async function setupDefender(
    worldId: string,
    attackerX: number,
    attackerY: number,
    name: string,
  ) {
    const user = await registerUser(ctx.server);
    const village = await ctx.prisma.village.create({
      data: {
        worldId,
        userId: user.userId,
        isBarbarian: false,
        name,
        x: attackerX + 2,
        y: attackerY,
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });
    // Real kingdom power so the ÷3 power guard never pre-empts the attack.
    await ctx.prisma.unitInventory.create({
      data: { villageId: village.id, unitType: 'MILITIA', quantity: 1000 },
    });
    await ctx.prisma.worldMembership.create({
      data: { userId: user.userId, worldId, joinedAt: new Date() },
    });
    await expireShield(user.userId, worldId);
    return {
      userId: user.userId,
      accessToken: user.accessToken,
      villageId: village.id,
      x: village.x,
      y: village.y,
    };
  }

  it('routes attack.incoming to the defender, lists the ETA, keeps battle.sent for the attacker, and hides the attacker', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'incoming-attacker');
    const defender = await setupDefender(
      world.id,
      attacker.x,
      attacker.y,
      'incoming-defender',
    );

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: defender.x,
        targetY: defender.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: defender.villageId,
        units: { MILITIA: 10 },
      });
    expect(res.status).toBeLessThan(300);
    const expeditionId = (res.body as { id: string }).id;

    // Defender-facing event: routed to the target village, fog-of-war safe.
    const incomingRow = await ctx.prisma.eventOutbox.findFirstOrThrow({
      where: { kind: 'attack.incoming', aggregateId: defender.villageId },
    });
    const payload = incomingRow.payload as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(
      [
        'arrivalAt',
        'expeditionId',
        'targetVillageId',
        'targetX',
        'targetY',
      ].sort(),
    );
    expect(payload).toMatchObject({
      expeditionId,
      targetVillageId: defender.villageId,
      targetX: defender.x,
      targetY: defender.y,
    });

    // Attacker's outbound event is unchanged and still routed to the attacker.
    const battleSent = await ctx.prisma.eventOutbox.findFirst({
      where: { kind: 'battle.sent', aggregateId: attacker.villageId },
    });
    expect(battleSent).not.toBeNull();

    // Endpoint: the owner sees the inbound threat with only safe fields.
    const ownerView = await request(ctx.server)
      .get(`/combat/${defender.villageId}/incoming`)
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect(ownerView.status).toBe(200);
    const ownerThreats = ownerView.body as Array<Record<string, unknown>>;
    expect(ownerThreats).toHaveLength(1);
    const threat = ownerThreats[0];
    expect(Object.keys(threat).sort()).toEqual(
      [
        'arrivalAt',
        'expeditionId',
        'targetVillageId',
        'targetX',
        'targetY',
      ].sort(),
    );
    expect(threat).toMatchObject({
      expeditionId,
      targetVillageId: defender.villageId,
    });

    // Ownership: the attacker cannot read the defender's incoming list.
    const foreignView = await request(ctx.server)
      .get(`/combat/${defender.villageId}/incoming`)
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(foreignView.status).toBe(404);
  });

  it('never routes attack.incoming for a barbarian target', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'barb-incoming-attacker');
    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-incoming-target',
        x: attacker.x + 1,
        y: attacker.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'MILITIA', quantity: 5 },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 10 },
      });
    expect(res.status).toBeLessThan(300);

    const incomingCount = await ctx.prisma.eventOutbox.count({
      where: { kind: 'attack.incoming', aggregateId: barbarian.id },
    });
    expect(incomingCount).toBe(0);
  });

  it('lists only unresolved, future attacks targeting an owned village, soonest first', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const owner = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      owner.accessToken,
      world.id,
      'incoming-filter-owner',
    );
    const villageId = join.village.id;

    const base = {
      worldId: world.id,
      attackerVillageId: villageId,
      kind: 'ATTACK' as const,
      targetKind: 'PLAYER_VILLAGE' as const,
      targetRefId: villageId,
      targetX: join.village.x,
      targetY: join.village.y,
      units: { MILITIA: 10 },
      departAt: new Date(),
      outboundTravelMs: 60_000,
    };

    // Two future threats with distinct ETAs to lock the arrivalAt ASC contract.
    const futureFar = await ctx.prisma.expedition.create({
      data: {
        ...base,
        status: 'EN_ROUTE',
        arrivalAt: new Date(Date.now() + 3_600_000),
      },
    });
    const futureSoon = await ctx.prisma.expedition.create({
      data: {
        ...base,
        status: 'EN_ROUTE',
        arrivalAt: new Date(Date.now() + 600_000),
      },
    });
    // Excluded: already arrived (past).
    await ctx.prisma.expedition.create({
      data: {
        ...base,
        status: 'EN_ROUTE',
        arrivalAt: new Date(Date.now() - 60_000),
      },
    });
    // Excluded: resolved.
    await ctx.prisma.expedition.create({
      data: {
        ...base,
        status: 'RESOLVED',
        arrivalAt: new Date(Date.now() + 3_600_000),
      },
    });

    const view = await request(ctx.server)
      .get(`/combat/${villageId}/incoming`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(view.status).toBe(200);
    const threats = view.body as Array<{ expeditionId: string }>;
    expect(threats.map((t) => t.expeditionId)).toEqual([
      futureSoon.id,
      futureFar.id,
    ]);
  });
});
