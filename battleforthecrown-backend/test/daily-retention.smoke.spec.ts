import request from 'supertest';
import type { RetentionSummaryDto } from '@battleforthecrown/shared/retention';
import { EventOutboxService } from '../src/modules/event/event-outbox.service';
import {
  getParisDailyKey,
  getPreviousParisDailyKey,
} from '../src/modules/retention/retention.service';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

const DAILY_TASK_FIXTURES = [
  { type: 'TRAIN_UNITS', label: 'Former une unité' },
  { type: 'COMPLETE_BUILDING', label: 'Terminer une construction' },
  { type: 'RAID_BARBARIAN', label: 'Vaincre un village barbare' },
] as const;

function dailyTaskData(completedAt: Date | null) {
  return DAILY_TASK_FIXTURES.map((task) => ({
    type: task.type,
    label: task.label,
    progress: completedAt ? 1 : 0,
    target: 1,
    completedAt,
  }));
}

describe('daily retention smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('generates a daily card, progresses it from outbox facts, and claims a village reward once', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const player = await registerUser(ctx.server, 'daily-retention-player');
    const join = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'retention-home',
    );
    const now = new Date();

    await ctx.prisma.dailyOyez.create({
      data: {
        worldId: world.id,
        title: 'Jour des bâtisseurs',
        description: 'Les bâtisseurs orientent les devoirs du jour.',
        theme: 'BUILDERS',
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + 60 * 60_000),
      },
    });

    const villageId = join.village.id;

    await ctx.prisma.eventOutbox.createMany({
      data: [
        {
          kind: 'unit.trained',
          aggregateId: villageId,
          payload: {
            trainingId: 'training-retention',
            villageId,
            unitType: 'MILITIA',
            completedQty: 1,
            totalQty: 1,
          },
        },
        {
          kind: 'building.completed',
          aggregateId: villageId,
          payload: {
            buildingId: 'building-retention',
            villageId,
            buildingType: 'WOOD',
            level: 2,
          },
        },
        {
          kind: 'battle.resolved',
          aggregateId: villageId,
          payload: {
            expeditionId: 'battle-retention',
            reportId: 'combat-report-retention',
            villageId,
            villageName: join.village.name,
            targetKind: 'BARBARIAN_VILLAGE',
            targetName: 'Barbares',
            targetX: join.village.x + 1,
            targetY: join.village.y,
            isVictory: true,
            loot: { resources: { wood: 10, stone: 0, iron: 0 } },
            lossesAttacker: {},
            casualtyRate: 0,
            survivingUnits: { MILITIA: 1 },
            returnAt: null,
          },
        },
        {
          kind: 'scout.reported',
          aggregateId: villageId,
          payload: {
            expeditionId: 'scout-retention-ignored',
            reportId: 'scout-report-retention-ignored',
            villageId,
            targetKind: 'BARBARIAN_VILLAGE',
            targetName: 'Barbares',
            targetX: join.village.x + 2,
            targetY: join.village.y,
            returnAt: new Date(now.getTime() + 60_000).toISOString(),
          },
        },
      ],
    });

    await ctx.app.get(EventOutboxService).dispatchPendingEvents();

    const completedSummary = await request(ctx.server)
      .get('/retention')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(completedSummary.status).toBe(200);
    const completedSummaryBody = completedSummary.body as RetentionSummaryDto;
    expect(completedSummaryBody.oyez).toMatchObject({
      title: 'Jour des bâtisseurs',
      theme: 'BUILDERS',
    });
    expect(completedSummaryBody.cards).toHaveLength(1);
    expect(completedSummaryBody.backlogLimit).toBe(1);
    expect(completedSummaryBody.cards[0].tasks).toHaveLength(3);
    const cardId = completedSummaryBody.cards[0].id;
    expect(completedSummaryBody.cards[0]).toMatchObject({
      status: 'CLAIMABLE',
    });
    expect(
      completedSummaryBody.cards[0].tasks.every(
        (task: { completedAt: string | null }) => Boolean(task.completedAt),
      ),
    ).toBe(true);

    const beforeClaim = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    const claim = await request(ctx.server)
      .post(`/retention/cards/${cardId}/claim`)
      .set('Authorization', `Bearer ${player.accessToken}`)
      .send({ villageId });
    expect(claim.status).toBe(201);
    expect(claim.body).toMatchObject({
      rewardVillageId: villageId,
      card: { id: cardId, status: 'CLAIMED', rewardVillageId: villageId },
    });

    const afterClaim = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    expect(afterClaim.wood).toBeGreaterThan(beforeClaim.wood);
    expect(
      await ctx.prisma.eventOutbox.findFirst({
        where: { kind: 'resources.changed', aggregateId: villageId },
      }),
    ).toBeTruthy();

    const secondClaim = await request(ctx.server)
      .post(`/retention/cards/${cardId}/claim`)
      .set('Authorization', `Bearer ${player.accessToken}`)
      .send({ villageId });
    expect(secondClaim.status).toBe(409);

    const afterClaimSummary = await request(ctx.server)
      .get('/retention')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(afterClaimSummary.status).toBe(200);
    const afterClaimSummaryBody = afterClaimSummary.body as RetentionSummaryDto;
    expect(afterClaimSummaryBody.defaultRewardVillageId).toBe(villageId);
  });

  it('expires stale active cards and generates only the current daily card as active', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const player = await registerUser(ctx.server, 'daily-retention-reset');
    await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'retention-reset',
    );
    const now = new Date();
    const currentDayKey = getParisDailyKey(now);
    const previousDayKey = getPreviousParisDailyKey(now);

    const staleCard = await ctx.prisma.dailyCard.create({
      data: {
        userId: player.userId,
        worldId: world.id,
        dayKey: previousDayKey,
        tasks: { create: dailyTaskData(null) },
      },
    });

    const summary = await request(ctx.server)
      .get('/retention')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(summary.status).toBe(200);
    const body = summary.body as RetentionSummaryDto;

    expect(body.currentDayKey).toBe(currentDayKey);
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0]).toMatchObject({
      dayKey: currentDayKey,
      status: 'ACTIVE',
    });
    expect(body.cards[0].tasks).toHaveLength(3);

    const staleAfterSummary = await ctx.prisma.dailyCard.findUniqueOrThrow({
      where: { id: staleCard.id },
      select: { status: true },
    });
    expect(staleAfterSummary.status).toBe('EXPIRED');
    expect(
      await ctx.prisma.dailyCard.count({
        where: { userId: player.userId, worldId: world.id, status: 'ACTIVE' },
      }),
    ).toBe(1);
  });

  it('keeps a completed previous card claimable for one reset and expires older claimable cards', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const player = await registerUser(ctx.server, 'daily-retention-grace');
    const join = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'retention-grace',
    );
    const now = new Date();
    const previousDayKey = getPreviousParisDailyKey(now);
    const expiredDayKey = getParisDailyKey(
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    );
    const completedAt = new Date(now.getTime() - 60_000);

    const graceCard = await ctx.prisma.dailyCard.create({
      data: {
        userId: player.userId,
        worldId: world.id,
        dayKey: previousDayKey,
        status: 'CLAIMABLE',
        tasks: { create: dailyTaskData(completedAt) },
      },
    });
    const expiredCard = await ctx.prisma.dailyCard.create({
      data: {
        userId: player.userId,
        worldId: world.id,
        dayKey: expiredDayKey,
        status: 'CLAIMABLE',
        tasks: { create: dailyTaskData(completedAt) },
      },
    });

    const summary = await request(ctx.server)
      .get('/retention')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(summary.status).toBe(200);
    const body = summary.body as RetentionSummaryDto;

    expect(body.claimableCount).toBe(1);
    expect(body.cards.some((card) => card.id === graceCard.id)).toBe(true);
    expect(body.cards.some((card) => card.id === expiredCard.id)).toBe(false);
    expect(
      await ctx.prisma.dailyCard.findUniqueOrThrow({
        where: { id: expiredCard.id },
        select: { status: true },
      }),
    ).toMatchObject({ status: 'EXPIRED' });

    const claim = await request(ctx.server)
      .post(`/retention/cards/${graceCard.id}/claim`)
      .set('Authorization', `Bearer ${player.accessToken}`)
      .send({ villageId: join.village.id });
    expect(claim.status).toBe(201);
    expect(claim.body).toMatchObject({
      rewardVillageId: join.village.id,
      card: { id: graceCard.id, status: 'CLAIMED' },
    });

    const expiredClaim = await request(ctx.server)
      .post(`/retention/cards/${expiredCard.id}/claim`)
      .set('Authorization', `Bearer ${player.accessToken}`)
      .send({ villageId: join.village.id });
    expect(expiredClaim.status).toBe(400);
  });
});
