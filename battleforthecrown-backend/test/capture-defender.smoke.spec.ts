import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';
import { ConquestService } from '../src/modules/combat/conquest.service';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';

/**
 * Run #094 — defender-facing capture-window visibility (mirror of run #086 for
 * the besieged side).
 *
 * Covers: the `GET /combat/captures/targeting-me` endpoint lists OPEN capture
 * windows targeting the caller's own villages (ownership enforced server-side),
 * the DTO is fog-of-war safe (no attacker identity/origin), a barbarian target
 * is never listed, non-owners never see another player's window, the
 * `status = OPEN` filter drops resolved windows, the attacker-side
 * `getOpenConquests` is unchanged, and the `capture-window-completed` event
 * carries the `previousOwnerUserId` snapshot so the planner can route the
 * original owner.
 */
describe('capture defender smoke', () => {
  let ctx: SmokeContext;

  const DEFENDER_DTO_KEYS = [
    'captureStartedAt',
    'captureUntil',
    'pendingConquestId',
    'status',
    'targetCastleLevel',
    'targetName',
    'targetVillageId',
    'targetX',
    'targetY',
  ].sort();

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function createPlayerVillage(
    worldId: string,
    userId: string,
    x: number,
    y: number,
    name: string,
    castleLevel = 5,
  ) {
    return ctx.prisma.village.create({
      data: {
        worldId,
        userId,
        naturalTrait: 'PLAINS',
        isBarbarian: false,
        name,
        x,
        y,
        resourceStock: {
          create: { wood: 100, stone: 100, iron: 100, maxPerType: 100_000 },
        },
        buildings: { create: [{ type: 'CASTLE', level: castleLevel }] },
      },
    });
  }

  it('lists the defender window with a fog-safe DTO, hides it from non-owners, excludes barbarians and non-OPEN', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(ctx.server, `capdef-atk-${Date.now()}`);
    const attackerJoin = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'capdef-attacker',
    );
    const defender = await registerUser(ctx.server, `capdef-def-${Date.now()}`);
    await ctx.prisma.worldMembership.create({
      data: {
        userId: defender.userId,
        worldId: world.id,
        joinedAt: new Date(),
      },
    });

    const defenderVillage = await createPlayerVillage(
      world.id,
      defender.userId,
      attackerJoin.village.x + 3,
      attackerJoin.village.y,
      'capdef-defender-village',
      6,
    );
    const captureUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const pending = await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: attackerJoin.village.id,
        attackerUserId: attacker.userId,
        targetVillageId: defenderVillage.id,
        worldId: world.id,
        captureUntil,
        status: 'OPEN',
      },
    });

    // Defender sees their own besieged village, fog-safe.
    const defenderView = await request(ctx.server)
      .get('/combat/captures/targeting-me')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect(defenderView.status).toBe(200);
    const windows = defenderView.body as Array<Record<string, unknown>>;
    expect(windows).toHaveLength(1);
    const window = windows[0];
    expect(Object.keys(window).sort()).toEqual(DEFENDER_DTO_KEYS);
    expect(window).toMatchObject({
      pendingConquestId: pending.id,
      targetVillageId: defenderVillage.id,
      targetName: 'capdef-defender-village',
      targetX: defenderVillage.x,
      targetY: defenderVillage.y,
      targetCastleLevel: 6,
      captureUntil: captureUntil.toISOString(),
      status: 'OPEN',
    });
    // No attacker identity/origin leaks through.
    expect(window).not.toHaveProperty('attackerUserId');
    expect(window).not.toHaveProperty('attackerVillageId');
    expect(window).not.toHaveProperty('attackerVillageName');

    // The attacker (non-owner of the target) never sees the defender window.
    const attackerView = await request(ctx.server)
      .get('/combat/captures/targeting-me')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(attackerView.status).toBe(200);
    expect(attackerView.body).toEqual([]);

    // The attacker's own conquest feed is unchanged and still lists the window.
    const openConquests = await request(ctx.server)
      .get('/combat/conquests/open')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(openConquests.status).toBe(200);
    expect(
      (openConquests.body as Array<{ pendingConquestId: string }>).map(
        (c) => c.pendingConquestId,
      ),
    ).toContain(pending.id);

    // A barbarian target is never surfaced to any defender.
    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        naturalTrait: 'PLAINS',
        isBarbarian: true,
        name: 'capdef-barbarian',
        x: attackerJoin.village.x + 5,
        y: attackerJoin.village.y,
        tier: 'T2',
        resourceStock: {
          create: { wood: 100, stone: 100, iron: 100, maxPerType: 100_000 },
        },
      },
    });
    await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: attackerJoin.village.id,
        attackerUserId: attacker.userId,
        targetVillageId: barbarian.id,
        worldId: world.id,
        captureUntil,
        status: 'OPEN',
      },
    });
    const stillOne = await request(ctx.server)
      .get('/combat/captures/targeting-me')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect((stillOne.body as unknown[]).length).toBe(1);

    // A resolved (COMPLETED) window drops out of the defender feed.
    await ctx.prisma.pendingConquest.update({
      where: { id: pending.id },
      data: { status: 'COMPLETED' },
    });
    const afterComplete = await request(ctx.server)
      .get('/combat/captures/targeting-me')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect(afterComplete.body).toEqual([]);
  });

  it('emits capture-window-completed with the previousOwnerUserId snapshot on a player target', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(ctx.server, `capdef-fin-${Date.now()}`);
    const attackerJoin = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'capdef-finalize-attacker',
    );
    const defender = await registerUser(
      ctx.server,
      `capdef-fdef-${Date.now()}`,
    );
    await ctx.prisma.worldMembership.create({
      data: {
        userId: defender.userId,
        worldId: world.id,
        joinedAt: new Date(),
      },
    });
    const defenderVillage = await createPlayerVillage(
      world.id,
      defender.userId,
      attackerJoin.village.x + 1,
      attackerJoin.village.y,
      'capdef-finalize-defender',
    );

    // Install the attacker's noble in the besieged village (occupation garrison).
    await ctx.prisma.garrison.create({
      data: {
        villageId: defenderVillage.id,
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
      targetVillageId: defenderVillage.id,
      attackerUserId: attacker.userId,
      captureUntil: new Date(Date.now() + 100),
    });

    await conquest.finalizeCaptureWindow(pending.id);

    const completed = await outboxDispatched(
      ctx.prisma,
      {
        kind: 'village.capture-window-completed',
        aggregateId: defenderVillage.id,
      },
      { timeoutMs: 10_000 },
    );
    const payload = completed.payload as Record<string, unknown>;
    expect(payload).toMatchObject({
      pendingConquestId: pending.id,
      targetVillageId: defenderVillage.id,
      newOwnerUserId: attacker.userId,
      previousOwnerUserId: defender.userId,
    });
  });
});
