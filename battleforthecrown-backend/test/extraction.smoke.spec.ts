import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';
import { ExtractionLifecycleService } from '../src/modules/gameplay/extraction-lifecycle.service';
import { computeExtractedAmount } from '@battleforthecrown/shared/extraction';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

/**
 * Run 091 T4-T9: resource extraction sites — dispatch, exposition (fog),
 * lifecycle (arrival/completion/return/depletion+respawn), interception,
 * and world-ended rejection.
 *
 * Time is never awaited: `handleArrival`/`handleCompletion`/`handleReturn`/
 * `handleInterception` are invoked directly on the real
 * `ExtractionLifecycleService` (fetched from the Nest app), and
 * `exploitationEndsAt` is bumped into the past via a direct Prisma update to
 * simulate elapsed exploitation time before calling `handleCompletion`.
 */
describe('extraction smoke', () => {
  let ctx: SmokeContext;
  let lifecycle: ExtractionLifecycleService;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
    lifecycle = ctx.app.get(ExtractionLifecycleService);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /** Bumps a village's population ceiling so a 5-30 villager team always fits. */
  async function raisePopulationCap(
    villageId: string,
    max = 60,
  ): Promise<void> {
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 0, max },
    });
  }

  /** Bumps a village's watchtower so a nearby site sits inside vision. */
  async function raiseWatchtower(villageId: string, level = 2): Promise<void> {
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'WATCHTOWER' },
      data: { level },
    });
  }

  async function createSite(
    worldId: string,
    x: number,
    y: number,
    overrides: Partial<{
      resourceType: 'WOOD' | 'STONE' | 'IRON';
      remainingCapacity: number;
      initialCapacity: number;
    }> = {},
  ) {
    return ctx.prisma.resourceExtractionSite.create({
      data: {
        worldId,
        x,
        y,
        resourceType: overrides.resourceType ?? 'WOOD',
        initialCapacity: overrides.initialCapacity ?? 12_000,
        remainingCapacity: overrides.remainingCapacity ?? 12_000,
        state: 'ACTIVE',
      },
    });
  }

  async function setupPlayer(worldId: string, tag: string) {
    const user = await registerUser(ctx.server, `${tag}-${Date.now()}`);
    const join = await joinWorld(ctx.server, user.accessToken, worldId, tag);
    await raisePopulationCap(join.village.id);
    await raiseWatchtower(join.village.id);
    return { user, village: join.village };
  }

  // --- a-e: dispatch + exposition ---------------------------------------

  describe('dispatch and exposition', () => {
    it('dispatches an extraction team: 201, population locked, EN_ROUTE expedition, extraction.started outbox row', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user, village } = await setupPlayer(world.id, 'dispatch-ok');
      const site = await createSite(world.id, village.x + 5, village.y);

      const res = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 2,
          villagers: 10,
        });
      expect(res.status).toBe(201);

      const population = await ctx.prisma.population.findUniqueOrThrow({
        where: { villageId: village.id },
      });
      expect(population.used).toBe(10);

      const expedition = await ctx.prisma.expedition.findFirstOrThrow({
        where: { attackerVillageId: village.id, kind: 'EXTRACTION' },
      });
      expect(expedition.status).toBe('EN_ROUTE');
      expect(expedition.extractionSiteId).toBe(site.id);
      expect(expedition.extractionVillagers).toBe(10);

      const outboxRow = await ctx.prisma.eventOutbox.findFirstOrThrow({
        where: { kind: 'extraction.started', aggregateId: village.id },
      });
      expect(outboxRow.payload).toMatchObject({
        expeditionId: expedition.id,
        villageId: village.id,
        siteId: site.id,
      });
    });

    it('rejects a second extraction while one is already active for the player', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user, village } = await setupPlayer(world.id, 'dispatch-double');
      const siteA = await createSite(world.id, village.x + 3, village.y);
      const siteB = await createSite(world.id, village.x - 3, village.y);

      const first = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: siteA.id,
          durationHours: 2,
          villagers: 10,
        });
      expect(first.status).toBe(201);

      const second = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: siteB.id,
          durationHours: 2,
          villagers: 5,
        });
      expect(second.status).toBe(400);
    });

    it('rejects an escort exceeding the cap and villager counts outside bounds', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user, village } = await setupPlayer(world.id, 'dispatch-bounds');
      const site = await createSite(world.id, village.x + 3, village.y);
      await ctx.prisma.unitInventory.create({
        data: { villageId: village.id, unitType: 'MILITIA', quantity: 100 },
      });

      const escortOverCap = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 2,
          villagers: 10,
          escortUnits: { MILITIA: 51 },
        });
      expect(escortOverCap.status).toBe(400);

      const tooFewVillagers = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 2,
          villagers: 4,
        });
      expect(tooFewVillagers.status).toBe(400);

      const tooManyVillagers = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 2,
          villagers: 31,
        });
      expect(tooManyVillagers.status).toBe(400);
    });

    it('rejects a site placed outside the caller vision', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      // No watchtower bump here — default level 0 → radius 0 vision.
      const user = await registerUser(ctx.server, `dispatch-fog-${Date.now()}`);
      const join = await joinWorld(
        ctx.server,
        user.accessToken,
        world.id,
        'dispatch-fog',
      );
      await raisePopulationCap(join.village.id);
      const farSite = await createSite(
        world.id,
        join.village.x + 50,
        join.village.y + 50,
      );

      const res = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: join.village.id,
          siteId: farSite.id,
          durationHours: 2,
          villagers: 10,
        });
      expect(res.status).toBe(403);
    });

    it('GET /world/:id/entities: in-vision site exposes only {resourceType, activity}; out-of-vision site is absent even with fogOfWar disabled', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      await ctx.prisma.world.update({
        where: { id: world.id },
        data: {
          config: { ...SMOKE_WORLD_CONFIG, fogOfWar: { enabled: false } },
        },
      });

      const { user, village } = await setupPlayer(world.id, 'entities-viewer');
      const nearSite = await createSite(world.id, village.x + 5, village.y, {
        resourceType: 'IRON',
      });
      const farSite = await createSite(world.id, village.x + 400, village.y);

      const res = await request(ctx.server)
        .get(`/world/${world.id}/entities`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.status).toBe(200);

      const body = res.body as {
        entities: Array<{
          id: string;
          kind: string;
          data?: Record<string, unknown>;
        }>;
        fogOfWarEnabled: boolean;
      };
      expect(body.fogOfWarEnabled).toBe(false);

      const near = body.entities.find((e) => e.id === nearSite.id);
      expect(near).toMatchObject({
        id: nearSite.id,
        kind: 'RESOURCE_EXTRACTION_SITE',
        data: { resourceType: 'IRON', activity: 'IDLE' },
      });
      expect(Object.keys(near!.data!).sort()).toEqual([
        'activity',
        'resourceType',
      ]);

      const far = body.entities.find((e) => e.id === farSite.id);
      expect(far).toBeUndefined();
    });
  });

  // --- f-g: lifecycle (arrival/completion/return, depletion+respawn) ----

  describe('lifecycle', () => {
    it('handleArrival -> EXPLOITING; handleCompletion decrements the site and credits nothing yet; handleReturn credits stock, releases population, restores escort, deletes the expedition', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user, village } = await setupPlayer(world.id, 'lifecycle-full');
      await ctx.prisma.unitInventory.create({
        data: { villageId: village.id, unitType: 'MILITIA', quantity: 20 },
      });
      const site = await createSite(world.id, village.x + 5, village.y, {
        resourceType: 'STONE',
        remainingCapacity: 12_000,
      });

      const dispatchRes = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 2,
          villagers: 10,
          escortUnits: { MILITIA: 5 },
        });
      expect(dispatchRes.status).toBe(201);
      const expeditionId = (dispatchRes.body as { id: string }).id;

      const escortAfterDispatch =
        await ctx.prisma.unitInventory.findUniqueOrThrow({
          where: {
            villageId_unitType: { villageId: village.id, unitType: 'MILITIA' },
          },
        });
      expect(escortAfterDispatch.quantity).toBe(15);

      await lifecycle.handleArrival(expeditionId);
      const exploiting = await ctx.prisma.expedition.findUniqueOrThrow({
        where: { id: expeditionId },
      });
      expect(exploiting.status).toBe('EXPLOITING');
      expect(exploiting.exploitationEndsAt).toBeTruthy();

      const stockBeforeCompletion =
        await ctx.prisma.resourceStock.findUniqueOrThrow({
          where: { villageId: village.id },
        });

      await lifecycle.handleCompletion(expeditionId);

      const expectedAmount = computeExtractedAmount({
        villagers: 10,
        elapsedMs: 2 * 3_600_000,
        remainingCapacity: 12_000,
      });
      expect(expectedAmount).toBe(800);

      const siteAfterCompletion =
        await ctx.prisma.resourceExtractionSite.findUniqueOrThrow({
          where: { id: site.id },
        });
      expect(siteAfterCompletion.remainingCapacity).toBe(
        12_000 - expectedAmount,
      );

      const returning = await ctx.prisma.expedition.findUniqueOrThrow({
        where: { id: expeditionId },
      });
      expect(returning.status).toBe('RETURNING');
      expect(returning.loot).toMatchObject({
        resources: { stone: expectedAmount, wood: 0, iron: 0 },
      });

      // Crediting only happens on return, never on completion.
      const stockAfterCompletion =
        await ctx.prisma.resourceStock.findUniqueOrThrow({
          where: { villageId: village.id },
        });
      expect(Number(stockAfterCompletion.stone)).toBe(
        Number(stockBeforeCompletion.stone),
      );

      await lifecycle.handleReturn(expeditionId);

      const stockAfterReturn = await ctx.prisma.resourceStock.findUniqueOrThrow(
        {
          where: { villageId: village.id },
        },
      );
      expect(Number(stockAfterReturn.stone)).toBe(
        Number(stockAfterCompletion.stone) + expectedAmount,
      );

      const populationAfterReturn =
        await ctx.prisma.population.findUniqueOrThrow({
          where: { villageId: village.id },
        });
      expect(populationAfterReturn.used).toBe(0);

      const escortAfterReturn =
        await ctx.prisma.unitInventory.findUniqueOrThrow({
          where: {
            villageId_unitType: { villageId: village.id, unitType: 'MILITIA' },
          },
        });
      expect(escortAfterReturn.quantity).toBe(20);

      const expeditionAfterReturn = await ctx.prisma.expedition.findUnique({
        where: { id: expeditionId },
      });
      expect(expeditionAfterReturn).toBeNull();

      const returnedOutbox = await ctx.prisma.eventOutbox.findFirstOrThrow({
        where: { kind: 'extraction.returned', aggregateId: village.id },
      });
      expect(returnedOutbox.payload).toMatchObject({
        expeditionId,
        villageId: village.id,
        resources: { stone: expectedAmount, wood: 0, iron: 0 },
      });
    });

    it('handleCompletion on a near-empty site depletes it, respawns a new ACTIVE site of the same type, and caps the secured amount to remainingCapacity', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user, village } = await setupPlayer(
        world.id,
        'lifecycle-deplete',
      );
      const site = await createSite(world.id, village.x + 5, village.y, {
        resourceType: 'IRON',
        remainingCapacity: 50,
        initialCapacity: 12_000,
      });

      const dispatchRes = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 8,
          villagers: 30,
        });
      expect(dispatchRes.status).toBe(201);
      const expeditionId = (dispatchRes.body as { id: string }).id;

      await lifecycle.handleArrival(expeditionId);
      await lifecycle.handleCompletion(expeditionId);

      const depletedSite =
        await ctx.prisma.resourceExtractionSite.findUniqueOrThrow({
          where: { id: site.id },
        });
      expect(depletedSite.state).toBe('DEPLETED');
      expect(depletedSite.remainingCapacity).toBe(0);

      const returning = await ctx.prisma.expedition.findUniqueOrThrow({
        where: { id: expeditionId },
      });
      // 30 villagers * 40/h * 8h = 9600 raw, clamped to the 50 remaining.
      expect(returning.loot).toMatchObject({
        resources: { iron: 50, wood: 0, stone: 0 },
      });

      const respawned = await ctx.prisma.resourceExtractionSite.findFirst({
        where: {
          worldId: world.id,
          resourceType: 'IRON',
          state: 'ACTIVE',
          id: { not: site.id },
        },
      });
      expect(respawned).toBeTruthy();

      const depletedOutbox = await ctx.prisma.eventOutbox.findFirstOrThrow({
        where: { kind: 'extraction.depleted', aggregateId: site.id },
      });
      expect(depletedOutbox.payload).toMatchObject({
        siteId: site.id,
        resourceType: 'IRON',
      });
    });
  });

  // --- h: interception ---------------------------------------------------

  describe('interception', () => {
    it('an ATTACK vs EXTRACTION_SITE resolved via handleInterception steals a partial, non-jackpot amount and decrements the site by the full accrued', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user: victimUser, village: victimVillage } = await setupPlayer(
        world.id,
        'interception-victim',
      );
      const site = await createSite(
        world.id,
        victimVillage.x + 5,
        victimVillage.y,
        { resourceType: 'WOOD', remainingCapacity: 12_000 },
      );

      const dispatchRes = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${victimUser.accessToken}`)
        .send({
          villageId: victimVillage.id,
          siteId: site.id,
          durationHours: 8,
          villagers: 20,
        });
      expect(dispatchRes.status).toBe(201);
      const victimExpeditionId = (dispatchRes.body as { id: string }).id;
      await lifecycle.handleArrival(victimExpeditionId);

      // Simulate 4 hours of elapsed exploitation before the attacker arrives.
      const exploiting = await ctx.prisma.expedition.findUniqueOrThrow({
        where: { id: victimExpeditionId },
      });
      // exploitationStartedAt = exploitationEndsAt - extractionDurationMs, so
      // to get `elapsedMs = simulatedElapsedMs` from `Date.now()` we need
      // exploitationEndsAt = now + (durationMs - elapsedMs).
      const simulatedElapsedMs = 4 * 3_600_000;
      await ctx.prisma.expedition.update({
        where: { id: victimExpeditionId },
        data: {
          exploitationEndsAt: new Date(
            Date.now() +
              (exploiting.extractionDurationMs! - simulatedElapsedMs),
          ),
        },
      });

      const { user: attackerUser, village: attackerVillage } =
        await setupPlayer(world.id, 'interception-attacker');
      await ctx.prisma.village.update({
        where: { id: attackerVillage.id },
        data: { x: victimVillage.x + 4, y: victimVillage.y },
      });
      await ctx.prisma.unitInventory.create({
        data: {
          villageId: attackerVillage.id,
          unitType: 'MILITIA',
          quantity: 50,
        },
      });

      const attackRes = await request(ctx.server)
        .post('/combat/attack')
        .set('Authorization', `Bearer ${attackerUser.accessToken}`)
        .send({
          villageId: attackerVillage.id,
          targetX: site.x,
          targetY: site.y,
          targetKind: 'EXTRACTION_SITE',
          targetRefId: site.id,
          units: { MILITIA: 50 },
        });
      expect(attackRes.status).toBeLessThan(300);
      const attackerExpeditionId = (attackRes.body as { id: string }).id;

      const expectedAccrued = computeExtractedAmount({
        villagers: 20,
        elapsedMs: simulatedElapsedMs,
        remainingCapacity: 12_000,
      });
      expect(expectedAccrued).toBeGreaterThan(0);

      await lifecycle.handleInterception(attackerExpeditionId);

      const victimAfter = await ctx.prisma.expedition.findUniqueOrThrow({
        where: { id: victimExpeditionId },
      });
      expect(victimAfter.status).toBe('RETURNING');

      const siteAfter =
        await ctx.prisma.resourceExtractionSite.findUniqueOrThrow({
          where: { id: site.id },
        });
      expect(siteAfter.remainingCapacity).toBe(12_000 - expectedAccrued);

      const attackedOutbox = await ctx.prisma.eventOutbox.findFirstOrThrow({
        where: { kind: 'extraction.attacked', aggregateId: victimVillage.id },
      });
      const payload = attackedOutbox.payload as {
        stolen: { wood: number; stone: number; iron: number };
        interrupted: boolean;
      };
      expect(payload.interrupted).toBe(true);
      const stolenTotal =
        payload.stolen.wood + payload.stolen.stone + payload.stolen.iron;
      expect(stolenTotal).toBeGreaterThan(0);
      expect(stolenTotal).toBeLessThan(expectedAccrued);

      const victimLoot = victimAfter.loot as {
        resources: { wood: number; stone: number; iron: number };
      };
      const victimRemainder =
        victimLoot.resources.wood +
        victimLoot.resources.stone +
        victimLoot.resources.iron;
      expect(victimRemainder).toBe(expectedAccrued - stolenTotal);
    });
  });

  // --- i: world ENDED ------------------------------------------------------

  describe('world lifecycle guard', () => {
    it('rejects a dispatch when the world has ENDED', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      const { user, village } = await setupPlayer(world.id, 'world-ended');
      const site = await createSite(world.id, village.x + 5, village.y);

      await ctx.prisma.world.update({
        where: { id: world.id },
        data: { status: 'ENDED' },
      });

      const res = await request(ctx.server)
        .post('/combat/extraction')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          villageId: village.id,
          siteId: site.id,
          durationHours: 2,
          villagers: 10,
        });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // --- seeding: join-triggered generation stays below member count -------

  describe('site seeding', () => {
    it('join-triggered seeding keeps ACTIVE sites below member count', async () => {
      const world = await seedSmokeWorld(ctx.prisma);
      await setupPlayer(world.id, 'seed-a');
      await setupPlayer(world.id, 'seed-b');

      // The join hook is fire-and-forget; poll until it lands.
      const countSites = () =>
        ctx.prisma.resourceExtractionSite.count({
          where: { worldId: world.id, state: 'ACTIVE' },
        });
      let sites = await countSites();
      for (let i = 0; i < 20 && sites < 1; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        sites = await countSites();
      }

      const members = await ctx.prisma.worldMembership.count({
        where: { worldId: world.id },
      });
      expect(members).toBe(2);
      expect(sites).toBeGreaterThan(0);
      expect(sites).toBeLessThan(members);
    });
  });
});
