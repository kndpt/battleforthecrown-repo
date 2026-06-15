import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village';
import { UNIT_TYPES, type UnitMap } from '@battleforthecrown/shared/army';
import { isVictoryForAttacker } from '@battleforthecrown/shared/combat';
import type { OnboardingSummaryDto } from '@battleforthecrown/shared/onboarding';
import { ONBOARDING_TRAIN_TROOPS_TARGET } from '@battleforthecrown/shared/onboarding';
import type { OnboardingStep } from '@battleforthecrown/shared/onboarding';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import type { EventKind, PayloadForKind } from '../event/event-types';
import {
  ONBOARDING_INITIAL_REWARD,
  getNextStep,
  getOnboardingProjection,
  isUniqueConstraintError,
  mapOnboardingState,
} from './onboarding.utils';

export { ONBOARDING_INITIAL_REWARD } from './onboarding.utils';

type Tx = Prisma.TransactionClient;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getSummary(
    userId: string,
    worldId: string,
  ): Promise<OnboardingSummaryDto> {
    await this.ownership.assertWorldMember(worldId, userId);

    const state = await this.prisma.onboardingState.findUnique({
      where: { userId_worldId: { userId, worldId } },
      include: { steps: { orderBy: { completedAt: 'asc' } } },
    });

    if (!state) {
      return {
        worldId,
        firstVillageId: null,
        status: 'COMPLETED',
        currentStep: null,
        completedSteps: [],
        initialRewardApplied: false,
        initialRewardAppliedAt: null,
        initialReward: ONBOARDING_INITIAL_REWARD,
        completedAt: null,
      };
    }

    if (state.status === 'ACTIVE') {
      await this.reconcileActiveStateFromFacts(userId, worldId);
      const reconciledState =
        await this.prisma.onboardingState.findUniqueOrThrow({
          where: { userId_worldId: { userId, worldId } },
          include: { steps: { orderBy: { completedAt: 'asc' } } },
        });

      return mapOnboardingState(reconciledState);
    }

    return mapOnboardingState(state);
  }

  async ensureForInitialVillage(
    tx: Tx,
    params: { userId: string; worldId: string; villageId: string },
  ): Promise<void> {
    const { userId, worldId, villageId } = params;

    await tx.onboardingState.upsert({
      where: { userId_worldId: { userId, worldId } },
      create: {
        userId,
        worldId,
        firstVillageId: villageId,
        currentStep: 'UPGRADE_CASTLE_LEVEL_2',
        initialRewardApplied: false,
      },
      update: {
        firstVillageId: villageId,
      },
    });

    const stock = await tx.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    const now = new Date();
    await tx.resourceStock.update({
      where: { villageId },
      data: {
        wood: Math.min(
          stock.wood + ONBOARDING_INITIAL_REWARD.wood,
          stock.maxPerType,
        ),
        stone: Math.min(
          stock.stone + ONBOARDING_INITIAL_REWARD.stone,
          stock.maxPerType,
        ),
        iron: Math.min(
          stock.iron + ONBOARDING_INITIAL_REWARD.iron,
          stock.maxPerType,
        ),
        lastUpdateTs: now,
      },
    });
    await tx.crownBalance.update({
      where: { userId_worldId: { userId, worldId } },
      data: {
        balance: { increment: ONBOARDING_INITIAL_REWARD.crowns },
        lastUpdateTs: now,
      },
    });
    await tx.onboardingState.update({
      where: { userId_worldId: { userId, worldId } },
      data: {
        initialRewardApplied: true,
        initialRewardAppliedAt: now,
      },
    });
  }

  async recordOutboxEvent<K extends EventKind>(
    eventOutboxId: string,
    kind: K,
    payload: PayloadForKind<K>,
  ): Promise<void> {
    const projection = getOnboardingProjection(kind, payload);
    if (!projection) return;

    await this.prisma.$transaction(async (tx) => {
      const village = await tx.village.findUnique({
        where: { id: projection.villageId },
        select: { userId: true, worldId: true },
      });
      if (!village?.userId) return;

      const state = await tx.onboardingState.findUnique({
        where: {
          userId_worldId: {
            userId: village.userId,
            worldId: village.worldId,
          },
        },
        include: { steps: true },
      });
      if (!state || state.status !== 'ACTIVE') return;
      await reconcileStateFromFacts(tx, state, {
        eventOutboxId,
        step: projection.step,
      });
    });
  }

  private async reconcileActiveStateFromFacts(userId: string, worldId: string) {
    await this.prisma.$transaction(async (tx) => {
      const state = await tx.onboardingState.findUnique({
        where: { userId_worldId: { userId, worldId } },
        include: { steps: true },
      });
      if (!state || state.status !== 'ACTIVE') return;

      await reconcileStateFromFacts(tx, state);
    });
  }
}

async function reconcileStateFromFacts(
  tx: Tx,
  state: {
    id: string;
    firstVillageId: string;
    currentStep: OnboardingStep;
  },
  trigger?: { eventOutboxId: string; step: OnboardingStep },
): Promise<void> {
  let currentStep: OnboardingStep | null = state.currentStep;
  let advanced = false;
  let triggerWasRecorded = false;

  while (
    currentStep &&
    (await isStepSatisfied(tx, state.firstVillageId, currentStep))
  ) {
    const eventOutboxId =
      trigger?.step === currentStep && !triggerWasRecorded
        ? trigger.eventOutboxId
        : null;

    try {
      if (eventOutboxId) {
        await tx.onboardingProgressEvent.create({ data: { eventOutboxId } });
        triggerWasRecorded = true;
      }
      await tx.onboardingStepProgress.create({
        data: {
          onboardingStateId: state.id,
          step: currentStep,
          eventOutboxId,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }

    advanced = true;
    currentStep = getNextStep(currentStep);
  }

  if (!advanced) return;

  await tx.onboardingState.update({
    where: { id: state.id },
    data: currentStep
      ? { currentStep }
      : { status: 'COMPLETED', completedAt: new Date() },
  });
}

async function isStepSatisfied(
  tx: Tx,
  villageId: string,
  step: OnboardingStep,
): Promise<boolean> {
  switch (step) {
    case 'UPGRADE_CASTLE_LEVEL_2':
      return hasBuildingLevel(tx, villageId, BUILDING_TYPES.CASTLE, 2);
    case 'BUILD_BARRACKS':
      return hasBuildingLevel(tx, villageId, BUILDING_TYPES.BARRACKS, 1);
    case 'TRAIN_TROOPS':
      return hasMilitiaTarget(tx, villageId);
    case 'UPGRADE_CASTLE_LEVEL_3':
      return hasBuildingLevel(tx, villageId, BUILDING_TYPES.CASTLE, 3);
    case 'BUILD_WATCHTOWER':
      return hasBuildingLevel(tx, villageId, BUILDING_TYPES.WATCHTOWER, 1);
    case 'ATTACK_BARBARIAN':
      return hasVictoriousBarbarianAttack(tx, villageId);
  }
}

async function hasBuildingLevel(
  tx: Tx,
  villageId: string,
  buildingType: string,
  level: number,
): Promise<boolean> {
  const building = await tx.building.findFirst({
    where: { villageId, type: buildingType, level: { gte: level } },
    select: { id: true },
  });

  return Boolean(building);
}

async function hasMilitiaTarget(tx: Tx, villageId: string): Promise<boolean> {
  const militia = await tx.unitInventory.findUnique({
    where: {
      villageId_unitType: {
        villageId,
        unitType: UNIT_TYPES.MILITIA,
      },
    },
    select: { quantity: true },
  });

  return (militia?.quantity ?? 0) >= ONBOARDING_TRAIN_TROOPS_TARGET;
}

async function hasVictoriousBarbarianAttack(
  tx: Tx,
  villageId: string,
): Promise<boolean> {
  const reports = await tx.combatReport.findMany({
    where: {
      attackerVillageId: villageId,
      targetKind: 'BARBARIAN_VILLAGE',
    },
    select: { totalUnitsAttacker: true, lossesAttacker: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return reports.some((report) =>
    isVictoryForAttacker(
      report.lossesAttacker as UnitMap,
      report.totalUnitsAttacker as UnitMap,
    ),
  );
}
