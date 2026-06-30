import request from 'supertest';
import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import { CrownsService } from '../src/modules/crowns/crowns.service';
import { RetentionService } from '../src/modules/retention/retention.service';
import { WorldAccessService } from '../src/modules/world/world-access.service';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('world-archive lifecycle smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('ENDED past archiveAfterDays → ARCHIVED: purge world-scoped data, keep reports/snapshot/membership, read-only, idempotent', async () => {
    // 1. Seed OPEN world.
    const world = await ctx.prisma.world.create({
      data: {
        id: `archive-${Date.now()}`,
        name: 'Archive Lifecycle Smoke',
        status: 'OPEN',
        config: { ...SMOKE_WORLD_CONFIG, fogOfWar: { enabled: false } },
      },
    });
    const worldId = world.id;

    // 2. Two members join → villages, buildings, resource stocks, population,
    //    crown balances, zone capacities, onboarding states, memberships.
    const owner = await registerUser(ctx.server, 'arc-own-' + Date.now());
    const other = await registerUser(ctx.server, 'arc-oth-' + Date.now());
    const joinOwner = await joinWorld(
      ctx.server,
      owner.accessToken,
      worldId,
      'village-owner',
    );
    await joinWorld(ctx.server, other.accessToken, worldId, 'village-other');
    const ownerVillageId = joinOwner.village.id;

    // 3. Trigger a DailyCard (lazy create via retention summary) so we can prove
    //    it is purged AND not recreated by a post-archive read.
    const retention = ctx.app.get(RetentionService);
    await retention.getSummary(owner.userId, worldId);

    // 4. Seed data that MUST survive the wipe (denormalised worldId, no FK to
    //    Village/World cascade): a CombatReport for this world.
    await ctx.prisma.combatReport.create({
      data: {
        worldId,
        attackerVillageId: ownerVillageId,
        attackerUserId: owner.userId,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 1,
        targetY: 1,
        loot: {},
        lossesAttacker: {},
        details: {},
      },
    });

    // 5. Seed a VillageIntel row (lead decision: purged — ephemeral per-world
    //    intel scoped to villages that no longer exist after the wipe).
    await ctx.prisma.villageIntel.create({
      data: {
        userId: owner.userId,
        worldId,
        targetVillageId: ownerVillageId,
        sourceKind: 'SCOUT',
        sourceReportId: 'smoke-intel',
        units: {},
        resources: {},
        targetX: 1,
        targetY: 1,
        seenAt: new Date(),
      },
    });

    // 5b. Seed private map markers for BOTH players (run 085) — denormalised
    //     worldId, no FK cascade. Must be purged with the rest of the kingdom.
    await ctx.prisma.mapMarker.createMany({
      data: [
        { userId: owner.userId, worldId, x: 1, y: 1, kind: 'TARGET' },
        { userId: owner.userId, worldId, x: 2, y: 2, kind: 'DANGER' },
        { userId: other.userId, worldId, x: 3, y: 3, kind: 'TO_SCOUT' },
      ],
    });

    // 5c. Seed a Friendship between the two members (run 063 table). It only
    //     cascades on World/User delete — neither happens at the wipe (World is
    //     kept), so it must be purged explicitly or it leaks as orphan data.
    await ctx.prisma.friendship.create({
      data: {
        worldId,
        requesterUserId: owner.userId,
        recipientUserId: other.userId,
        status: 'ACTIVE',
        acceptedAt: new Date(),
      },
    });

    // Pre-conditions: the purge targets exist.
    expect(await ctx.prisma.village.count({ where: { worldId } })).toBe(2);
    expect(await ctx.prisma.crownBalance.count({ where: { worldId } })).toBe(2);
    expect(
      await ctx.prisma.dailyCard.count({ where: { worldId } }),
    ).toBeGreaterThanOrEqual(1);
    expect(await ctx.prisma.villageIntel.count({ where: { worldId } })).toBe(1);
    expect(await ctx.prisma.mapMarker.count({ where: { worldId } })).toBe(3);
    expect(await ctx.prisma.friendship.count({ where: { worldId } })).toBe(1);

    // 6. Force LOCKED with endsAt well past `endsAt + archiveAfterDays` so a
    //    single tick does LOCKED → ENDED (snapshot) → ARCHIVED (purge).
    await ctx.prisma.world.update({
      where: { id: worldId },
      data: {
        status: 'LOCKED',
        startedAt: new Date(Date.now() - 61 * DAY_MS),
        endsAt: new Date(Date.now() - 30 * DAY_MS),
      },
    });

    const worker = ctx.app.get(WorldLifecycleWorker);
    const result = await worker.handleLifecycleTick(new Date());
    expect(result.lockedToEnded).toBe(1);
    expect(result.endedToArchived).toBe(1);

    // 7a. World ARCHIVED + archivedAt set; world row itself conserved.
    const archived = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: worldId },
    });
    expect(archived.status).toBe('ARCHIVED');
    expect(archived.archivedAt).not.toBeNull();

    // 7b. Player world-state purged.
    expect(await ctx.prisma.village.count({ where: { worldId } })).toBe(0);
    expect(await ctx.prisma.crownBalance.count({ where: { worldId } })).toBe(0);
    expect(await ctx.prisma.dailyCard.count({ where: { worldId } })).toBe(0);
    expect(await ctx.prisma.villageIntel.count({ where: { worldId } })).toBe(0);
    expect(await ctx.prisma.mapMarker.count({ where: { worldId } })).toBe(0);
    expect(await ctx.prisma.friendship.count({ where: { worldId } })).toBe(0);
    expect(await ctx.prisma.expedition.count({ where: { worldId } })).toBe(0);
    // Village cascade reached its children.
    expect(
      await ctx.prisma.building.count({ where: { village: { worldId } } }),
    ).toBe(0);
    expect(
      await ctx.prisma.population.count({ where: { village: { worldId } } }),
    ).toBe(0);

    // 7c. Durable data conserved.
    expect(
      await ctx.prisma.combatReport.count({ where: { worldId } }),
    ).toBeGreaterThan(0);
    expect(
      await ctx.prisma.worldFinalRankingSnapshot.count({ where: { worldId } }),
    ).toBeGreaterThan(0);
    expect(await ctx.prisma.worldMembership.count({ where: { worldId } })).toBe(
      2,
    );

    // 7d. Exactly one ENDED → ARCHIVED Outbox event emitted.
    const archiveEvents = await ctx.prisma.eventOutbox.count({
      where: {
        kind: 'world.status.changed',
        aggregateId: worldId,
        payload: { path: ['to'], equals: 'ARCHIVED' },
      },
    });
    expect(archiveEvents).toBe(1);

    // 7e. World no longer listed publicly.
    const publicRes = await request(ctx.server).get('/worlds/public');
    expect(publicRes.status).toBe(200);
    const publicIds = (publicRes.body as Array<{ id: string }>).map(
      (w) => w.id,
    );
    expect(publicIds).not.toContain(worldId);

    // 7f. Read-only invariant extended to ARCHIVED: the writability helper
    //     rejects with WORLD_READ_ONLY (same code as ENDED). Asserted directly
    //     because, post-purge, the player has no village left and a REST combat
    //     mutation 404s on the missing village before reaching the guard.
    const worldAccess = ctx.app.get(WorldAccessService);
    await expect(
      worldAccess.assertWorldWritable(worldId),
    ).rejects.toMatchObject({ response: { code: 'WORLD_READ_ONLY' } });
    // And the REST mutation is rejected (4xx, never a 2xx write).
    const attackBlocked = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        villageId: ownerVillageId,
        targetX: 1,
        targetY: 1,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'whatever',
        units: { MILITIA: 1 },
      });
    expect(attackBlocked.status).toBeGreaterThanOrEqual(400);

    // 7g. Side-effecting reads must NOT recreate purged rows post-archive.
    const crowns = ctx.app.get(CrownsService);
    const balance = await crowns.getCrownBalance(owner.userId, worldId);
    expect(balance.balance).toBe(0);
    expect(await ctx.prisma.crownBalance.count({ where: { worldId } })).toBe(0);

    await retention.getSummary(owner.userId, worldId);
    expect(await ctx.prisma.dailyCard.count({ where: { worldId } })).toBe(0);

    // 7h. Idempotence: a second tick archives nothing and emits no new event.
    const second = await worker.handleLifecycleTick(new Date());
    expect(second.endedToArchived).toBe(0);
    const archiveEventsAfter = await ctx.prisma.eventOutbox.count({
      where: {
        kind: 'world.status.changed',
        aggregateId: worldId,
        payload: { path: ['to'], equals: 'ARCHIVED' },
      },
    });
    expect(archiveEventsAfter).toBe(1);
  }, 90_000);

  it('ENDED within the archive window stays ENDED (archiveAfterDays gate)', async () => {
    const world = await ctx.prisma.world.create({
      data: {
        id: `archive-window-${Date.now()}`,
        name: 'Archive Window Smoke',
        status: 'ENDED',
        startedAt: new Date(Date.now() - 61 * DAY_MS),
        // endsAt 1 day ago → archiveAt = endsAt + 7j is still in the future.
        endsAt: new Date(Date.now() - 1 * DAY_MS),
        config: { ...SMOKE_WORLD_CONFIG },
      },
    });

    const worker = ctx.app.get(WorldLifecycleWorker);
    const result = await worker.handleLifecycleTick(new Date());
    expect(result.endedToArchived).toBe(0);

    const after = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: world.id },
    });
    expect(after.status).toBe('ENDED');
    expect(after.archivedAt).toBeNull();
  }, 60_000);
});
