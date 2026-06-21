import request from 'supertest';
import {
  BUILDING_TYPES,
  calculateBuildingCost,
  calculateTrainingTime,
  calculateTravelTime,
  getBarracksTrainingSpeedMultiplier,
  MS_PER_SECOND,
  TempoService,
  UNIT_CATALOG,
  UNIT_TYPES,
  WATCHTOWER_VISION_LEVELS,
} from '@battleforthecrown/shared';
import { ONBOARDING_TRAIN_TROOPS_TARGET } from '@battleforthecrown/shared/onboarding';
import type { OnboardingSummaryDto } from '@battleforthecrown/shared/onboarding';
import { EventOutboxService } from '../src/modules/event/event-outbox.service';
import { OnboardingNarrativeTargetService } from '../src/modules/world/onboarding-narrative-target.service';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

const SESSION_BUDGET_MS = 10 * 60 * MS_PER_SECOND;

describe('scripted onboarding smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('keeps the scripted first-session critical path inside the 10 minute MVP budget', () => {
    const criticalPathMs = getScriptedOnboardingCriticalPathMs();
    const requiredResources = getScriptedOnboardingRequiredResources();

    expect(criticalPathMs).toBeLessThanOrEqual(SESSION_BUDGET_MS);
    expect(requiredResources.wood).toBeLessThanOrEqual(1850);
    expect(requiredResources.stone).toBeLessThanOrEqual(1850);
    expect(requiredResources.iron).toBeLessThanOrEqual(1850);
  });

  it('creates one onboarding state on first village, applies the initial reward once, and progresses from gameplay events', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const player = await registerUser(ctx.server, 'onboarding-player');
    const join = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'onboarding-home',
    );
    const villageId = join.village.id;

    const stockAfterJoin = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    const crownsAfterJoin = await ctx.prisma.crownBalance.findUniqueOrThrow({
      where: { userId_worldId: { userId: player.userId, worldId: world.id } },
    });
    expect(stockAfterJoin).toMatchObject({
      wood: 1850,
      stone: 1850,
      iron: 1850,
    });
    expect(crownsAfterJoin.balance).toBe(100);

    const initialSummary = await request(ctx.server)
      .get('/onboarding')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(initialSummary.status).toBe(200);
    expect(initialSummary.body).toMatchObject({
      status: 'ACTIVE',
      currentStep: 'UPGRADE_CASTLE_LEVEL_2',
      initialRewardApplied: true,
      initialReward: { wood: 850, stone: 850, iron: 850, crowns: 100 },
    });

    const secondJoin = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'onboarding-home-again',
    );
    expect(secondJoin.village).toBeNull();
    expect(
      await ctx.prisma.onboardingState.count({
        where: { userId: player.userId, worldId: world.id },
      }),
    ).toBe(1);
    const stockAfterSecondJoin =
      await ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId },
      });
    const crownsAfterSecondJoin =
      await ctx.prisma.crownBalance.findUniqueOrThrow({
        where: { userId_worldId: { userId: player.userId, worldId: world.id } },
      });
    expect(stockAfterSecondJoin.wood).toBe(1850);
    expect(crownsAfterSecondJoin.balance).toBe(100);

    const now = new Date();
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.CASTLE, 2);
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.BARRACKS, 1);
    await ctx.prisma.eventOutbox.createMany({
      data: [
        {
          kind: 'building.completed',
          aggregateId: 'onboarding-castle',
          payload: {
            buildingId: 'onboarding-castle',
            villageId,
            buildingType: 'CASTLE',
            level: 2,
            ownerId: player.userId,
            worldId: world.id,
          },
        },
        {
          kind: 'building.completed',
          aggregateId: 'onboarding-barracks',
          payload: {
            buildingId: 'onboarding-barracks',
            villageId,
            buildingType: 'BARRACKS',
            level: 1,
            ownerId: player.userId,
            worldId: world.id,
          },
        },
        {
          kind: 'unit.trained',
          aggregateId: 'onboarding-training',
          payload: {
            trainingId: 'onboarding-training',
            villageId,
            unitType: 'MILITIA',
            completedQty: ONBOARDING_TRAIN_TROOPS_TARGET - 1,
            totalQty: ONBOARDING_TRAIN_TROOPS_TARGET,
          },
        },
      ],
    });

    await ctx.app.get(EventOutboxService).dispatchPendingEvents();
    const summaryBeforeEnoughTroops = await request(ctx.server)
      .get('/onboarding')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(summaryBeforeEnoughTroops.status).toBe(200);
    expect(summaryBeforeEnoughTroops.body).toMatchObject({
      status: 'ACTIVE',
      currentStep: 'TRAIN_TROOPS',
    });

    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId, unitType: UNIT_TYPES.MILITIA },
      },
      create: {
        villageId,
        unitType: UNIT_TYPES.MILITIA,
        quantity: ONBOARDING_TRAIN_TROOPS_TARGET,
      },
      update: { quantity: ONBOARDING_TRAIN_TROOPS_TARGET },
    });
    await ctx.prisma.eventOutbox.createMany({
      data: [
        {
          kind: 'unit.trained',
          aggregateId: 'onboarding-training-complete',
          payload: {
            trainingId: 'onboarding-training',
            villageId,
            unitType: 'MILITIA',
            completedQty: ONBOARDING_TRAIN_TROOPS_TARGET,
            totalQty: ONBOARDING_TRAIN_TROOPS_TARGET,
          },
        },
      ],
    });

    await ctx.app.get(EventOutboxService).dispatchPendingEvents();
    const summaryBeforeCastleLevel3 = await request(ctx.server)
      .get('/onboarding')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(summaryBeforeCastleLevel3.status).toBe(200);
    expect(summaryBeforeCastleLevel3.body).toMatchObject({
      status: 'ACTIVE',
      currentStep: 'UPGRADE_CASTLE_LEVEL_3',
    });

    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.CASTLE, 3);
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.WATCHTOWER, 1);

    // BUILD_WATCHTOWER L1 event triggers the OnboardingNarrativeTargetService:
    // it spawns the weakened barbarian target and stores its id on the state.
    // Dispatch this event first so the next reconciliation sees the target.
    await ctx.prisma.eventOutbox.createMany({
      data: [
        {
          kind: 'building.completed',
          aggregateId: 'onboarding-castle-3',
          payload: {
            buildingId: 'onboarding-castle',
            villageId,
            buildingType: 'CASTLE',
            level: 3,
            ownerId: player.userId,
            worldId: world.id,
          },
        },
        {
          kind: 'building.completed',
          aggregateId: 'onboarding-watchtower',
          payload: {
            buildingId: 'onboarding-watchtower',
            villageId,
            buildingType: 'WATCHTOWER',
            level: 1,
            ownerId: player.userId,
            worldId: world.id,
          },
        },
      ],
    });
    await ctx.app.get(EventOutboxService).dispatchPendingEvents();

    const stateAfterWatchtower =
      await ctx.prisma.onboardingState.findUniqueOrThrow({
        where: {
          userId_worldId: { userId: player.userId, worldId: world.id },
        },
        select: { narrativeTargetVillageId: true },
      });
    expect(stateAfterWatchtower.narrativeTargetVillageId).not.toBeNull();
    const narrativeTargetId = stateAfterWatchtower.narrativeTargetVillageId!;

    const narrativeTarget = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: narrativeTargetId },
      include: { unitInventory: true },
    });
    // Spec : weak T1 narrative target, fixed garnison of 3 militia (5 freshly
    // trained militiamen must win via combat attack > defense).
    expect(narrativeTarget.originKind).toBe('ONBOARDING_NARRATIVE');
    expect(narrativeTarget.tier).toBe('T1');
    expect(narrativeTarget.isBarbarian).toBe(true);
    const militia = narrativeTarget.unitInventory.find(
      (u) => u.unitType === UNIT_TYPES.MILITIA,
    );
    expect(militia?.quantity).toBe(3);
    const distanceToAnchor = Math.hypot(
      narrativeTarget.x - join.village.x,
      narrativeTarget.y - join.village.y,
    );
    expect(distanceToAnchor).toBeLessThanOrEqual(
      WATCHTOWER_VISION_LEVELS[1].visibilityRadius,
    );

    // Now run the final battle.resolved over the narrative target. Pass null
    // for defenderVillageId to mirror prod (combat.worker sets it to null on
    // BARBARIAN_VILLAGE) — the runtime resolves the narrative origin via
    // (worldId, targetX, targetY) instead.
    await createVictoriousBarbarianReport(
      ctx,
      world.id,
      player.userId,
      villageId,
      narrativeTarget.x,
      narrativeTarget.y,
      null,
    );
    await ctx.prisma.eventOutbox.createMany({
      data: [
        {
          kind: 'battle.resolved',
          aggregateId: 'onboarding-battle',
          payload: {
            expeditionId: 'onboarding-battle',
            reportId: 'onboarding-report',
            villageId,
            villageName: join.village.name,
            targetKind: 'BARBARIAN_VILLAGE',
            targetName: narrativeTarget.name,
            targetTier: 'T1',
            targetOriginKind: 'ONBOARDING_NARRATIVE',
            targetX: narrativeTarget.x,
            targetY: narrativeTarget.y,
            isVictory: true,
            loot: { resources: { wood: 10, stone: 0, iron: 0 } },
            lossesAttacker: {},
            casualtyRate: 0,
            survivingUnits: { MILITIA: ONBOARDING_TRAIN_TROOPS_TARGET },
            returnAt: new Date(now.getTime() + 60_000).toISOString(),
          },
        },
      ],
    });

    await ctx.app.get(EventOutboxService).dispatchPendingEvents();

    const completedSummary = await request(ctx.server)
      .get('/onboarding')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);
    expect(completedSummary.status).toBe(200);
    const body = completedSummary.body as OnboardingSummaryDto;
    expect(body.status).toBe('COMPLETED');
    expect(body.currentStep).toBeNull();
    expect(body.narrativeTargetVillageId).toBeNull();
    expect(body.completedSteps.map((step) => step.step)).toEqual([
      'UPGRADE_CASTLE_LEVEL_2',
      'BUILD_BARRACKS',
      'TRAIN_TROOPS',
      'UPGRADE_CASTLE_LEVEL_3',
      'BUILD_WATCHTOWER',
      'ATTACK_BARBARIAN',
    ]);

    const completedState = await ctx.prisma.onboardingState.findUniqueOrThrow({
      where: {
        userId_worldId: { userId: player.userId, worldId: world.id },
      },
      select: { narrativeTargetVillageId: true },
    });
    expect(completedState.narrativeTargetVillageId).toBeNull();
    expect(
      await ctx.prisma.village.findUnique({ where: { id: narrativeTargetId } }),
    ).toBeNull();
    expect(
      await ctx.prisma.building.count({
        where: { villageId: narrativeTargetId },
      }),
    ).toBe(0);
    expect(
      await ctx.prisma.resourceStock.count({
        where: { villageId: narrativeTargetId },
      }),
    ).toBe(0);
    expect(
      await ctx.prisma.unitInventory.count({
        where: { villageId: narrativeTargetId },
      }),
    ).toBe(0);
    expect(
      await ctx.prisma.village.count({
        where: {
          worldId: world.id,
          x: narrativeTarget.x,
          y: narrativeTarget.y,
        },
      }),
    ).toBe(0);
    expect(
      await ctx.prisma.eventOutbox.findFirst({
        where: { kind: 'village.removed', aggregateId: narrativeTargetId },
      }),
    ).not.toBeNull();

    const dailyCard = await ctx.prisma.dailyCard.findFirstOrThrow({
      where: { userId: player.userId, worldId: world.id },
      include: { tasks: true },
    });
    expect(dailyCard.status).toBe('CLAIMABLE');
    const dailyTasks = Object.fromEntries(
      dailyCard.tasks.map((task) => [task.type, task]),
    );
    expect(dailyCard.tasks).toHaveLength(3);
    expect(dailyTasks.COMPLETE_BUILDING?.progress).toBe(1);
    expect(dailyTasks.TRAIN_UNITS?.progress).toBe(
      dailyTasks.TRAIN_UNITS?.target,
    );
    expect(dailyTasks.RAID_BARBARIAN?.progress).toBe(1);
    expect(dailyTasks.SCOUT_TARGET).toBeUndefined();
    expect(dailyTasks.SEND_REINFORCEMENT).toBeUndefined();

    const joinAfterCompletion = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'onboarding-home-after-completion',
    );
    expect(joinAfterCompletion.village).toBeNull();
    expect(
      await ctx.prisma.onboardingState.count({
        where: { userId: player.userId, worldId: world.id },
      }),
    ).toBe(1);

    await ctx.prisma.eventOutbox.updateMany({
      where: { kind: 'battle.resolved', aggregateId: 'onboarding-battle' },
      data: { dispatchedAt: null },
    });
    await ctx.app.get(EventOutboxService).dispatchPendingEvents();
    expect(
      await ctx.prisma.onboardingStepProgress.count({
        where: {
          onboardingState: { userId: player.userId, worldId: world.id },
          step: 'ATTACK_BARBARIAN',
        },
      }),
    ).toBe(1);
  });

  it('catches up when onboarding facts were completed before the matching step became current', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const player = await registerUser(ctx.server, 'onboarding-catchup-player');
    const join = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'onboarding-catchup-home',
    );
    const villageId = join.village.id;

    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.CASTLE, 3);
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.BARRACKS, 1);
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.WATCHTOWER, 1);
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId, unitType: UNIT_TYPES.MILITIA },
      },
      create: {
        villageId,
        unitType: UNIT_TYPES.MILITIA,
        quantity: ONBOARDING_TRAIN_TROOPS_TARGET,
      },
      update: { quantity: ONBOARDING_TRAIN_TROOPS_TARGET },
    });
    // No Watchtower event was dispatched here — drive the narrative target
    // creation explicitly so the catchup path can still see a valid report.
    const narrativeTargetId = await ctx.app
      .get(OnboardingNarrativeTargetService)
      .ensureForVillage(villageId);
    if (!narrativeTargetId) {
      throw new Error('Failed to spawn onboarding narrative target');
    }
    const narrativeTarget = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: narrativeTargetId },
    });
    await createVictoriousBarbarianReport(
      ctx,
      world.id,
      player.userId,
      villageId,
      narrativeTarget.x,
      narrativeTarget.y,
      null,
    );

    const summary = await request(ctx.server)
      .get('/onboarding')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);

    expect(summary.status).toBe(200);
    const body = summary.body as OnboardingSummaryDto;
    expect(body.status).toBe('COMPLETED');
    expect(body.currentStep).toBeNull();
    expect(body.narrativeTargetVillageId).toBeNull();
    expect(body.completedSteps.map((step) => step.step)).toEqual([
      'UPGRADE_CASTLE_LEVEL_2',
      'BUILD_BARRACKS',
      'TRAIN_TROOPS',
      'UPGRADE_CASTLE_LEVEL_3',
      'BUILD_WATCHTOWER',
      'ATTACK_BARBARIAN',
    ]);
    expect(
      await ctx.prisma.village.findUnique({ where: { id: narrativeTargetId } }),
    ).toBeNull();
  });

  // Run 054 — a victory on a STANDARD T1 barbarian must NOT complete
  // ATTACK_BARBARIAN. The runtime filters on Village.originKind so the global
  // T1 pool keeps its identity as a real adversary.
  it('does not complete ATTACK_BARBARIAN on a victory against a standard T1 barbarian', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const player = await registerUser(ctx.server, 'onboarding-standard-t1');
    const join = await joinWorld(
      ctx.server,
      player.accessToken,
      world.id,
      'onboarding-standard-t1-home',
    );
    const villageId = join.village.id;

    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.CASTLE, 3);
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.BARRACKS, 1);
    await setBuildingLevel(ctx, villageId, BUILDING_TYPES.WATCHTOWER, 1);
    await ctx.prisma.unitInventory.upsert({
      where: {
        villageId_unitType: { villageId, unitType: UNIT_TYPES.MILITIA },
      },
      create: {
        villageId,
        unitType: UNIT_TYPES.MILITIA,
        quantity: ONBOARDING_TRAIN_TROOPS_TARGET,
      },
      update: { quantity: ONBOARDING_TRAIN_TROOPS_TARGET },
    });

    // Create a STANDARD barbarian village nearby and a victorious report on it.
    const standardBarbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        originKind: 'STANDARD',
        tier: 'T1',
        name: 'Standard T1',
        x: join.village.x + 5,
        y: join.village.y,
      },
    });
    await createVictoriousBarbarianReport(
      ctx,
      world.id,
      player.userId,
      villageId,
      standardBarbarian.x,
      standardBarbarian.y,
      null,
    );

    const summary = await request(ctx.server)
      .get('/onboarding')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${player.accessToken}`);

    expect(summary.status).toBe(200);
    const body = summary.body as OnboardingSummaryDto;
    expect(body.status).toBe('ACTIVE');
    // Reconciliation advances through all preceding steps but stops here —
    // a STANDARD T1 victory does not satisfy ATTACK_BARBARIAN.
    expect(body.currentStep).toBe('ATTACK_BARBARIAN');
    expect(body.completedSteps.map((s) => s.step)).not.toContain(
      'ATTACK_BARBARIAN',
    );
  });
});

async function setBuildingLevel(
  ctx: SmokeContext,
  villageId: string,
  buildingType: string,
  level: number,
) {
  const building = await ctx.prisma.building.findFirst({
    where: { villageId, type: buildingType },
    select: { id: true },
  });

  if (building) {
    await ctx.prisma.building.update({
      where: { id: building.id },
      data: { level, startTime: null, endTime: null },
    });
    return;
  }

  await ctx.prisma.building.create({
    data: { villageId, type: buildingType, level },
  });
}

async function createVictoriousBarbarianReport(
  ctx: SmokeContext,
  worldId: string,
  attackerUserId: string,
  attackerVillageId: string,
  targetX: number,
  targetY: number,
  defenderVillageId: string | null,
) {
  await ctx.prisma.combatReport.create({
    data: {
      worldId,
      attackerUserId,
      attackerVillageId,
      defenderVillageId,
      targetKind: 'BARBARIAN_VILLAGE',
      targetX,
      targetY,
      loot: { resources: { wood: 10, stone: 0, iron: 0 } },
      totalUnitsAttacker: { MILITIA: ONBOARDING_TRAIN_TROOPS_TARGET },
      lossesAttacker: {},
      details: {},
    },
  });
}

function getScriptedOnboardingCriticalPathMs(): number {
  const castle2 = buildingDurationMs(BUILDING_TYPES.CASTLE, 2, 1);
  const castle3UnlockForWatchtower = buildingDurationMs(
    BUILDING_TYPES.CASTLE,
    3,
    2,
  );
  const barracks1 = buildingDurationMs(BUILDING_TYPES.BARRACKS, 1, 2);
  const militia5 = trainingDurationMs(ONBOARDING_TRAIN_TROOPS_TARGET);
  const watchtower1 = buildingDurationMs(BUILDING_TYPES.WATCHTOWER, 1, 3);
  const attackTravel = TempoService.applyDuration(
    calculateTravelTime(
      WATCHTOWER_VISION_LEVELS[1].visibilityRadius,
      1,
      UNIT_CATALOG.stats[UNIT_TYPES.MILITIA].speed,
    ),
    SMOKE_WORLD_CONFIG.tempo,
    'travelSpeed',
  );

  return (
    castle2 +
    castle3UnlockForWatchtower +
    barracks1 +
    militia5 +
    watchtower1 +
    attackTravel
  );
}

function getScriptedOnboardingRequiredResources() {
  const costs = [
    calculateBuildingCost(BUILDING_TYPES.CASTLE, 2, 1),
    calculateBuildingCost(BUILDING_TYPES.CASTLE, 3, 2),
    calculateBuildingCost(BUILDING_TYPES.BARRACKS, 1, 2),
    multiplyCost(
      UNIT_CATALOG.costs[UNIT_TYPES.MILITIA],
      ONBOARDING_TRAIN_TROOPS_TARGET,
    ),
    calculateBuildingCost(BUILDING_TYPES.WATCHTOWER, 1, 3),
  ];

  return costs.reduce(
    (total, cost) => ({
      wood: total.wood + cost.wood,
      stone: total.stone + cost.stone,
      iron: total.iron + cost.iron,
    }),
    { wood: 0, stone: 0, iron: 0 },
  );
}

function buildingDurationMs(
  buildingType: string,
  level: number,
  castleLevel: number,
): number {
  return Math.max(
    MS_PER_SECOND,
    Math.round(
      TempoService.applyDuration(
        calculateBuildingCost(buildingType, level, castleLevel).time,
        SMOKE_WORLD_CONFIG.tempo,
        'constructionSpeed',
      ),
    ),
  );
}

function trainingDurationMs(quantity: number): number {
  return Math.max(
    MS_PER_SECOND,
    Math.round(
      TempoService.applyDuration(
        calculateTrainingTime(
          UNIT_CATALOG.costs[UNIT_TYPES.MILITIA].time,
          quantity,
          getBarracksTrainingSpeedMultiplier(1),
        ),
        SMOKE_WORLD_CONFIG.tempo,
        'unitTrainingSpeed',
      ),
    ),
  );
}

function multiplyCost(
  cost: { wood: number; stone: number; iron: number },
  factor: number,
) {
  return {
    wood: cost.wood * factor,
    stone: cost.stone * factor,
    iron: cost.iron * factor,
  };
}
