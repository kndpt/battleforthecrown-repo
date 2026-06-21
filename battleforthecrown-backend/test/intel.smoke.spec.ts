import request from 'supertest';
import {
  bootSmokeApp,
  expireNewbieShield,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

/**
 * Helper : accélère les batailles en poussant travelSpeed à quasi-zéro pour le
 * monde donné (pattern identique à combat-attack.smoke.spec.ts).
 */
async function accelerateTravel(
  ctx: SmokeContext,
  worldId: string,
): Promise<void> {
  await ctx.prisma.world.update({
    where: { id: worldId },
    data: {
      config: {
        ...SMOKE_WORLD_CONFIG,
        tempo: {
          ...SMOKE_WORLD_CONFIG.tempo,
          overrides: {
            ...SMOKE_WORLD_CONFIG.tempo.overrides,
            travelSpeed: 0.000001,
          },
        },
      },
    },
  });
}

/**
 * Seed un barbarian adjacent au village attaquant, avec les unités et ressources
 * fournies, et active la vision (WATCHTOWER lvl 1).
 */
async function seedAdjacentBarbarian(
  ctx: SmokeContext,
  worldId: string,
  attackerVillage: { x: number; y: number; id: string },
  opts: {
    wood?: number;
    stone?: number;
    iron?: number;
    militia?: number;
  } = {},
) {
  const barbarian = await ctx.prisma.village.create({
    data: {
      worldId,
      isBarbarian: true,
      name: `intel-barb-${Date.now()}`,
      x: attackerVillage.x + 1,
      y: attackerVillage.y,
      tier: 'T1',
      resourceStock: {
        create: {
          wood: opts.wood ?? 300,
          stone: opts.stone ?? 200,
          iron: opts.iron ?? 100,
          maxPerType: 100_000,
        },
      },
    },
  });

  if (opts.militia !== undefined && opts.militia > 0) {
    await ctx.prisma.unitInventory.create({
      data: {
        villageId: barbarian.id,
        unitType: 'MILITIA',
        quantity: opts.militia,
      },
    });
  }

  // Vision fog-of-war : watchtower lvl 1 couvre radius 5
  await ctx.prisma.building.updateMany({
    where: { villageId: attackerVillage.id, type: 'WATCHTOWER' },
    data: { level: 1 },
  });

  return barbarian;
}

describe('intel smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 1 : Scout → GET intel
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: scout resolved → GET /worlds/:worldId/intel/:villageId returns SCOUT intel', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-scout-a',
    );
    const villageA = joinA.village;

    // Upgrade barracks to lvl 3 pour débloquer SPY
    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: villageA.id, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageA.id },
      data: { used: 0, max: 100 },
    });

    // Train 1 SPY directement en inventaire pour ne pas attendre le worker training
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'SPY' },
      },
      create: { villageId: villageA.id, unitType: 'SPY', quantity: 1 },
      update: { quantity: 1 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA, {
      wood: 321,
      stone: 222,
      iron: 123,
      militia: 7,
    });

    // GET intel avant scout → 200 + null
    const beforeRes = await request(ctx.server)
      .get(`/worlds/${world.id}/intel/${barbarian.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`);
    expect(beforeRes.status).toBe(200);
    // NestJS retourne un body vide (ou "null" en texte) quand le service retourne null
    expect(beforeRes.text === 'null' || beforeRes.text === '').toBe(true);

    // Envoyer le scout
    const scoutRes = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scoutRes.status).toBeLessThan(300);

    // Accélérer le voyage
    await accelerateTravel(ctx, world.id);

    // Attendre le rapport scout (outbox scout.reported dispatché)
    await waitFor(
      async () => {
        const ev = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.reported', aggregateId: villageA.id },
          orderBy: { createdAt: 'desc' },
        });
        return ev?.dispatchedAt ? ev : null;
      },
      { timeoutMs: 20_000 },
    );

    // Récupérer le ScoutReport créé
    const scoutReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: villageA.id, targetVillageId: barbarian.id },
    });

    // GET intel après scout
    const intelRes = await request(ctx.server)
      .get(`/worlds/${world.id}/intel/${barbarian.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`);
    expect(intelRes.status).toBe(200);
    const intel = intelRes.body as {
      sourceKind: string;
      sourceReportId: string;
      units: Record<string, number>;
      resources: { wood: number; stone: number; iron: number };
      seenAt: string;
    };
    expect(intel).not.toBeNull();
    expect(intel.sourceKind).toBe('SCOUT');
    expect(intel.sourceReportId).toBe(scoutReport.id);
    expect(intel.units).toMatchObject({ MILITIA: 7 });
    // wood peut légèrement varier à cause du tick de production — on vérifie seulement > 0
    expect(intel.resources.wood).toBeGreaterThan(0);
    expect(typeof intel.seenAt).toBe('string');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 2 : GET intel inexistante → 200 + null
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: no observation yet → GET returns 200 with null body', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-no-obs-a',
    );

    // Village quelconque non jamais observé
    const unknownVillage = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'intel-unknown-barb',
        x: 50,
        y: 50,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    const res = await request(ctx.server)
      .get(`/worlds/${world.id}/intel/${unknownVillage.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.text === 'null' || res.text === '').toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 3 : Double scout = upsert (1 seule row, seenAt mis à jour)
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: double scout on same target → single row, seenAt updated', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-upsert-a',
    );
    const villageA = joinA.village;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: villageA.id, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageA.id },
      data: { used: 0, max: 100 },
    });
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'SPY' },
      },
      create: { villageId: villageA.id, unitType: 'SPY', quantity: 2 },
      update: { quantity: 2 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA, {
      militia: 5,
    });

    // Premier scout
    const scout1 = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scout1.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    // Attendre la résolution du 1er scout
    const firstReport = await waitFor(
      () =>
        ctx.prisma.scoutReport.findFirst({
          where: { scoutVillageId: villageA.id, targetVillageId: barbarian.id },
          orderBy: { createdAt: 'asc' },
        }),
      { timeoutMs: 20_000 },
    );

    const firstIntel = await ctx.prisma.villageIntel.findUniqueOrThrow({
      where: {
        userId_worldId_targetVillageId: {
          userId: playerA.userId,
          worldId: world.id,
          targetVillageId: barbarian.id,
        },
      },
    });
    const firstSeenAt = firstIntel.seenAt;

    // Attente courte pour garantir que seenAt du 2e sera >= 1er
    await new Promise((r) => setTimeout(r, 50));

    // Deuxième scout
    const scout2 = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scout2.status).toBeLessThan(300);
    const scout2ExpId = (scout2.body as { id: string }).id;

    // Attendre la résolution du 2e scout
    await waitFor(
      async () => {
        const ev = await ctx.prisma.eventOutbox.findFirst({
          where: {
            kind: 'scout.reported',
            aggregateId: villageA.id,
            payload: { path: ['expeditionId'], equals: scout2ExpId },
          },
          orderBy: { createdAt: 'desc' },
        });
        return ev?.dispatchedAt ? ev : null;
      },
      { timeoutMs: 20_000 },
    );

    // Vérifier qu'il n'y a qu'une seule row
    const count = await ctx.prisma.villageIntel.count({
      where: {
        userId: playerA.userId,
        worldId: world.id,
        targetVillageId: barbarian.id,
      },
    });
    expect(count).toBe(1);

    const updatedIntel = await ctx.prisma.villageIntel.findUniqueOrThrow({
      where: {
        userId_worldId_targetVillageId: {
          userId: playerA.userId,
          worldId: world.id,
          targetVillageId: barbarian.id,
        },
      },
    });
    expect(updatedIntel.seenAt.getTime()).toBeGreaterThanOrEqual(
      firstSeenAt.getTime(),
    );
    // sourceReportId pointe sur le 2e rapport
    expect(updatedIntel.sourceReportId).not.toBe(firstReport.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 4 : Combat victorieux → COMBAT_WIN intel
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: winning combat → intel sourceKind COMBAT_WIN, sourceReportId = CombatReport.id', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-win-a',
    );
    const villageA = joinA.village;

    // Grosse armée pour gagner à coup sûr
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'MILITIA' },
      },
      create: { villageId: villageA.id, unitType: 'MILITIA', quantity: 200 },
      update: { quantity: 200 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA, {
      wood: 500,
      stone: 400,
      iron: 300,
      militia: 5,
    });

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 200 },
      });
    expect(attackRes.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    // Attendre la résolution du combat (victoire)
    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: villageA.id },
      { timeoutMs: 20_000 },
    );
    expect((resolved.payload as { isVictory: boolean }).isVictory).toBe(true);

    const combatReport = await ctx.prisma.combatReport.findFirstOrThrow({
      where: { worldId: world.id, attackerVillageId: villageA.id },
    });

    // GET intel
    const intelRes = await request(ctx.server)
      .get(`/worlds/${world.id}/intel/${barbarian.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`);
    expect(intelRes.status).toBe(200);
    const intel = intelRes.body as {
      sourceKind: string;
      sourceReportId: string;
      seenAt: string;
    };
    expect(intel).not.toBeNull();
    expect(intel.sourceKind).toBe('COMBAT_WIN');
    expect(intel.sourceReportId).toBe(combatReport.id);
    expect(typeof intel.seenAt).toBe('string');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 4b : Victoire mais occupation défensive → PAS d'intel COMBAT_WIN
  // (règle `isVictory && !occupationDefense` du CombatWorker, cf. run 055)
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: winning combat under defensive occupation → no intel row created', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-occ-a',
    );
    const villageA = joinA.village;

    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'MILITIA' },
      },
      create: { villageId: villageA.id, unitType: 'MILITIA', quantity: 200 },
      update: { quantity: 200 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA, {
      wood: 500,
      stone: 400,
      iron: 300,
      militia: 5,
    });

    // Open capture window on the target → the CombatWorker reads it as a
    // defensive occupation, which must suppress COMBAT_WIN intel even on a win.
    // A militia-only army never opens a capture itself, so this seeded row is
    // the only `occupationDefense` signal in play.
    await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: villageA.id,
        attackerUserId: playerA.userId,
        targetVillageId: barbarian.id,
        worldId: world.id,
        captureUntil: new Date(Date.now() + 60 * 60 * 1000),
        status: 'OPEN',
      },
    });

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 200 },
      });
    expect(attackRes.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: villageA.id },
      { timeoutMs: 20_000 },
    );
    expect((resolved.payload as { isVictory: boolean }).isVictory).toBe(true);

    // Victory, yet no intel because the target was under defensive occupation.
    const intelRes = await request(ctx.server)
      .get(`/worlds/${world.id}/intel/${barbarian.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`);
    expect(intelRes.status).toBe(200);
    expect(intelRes.text === 'null' || intelRes.text === '').toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 5 : Combat PERDU → pas d'upsert
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: losing combat → no intel row created', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-lose-a',
    );
    const villageA = joinA.village;

    // 1 MILITIA vs 100 MILITIA → défaite assurée
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'MILITIA' },
      },
      create: { villageId: villageA.id, unitType: 'MILITIA', quantity: 1 },
      update: { quantity: 1 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA, {
      militia: 100,
    });

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 1 },
      });
    expect(attackRes.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: villageA.id },
      { timeoutMs: 20_000 },
    );
    expect((resolved.payload as { isVictory: boolean }).isVictory).toBe(false);

    // Aucune intel créée
    const intelRes = await request(ctx.server)
      .get(`/worlds/${world.id}/intel/${barbarian.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`);
    expect(intelRes.status).toBe(200);
    expect(intelRes.text === 'null' || intelRes.text === '').toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 5b : Combat PERDU après intel SCOUT préalable → sourceKind reste SCOUT
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: losing combat after prior SCOUT intel → sourceKind stays SCOUT', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-lose-scout-a',
    );
    const villageA = joinA.village;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: villageA.id, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageA.id },
      data: { used: 0, max: 100 },
    });
    // SPY pour le scout + 1 MILITIA pour l'attaque perdante
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'SPY' },
      },
      create: { villageId: villageA.id, unitType: 'SPY', quantity: 1 },
      update: { quantity: 1 },
    });
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'MILITIA' },
      },
      create: { villageId: villageA.id, unitType: 'MILITIA', quantity: 1 },
      update: { quantity: 1 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA, {
      militia: 100,
    });

    // Scout d'abord
    const scoutRes = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scoutRes.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    // Attendre résolution scout
    await waitFor(
      async () => {
        const ev = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.reported', aggregateId: villageA.id },
          orderBy: { createdAt: 'desc' },
        });
        return ev?.dispatchedAt ? ev : null;
      },
      { timeoutMs: 20_000 },
    );

    // Vérifier intel SCOUT
    const intelAfterScout = await ctx.prisma.villageIntel.findUniqueOrThrow({
      where: {
        userId_worldId_targetVillageId: {
          userId: playerA.userId,
          worldId: world.id,
          targetVillageId: barbarian.id,
        },
      },
    });
    expect(intelAfterScout.sourceKind).toBe('SCOUT');

    // Attaque perdante
    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 1 },
      });
    expect(attackRes.status).toBeLessThan(300);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: villageA.id },
      { timeoutMs: 20_000 },
    );
    expect((resolved.payload as { isVictory: boolean }).isVictory).toBe(false);

    // L'intel doit toujours être SCOUT, inchangée
    const intelAfterLoss = await ctx.prisma.villageIntel.findUniqueOrThrow({
      where: {
        userId_worldId_targetVillageId: {
          userId: playerA.userId,
          worldId: world.id,
          targetVillageId: barbarian.id,
        },
      },
    });
    expect(intelAfterLoss.sourceKind).toBe('SCOUT');
    expect(intelAfterLoss.id).toBe(intelAfterScout.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 5c : COMBAT_WIN après SCOUT → wallLevel et strategy conservés
  // Régression : recordIntel ne doit PAS écraser les champs nullable quand la
  // nouvelle source les passe à null (sémantique par-champ, run 055 +
  // docs/gameplay/11-scouting.md L61-64).
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: COMBAT_WIN after SCOUT → wallLevel and strategy from scout preserved (per-field semantics)', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const playerB = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-perfield-a',
    );
    const joinB = await joinWorld(
      ctx.server,
      playerB.accessToken,
      world.id,
      'intel-perfield-b',
    );
    const villageA = joinA.village;
    const villageB = joinB.village;

    // Expire newbie shield so PvP is allowed
    await expireNewbieShield(ctx.prisma, world.id);

    // Place villageB adjacent to villageA so travel is possible, then
    // read back so we have the accurate coordinates for the requests.
    const targetX = villageA.x + 1;
    const targetY = villageA.y;
    await ctx.prisma.village.update({
      where: { id: villageB.id },
      data: { x: targetX, y: targetY },
    });

    // Give villageB a WALL at level 3 (reveals wallLevel via scout)
    const wallBuilding = await ctx.prisma.building.findFirst({
      where: { villageId: villageB.id, type: 'WALL' },
    });
    if (wallBuilding) {
      await ctx.prisma.building.update({
        where: { id: wallBuilding.id },
        data: { level: 3 },
      });
    } else {
      await ctx.prisma.building.create({
        data: { villageId: villageB.id, type: 'WALL', level: 3 },
      });
    }

    // Give villageB a strategy config (reveals strategy via scout)
    await ctx.prisma.villageStrategyConfig.upsert({
      where: { villageId: villageB.id },
      create: { villageId: villageB.id, strategy: 'FORTRESS' },
      update: { strategy: 'FORTRESS' },
    });

    // Enable vision (WATCHTOWER lvl 1) on villageA
    await ctx.prisma.building.updateMany({
      where: { villageId: villageA.id, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    // Upgrade barracks to lvl 3 to unlock SPY
    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: villageA.id, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageA.id },
      data: { used: 0, max: 500 },
    });

    // Inject 1 SPY directly (skip training worker)
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'SPY' },
      },
      create: { villageId: villageA.id, unitType: 'SPY', quantity: 1 },
      update: { quantity: 1 },
    });

    // ── Step 1 : Scout villageB ──────────────────────────────────────────
    const scoutRes = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX,
        targetY,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: villageB.id,
        units: { SPY: 1 },
      });
    expect(scoutRes.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    // Wait for scout resolution
    await waitFor(
      async () => {
        const ev = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.reported', aggregateId: villageA.id },
          orderBy: { createdAt: 'desc' },
        });
        return ev?.dispatchedAt ? ev : null;
      },
      { timeoutMs: 20_000 },
    );

    // ── Step 2 : Verify intel after scout (wallLevel > 0, strategy non-null) ──
    const intelAfterScout = await ctx.prisma.villageIntel.findUniqueOrThrow({
      where: {
        userId_worldId_targetVillageId: {
          userId: playerA.userId,
          worldId: world.id,
          targetVillageId: villageB.id,
        },
      },
    });
    expect(intelAfterScout.sourceKind).toBe('SCOUT');
    expect(intelAfterScout.wallLevel).toBeGreaterThan(0);
    expect(intelAfterScout.strategy).not.toBeNull();

    // ── Step 3 : Winning attack against villageB ─────────────────────────
    // Big army to guarantee victory
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'MILITIA' },
      },
      create: { villageId: villageA.id, unitType: 'MILITIA', quantity: 500 },
      update: { quantity: 500 },
    });

    // The PvP power-ratio guard (run 058) forbids attacking a defender whose
    // kingdom power is below attacker/3. Calibrate villageB's garrison so the
    // ratio is satisfied (MILITIA = 2 power), then drop its wall to 0: the scout
    // already captured wallLevel 3 into the intel row (asserted above), so the
    // combat here only needs a guaranteed win — it is not meant to exercise wall
    // defence.
    const powRes = await request(ctx.server)
      .get(`/power/kingdom/${playerA.userId}/public`)
      .query({ worldId: world.id });
    expect(powRes.status).toBeLessThan(300);
    const powBody = powRes.body as { kingdomPower: number };
    const defenderMilitia = Math.ceil(Math.ceil(powBody.kingdomPower / 3) / 2);
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageB.id, unitType: 'MILITIA' },
      },
      create: {
        villageId: villageB.id,
        unitType: 'MILITIA',
        quantity: defenderMilitia,
      },
      update: { quantity: defenderMilitia },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: villageB.id, type: 'WALL' },
      data: { level: 0 },
    });

    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX,
        targetY,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: villageB.id,
        units: { MILITIA: 500 },
      });
    expect(attackRes.status).toBeLessThan(300);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: villageA.id },
      { timeoutMs: 20_000 },
    );
    expect((resolved.payload as { isVictory: boolean }).isVictory).toBe(true);

    // ── Step 4 : Assert — COMBAT_WIN source + scout fields preserved ──────
    const intelAfterCombat = await ctx.prisma.villageIntel.findUniqueOrThrow({
      where: {
        userId_worldId_targetVillageId: {
          userId: playerA.userId,
          worldId: world.id,
          targetVillageId: villageB.id,
        },
      },
    });
    expect(intelAfterCombat.sourceKind).toBe('COMBAT_WIN');
    // Per-field semantics: wallLevel and strategy revealed by scout must NOT
    // be overwritten by the COMBAT_WIN source that passes null for both.
    expect(intelAfterCombat.wallLevel).toBeGreaterThan(0);
    expect(intelAfterCombat.strategy).not.toBeNull();
    // Sanity: same row (not a new create)
    expect(intelAfterCombat.id).toBe(intelAfterScout.id);
  }, 40_000);

  // ─────────────────────────────────────────────────────────────────────────
  // Scénario 6 : Event outbox intel.updated après scout résolu
  // ─────────────────────────────────────────────────────────────────────────
  it('intel: scout resolved → event_outbox row intel.updated with correct payload', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const playerA = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      playerA.accessToken,
      world.id,
      'intel-outbox-a',
    );
    const villageA = joinA.village;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: villageA.id, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageA.id },
      data: { used: 0, max: 100 },
    });
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId: villageA.id, unitType: 'SPY' },
      },
      create: { villageId: villageA.id, unitType: 'SPY', quantity: 1 },
      update: { quantity: 1 },
    });

    const barbarian = await seedAdjacentBarbarian(ctx, world.id, villageA);

    const scoutRes = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({
        villageId: villageA.id,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scoutRes.status).toBeLessThan(300);

    await accelerateTravel(ctx, world.id);

    // Attendre que l'outbox intel.updated soit dispatché (aggregateId = barbarian.id)
    const intelEvent = await outboxDispatched(
      ctx.prisma,
      { kind: 'intel.updated', aggregateId: barbarian.id },
      { timeoutMs: 20_000 },
    );

    expect(intelEvent).not.toBeNull();
    const payload = intelEvent.payload as {
      userId: string;
      worldId: string;
      villageId: string;
    };
    expect(payload.userId).toBe(playerA.userId);
    expect(payload.worldId).toBe(world.id);
    expect(payload.villageId).toBe(barbarian.id);
  });
});
