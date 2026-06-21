import {
  renownConstructionXp,
  renownConquestXp,
  renownCombatXp,
  renownRankingBonus,
  renownStatusForXp,
} from '@battleforthecrown/shared';
import { RenownService } from '../src/modules/renown/renown.service';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

describe('renown smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ---------------------------------------------------------------------------
  // Scénario 1 — Construction (live) + idempotence Outbox
  // ---------------------------------------------------------------------------
  it('renown: building.completed crédite XP construction et est idempotent', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `rnw-build-${Date.now()}`);
    const user = await registerUser(ctx.server, `rnw-build-${Date.now()}`);

    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      `rnwn-build-${Date.now()}`,
    );
    const villageId = join.village.id;

    const svc = ctx.app.get(RenownService);
    const eventId = 'evt-1';
    const buildingType = 'CASTLE';
    const level = 3;

    await svc.recordOutboxEvent(eventId, 'building.completed', {
      buildingId: 'fake-building-id',
      villageId,
      buildingType,
      level,
    });

    const expectedXp = renownConstructionXp(buildingType, level);

    // XP créditée
    const updatedUser = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(updatedUser.renownXp).toBe(expectedXp);

    // 1 ligne RenownLedger source CONSTRUCTION dedupKey outbox:evt-1
    const ledgers = await ctx.prisma.renownLedger.findMany({
      where: { userId: user.userId, source: 'CONSTRUCTION' },
    });
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].dedupKey).toBe(`outbox:${eventId}`);

    // Idempotence : même eventId → aucune mutation
    await svc.recordOutboxEvent(eventId, 'building.completed', {
      buildingId: 'fake-building-id',
      villageId,
      buildingType,
      level,
    });

    const afterReplay = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterReplay.renownXp).toBe(expectedXp); // inchangé

    const ledgersAfterReplay = await ctx.prisma.renownLedger.findMany({
      where: { userId: user.userId, source: 'CONSTRUCTION' },
    });
    expect(ledgersAfterReplay).toHaveLength(1); // toujours 1 ligne
  });

  // ---------------------------------------------------------------------------
  // Scénario 2 — Conquête PvP vs barbare
  // ---------------------------------------------------------------------------
  it('renown: village.conquered crédite 500 PvP et 167 barbare (2 lignes CONQUEST)', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `renown-conq-${Date.now()}`);
    const user = await registerUser(ctx.server, `renown-conq-${Date.now()}`);

    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      `rnwn-conq-${Date.now()}`,
    );
    const villageId = join.village.id;

    const svc = ctx.app.get(RenownService);

    // PvP (previousOwnerId = un autre joueur)
    await svc.recordOutboxEvent('evt-pvp', 'village.conquered', {
      villageId,
      villageName: 'TargetVillage',
      newOwnerId: user.userId,
      newOwnerName: 'attacker',
      previousOwnerId: 'someOther',
      previousTier: null,
      lostVillageVisualTier: 1,
      x: 0,
      y: 0,
      buildingsKept: 0,
    });

    const xpPvp = renownConquestXp(false); // 500
    expect(xpPvp).toBe(500);

    const afterPvp = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterPvp.renownXp).toBe(xpPvp);

    // Barbare (previousOwnerId = null)
    await svc.recordOutboxEvent('evt-barb', 'village.conquered', {
      villageId,
      villageName: 'BarbVillage',
      newOwnerId: user.userId,
      newOwnerName: 'attacker',
      previousOwnerId: null,
      previousTier: null,
      lostVillageVisualTier: 1,
      x: 0,
      y: 0,
      buildingsKept: 0,
    });

    const xpBarb = renownConquestXp(true); // round(500/3) = 167
    expect(xpBarb).toBe(167);

    const afterBarb = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterBarb.renownXp).toBe(xpPvp + xpBarb);

    // 2 lignes CONQUEST
    const ledgers = await ctx.prisma.renownLedger.findMany({
      where: { userId: user.userId, source: 'CONQUEST' },
      orderBy: { createdAt: 'asc' },
    });
    expect(ledgers).toHaveLength(2);
    expect(ledgers[0].dedupKey).toBe('outbox:evt-pvp');
    expect(ledgers[1].dedupKey).toBe('outbox:evt-barb');
  });

  // ---------------------------------------------------------------------------
  // Scénario 3 — Combat dedup granulaire
  // ---------------------------------------------------------------------------
  it('renown: creditCombat idempotent sur (report, signal, user, opponent) et granulaire par adversaire', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `renown-combat-${Date.now()}`,
    );
    const user = await registerUser(ctx.server, `renown-cbt-${Date.now()}`);

    const svc = ctx.app.get(RenownService);
    const gloryPoints = 340;
    const expectedXp = renownCombatXp(gloryPoints); // 340 (factor=1)

    // Premier crédit
    await ctx.prisma.$transaction(async (tx) => {
      await svc.creditCombat(tx, {
        userId: user.userId,
        opponentUserId: 'opp1',
        gloryPoints,
        combatReportId: 'r1',
        signal: 'ASSAULT_GLORY',
        worldId: world.id,
      });
    });

    const afterFirst = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterFirst.renownXp).toBe(expectedXp);

    // Idempotence : même (report, signal, user, opponent) → pas de double crédit
    await ctx.prisma.$transaction(async (tx) => {
      await svc.creditCombat(tx, {
        userId: user.userId,
        opponentUserId: 'opp1',
        gloryPoints,
        combatReportId: 'r1',
        signal: 'ASSAULT_GLORY',
        worldId: world.id,
      });
    });

    const afterReplay = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterReplay.renownXp).toBe(expectedXp); // inchangé

    // Adversaire différent (opp2) sur le même rapport → crédit supplémentaire
    await ctx.prisma.$transaction(async (tx) => {
      await svc.creditCombat(tx, {
        userId: user.userId,
        opponentUserId: 'opp2',
        gloryPoints,
        combatReportId: 'r1',
        signal: 'ASSAULT_GLORY',
        worldId: world.id,
      });
    });

    const afterOpp2 = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterOpp2.renownXp).toBe(expectedXp * 2);
  });

  // ---------------------------------------------------------------------------
  // Scénario 4 — Bonus classement (batch) + idempotence
  // ---------------------------------------------------------------------------
  it('renown: creditRankingBonuses crédite par palier et est idempotent', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `rnw-rank-${Date.now()}`);
    const user = await registerUser(ctx.server, `rnw-rank-${Date.now()}`);

    const svc = ctx.app.get(RenownService);

    // Crée des snapshots de classement final : rank 1 POWER, rank 5 ASSAULT_GLORY, rank 200 RAMPART_GLORY
    const snapshotAt = new Date();
    await ctx.prisma.worldFinalRankingSnapshot.createMany({
      data: [
        {
          worldId: world.id,
          userId: user.userId,
          signal: 'POWER',
          rank: 1,
          score: 9999,
          snapshotAt,
        },
        {
          worldId: world.id,
          userId: user.userId,
          signal: 'ASSAULT_GLORY',
          rank: 5,
          score: 5000,
          snapshotAt,
        },
        {
          worldId: world.id,
          userId: user.userId,
          signal: 'RAMPART_GLORY',
          rank: 200,
          score: 100,
          snapshotAt,
        },
      ],
    });

    const expectedXp =
      renownRankingBonus(1) + // top1 = 5000
      renownRankingBonus(5) + // top10 = 2000
      renownRankingBonus(200); // participation = 100

    // Premier run
    await ctx.prisma.$transaction(async (tx) => {
      await svc.creditRankingBonuses(tx, world.id);
    });

    const afterFirst = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterFirst.renownXp).toBe(expectedXp);

    const ledgers = await ctx.prisma.renownLedger.findMany({
      where: { userId: user.userId, source: 'RANKING_BONUS' },
    });
    expect(ledgers).toHaveLength(3);

    // Idempotence : re-run → inchangé
    await ctx.prisma.$transaction(async (tx) => {
      await svc.creditRankingBonuses(tx, world.id);
    });

    const afterReplay = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });
    expect(afterReplay.renownXp).toBe(expectedXp); // inchangé

    const ledgersAfterReplay = await ctx.prisma.renownLedger.findMany({
      where: { userId: user.userId, source: 'RANKING_BONUS' },
    });
    expect(ledgersAfterReplay).toHaveLength(3); // toujours 3 lignes
  });

  // ---------------------------------------------------------------------------
  // Scénario 5 — getStatus retourne un RenownStatus cohérent
  // ---------------------------------------------------------------------------
  it('renown: getStatus retourne un RenownStatus cohérent avec renownStatusForXp', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `renown-status-${Date.now()}`,
    );
    const user = await registerUser(ctx.server, `renown-sts-${Date.now()}`);

    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      `rnwn-sts-${Date.now()}`,
    );
    const villageId = join.village.id;

    const svc = ctx.app.get(RenownService);

    // Crédite un peu de XP via deux sources
    await svc.recordOutboxEvent('evt-status-build', 'building.completed', {
      buildingId: 'fake-building-status',
      villageId,
      buildingType: 'CASTLE',
      level: 5,
    });
    await svc.recordOutboxEvent('evt-status-conq', 'village.conquered', {
      villageId,
      villageName: 'SomeVillage',
      newOwnerId: user.userId,
      newOwnerName: 'player',
      previousOwnerId: 'someone',
      previousTier: null,
      lostVillageVisualTier: 1,
      x: 0,
      y: 0,
      buildingsKept: 0,
    });

    const dbUser = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { renownXp: true },
    });

    const expected = renownStatusForXp(dbUser.renownXp);
    const status = await svc.getStatus(user.userId);

    expect(status.xp).toBe(expected.xp);
    expect(status.level).toBe(expected.level);
    expect(status.currentLevelXp).toBe(expected.currentLevelXp);
    expect(status.nextLevelXp).toBe(expected.nextLevelXp);
    expect(status.xpIntoLevel).toBe(expected.xpIntoLevel);
    expect(status.xpForNextLevel).toBe(expected.xpForNextLevel);
  });
});
