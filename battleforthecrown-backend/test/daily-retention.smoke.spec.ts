import request from 'supertest';
import type { RetentionSummaryDto } from '@battleforthecrown/shared/retention';
import { EventOutboxService } from '../src/modules/event/event-outbox.service';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('daily retention smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
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
            expeditionId: 'scout-retention',
            reportId: 'scout-report-retention',
            villageId,
            targetKind: 'BARBARIAN_VILLAGE',
            targetName: 'Barbares',
            targetX: join.village.x + 2,
            targetY: join.village.y,
            returnAt: new Date(now.getTime() + 60_000).toISOString(),
          },
        },
        {
          kind: 'reinforcement.sent',
          aggregateId: villageId,
          payload: {
            expeditionId: 'reinforcement-retention',
            villageId,
            targetVillageId: villageId,
            arrivalAt: new Date(now.getTime() + 60_000).toISOString(),
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
    expect(completedSummaryBody.cards[0].tasks).toHaveLength(5);
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
});
