import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type DailyCard,
  type DailyCardTask,
  type DailyCardTaskType,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldAccessService } from '../world/world-access.service';
import type { EventKind, PayloadForKind } from '../event/event-types';
import { createOutboxEvent } from '../event/event.utils';
import { ResourcesService } from '../resources/resources.service';
import { getDailyCardScaling } from './retention-scaling';
import type {
  ClaimDailyCardResponse,
  DailyCardDto,
  DailyCardTaskDto,
  DailyOyezDto,
  RetentionSummaryDto,
} from '@battleforthecrown/shared/retention';
import {
  type CastleLevelReader,
  calculateTaskProgressUpdate,
  getClaimableDayKeys,
  getParisDailyKey,
  getPlayerMaxCastleLevel,
  getTaskProjection,
  isWithinClaimGrace,
  parseTaskMetadata,
} from './retention.utils';

const DAILY_CARD_LIMIT = 1;

type CardWithTasks = DailyCard & { tasks: DailyCardTask[] };

@Injectable()
export class RetentionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldAccess: WorldAccessService,
    private readonly resources: ResourcesService,
  ) {}

  async getSummary(
    userId: string,
    worldId: string,
  ): Promise<RetentionSummaryDto> {
    await this.ownership.assertWorldMember(worldId, userId);
    const now = new Date();
    const currentDayKey = getParisDailyKey(now);
    await this.expireStaleCards(userId, worldId, currentDayKey, now);
    await this.ensureDailyCard(userId, worldId, currentDayKey);
    const claimableDayKeys = getClaimableDayKeys(now);

    const [cards, latestClaim, oyez] = await Promise.all([
      this.prisma.dailyCard.findMany({
        where: {
          userId,
          worldId,
          OR: [
            { status: 'ACTIVE', dayKey: currentDayKey },
            { status: 'CLAIMABLE', dayKey: { in: claimableDayKeys } },
          ],
        },
        include: { tasks: { orderBy: { createdAt: 'asc' } } },
        orderBy: [{ dayKey: 'desc' }, { createdAt: 'asc' }],
      }),
      this.prisma.dailyCard.findFirst({
        where: {
          userId,
          worldId,
          rewardVillageId: { not: null },
          status: 'CLAIMED',
        },
        orderBy: { claimedAt: 'desc' },
        select: { rewardVillageId: true },
      }),
      this.getActiveOyez(worldId),
    ]);

    return {
      worldId,
      currentDayKey,
      backlogLimit: DAILY_CARD_LIMIT,
      claimableCount: cards.filter((card) => card.status === 'CLAIMABLE')
        .length,
      defaultRewardVillageId: latestClaim?.rewardVillageId ?? null,
      oyez: oyez ? mapOyez(oyez) : null,
      cards: cards.map(mapCard),
    };
  }

  async claimCard(
    userId: string,
    cardId: string,
    villageId: string,
  ): Promise<ClaimDailyCardResponse> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const productionRates = await this.resources.getProductionRates(villageId);

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const card = await tx.dailyCard.findUnique({
        where: { id: cardId },
        include: { tasks: { orderBy: { createdAt: 'asc' } } },
      });
      if (!card || card.userId !== userId) {
        throw new NotFoundException('Daily card not found');
      }
      if (card.status === 'CLAIMED') {
        throw new ConflictException('Daily card already claimed');
      }
      if (card.status === 'EXPIRED' || !isWithinClaimGrace(card.dayKey, now)) {
        throw new BadRequestException('Daily card claim window expired');
      }
      if (card.status !== 'CLAIMABLE' || !allTasksComplete(card.tasks)) {
        throw new BadRequestException('Daily card is not complete');
      }

      const village = await tx.village.findUnique({
        where: { id: villageId },
        select: { id: true, userId: true, worldId: true },
      });
      if (
        !village ||
        village.userId !== userId ||
        village.worldId !== card.worldId
      ) {
        throw new BadRequestException('Invalid reward village');
      }

      await this.worldAccess.assertWorldWritable(village.worldId, tx);

      const stock = await tx.resourceStock.findUnique({ where: { villageId } });
      if (!stock) {
        throw new NotFoundException('Reward village resources not found');
      }

      const updatedStock = await tx.resourceStock.update({
        where: { villageId },
        data: {
          wood: Math.min(stock.wood + card.rewardWood, stock.maxPerType),
          stone: Math.min(stock.stone + card.rewardStone, stock.maxPerType),
          iron: Math.min(stock.iron + card.rewardIron, stock.maxPerType),
          lastUpdateTs: new Date(),
        },
      });

      const claimed = await tx.dailyCard.update({
        where: { id: card.id },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date(),
          rewardVillageId: villageId,
        },
        include: { tasks: { orderBy: { createdAt: 'asc' } } },
      });

      await createOutboxEvent(tx, 'resources.changed', villageId, {
        villageId,
        wood: updatedStock.wood,
        stone: updatedStock.stone,
        iron: updatedStock.iron,
        maxPerType: updatedStock.maxPerType,
        lastUpdateTs: updatedStock.lastUpdateTs.toISOString(),
        productionRates,
      });

      return {
        card: mapCard(claimed),
        rewardVillageId: villageId,
      };
    });
  }

  async recordOutboxEvent<K extends EventKind>(
    eventOutboxId: string,
    kind: K,
    payload: PayloadForKind<K>,
    eventCreatedAt: Date = new Date(),
  ): Promise<void> {
    const projection = getTaskProjection(kind, payload);
    if (!projection) return;

    await this.prisma.$transaction(async (tx) => {
      try {
        await tx.dailyCardProgressEvent.create({ data: { eventOutboxId } });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return;
        }
        throw error;
      }

      await this.progressOldestMatchingTask(
        tx,
        projection.villageId,
        projection.type,
        projection.completedQty,
        projection.targetTier,
        eventCreatedAt,
      );
    });
  }

  private async ensureDailyCard(
    userId: string,
    worldId: string,
    dayKey: string,
  ): Promise<void> {
    const existing = await this.prisma.dailyCard.findUnique({
      where: { userId_worldId_dayKey: { userId, worldId, dayKey } },
      select: { id: true },
    });
    if (existing) return;

    try {
      const cardData = await this.buildDailyCardPayload(
        this.prisma,
        userId,
        worldId,
      );
      await this.prisma.dailyCard.create({
        data: { userId, worldId, dayKey, ...cardData },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  private getActiveOyez(worldId: string) {
    const now = new Date();
    return this.prisma.dailyOyez.findFirst({
      where: {
        worldId,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  private async progressOldestMatchingTask(
    tx: Prisma.TransactionClient,
    villageId: string,
    type: DailyCardTaskType,
    completedQty: number,
    targetTier: string | null,
    eventCreatedAt: Date,
  ): Promise<void> {
    const now = new Date();
    const village = await tx.village.findUnique({
      where: { id: villageId },
      select: { userId: true, worldId: true },
    });
    if (!village?.userId) return;
    const currentDayKey = getParisDailyKey(now);
    const eventDayKey = getParisDailyKey(eventCreatedAt);
    await this.ensureDailyCardInTransaction(
      tx,
      village.userId,
      village.worldId,
      eventDayKey,
    );
    await this.progressMatchingTaskForDay(
      tx,
      village.userId,
      village.worldId,
      eventDayKey,
      type,
      completedQty,
      targetTier,
      eventCreatedAt,
    );
    await this.expireStaleCardsInTransaction(
      tx,
      village.userId,
      village.worldId,
      currentDayKey,
      now,
    );
    if (currentDayKey !== eventDayKey) {
      await this.ensureDailyCardInTransaction(
        tx,
        village.userId,
        village.worldId,
        currentDayKey,
      );
    }
  }

  private async progressMatchingTaskForDay(
    tx: Prisma.TransactionClient,
    userId: string,
    worldId: string,
    dayKey: string,
    type: DailyCardTaskType,
    completedQty: number,
    targetTier: string | null,
    completedAt: Date,
  ): Promise<void> {
    const card = await tx.dailyCard.findFirst({
      where: {
        userId,
        worldId,
        dayKey,
        status: { in: ['ACTIVE', 'EXPIRED'] },
        tasks: {
          some: {
            type,
            completedAt: null,
          },
        },
      },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    if (!card) return;

    let taskUpdate: ReturnType<typeof calculateTaskProgressUpdate> = null;
    const task = card.tasks.find((candidate) => {
      if (candidate.type !== type || candidate.completedAt) return false;
      taskUpdate = calculateTaskProgressUpdate(
        candidate,
        completedQty,
        targetTier,
      );
      return taskUpdate !== null;
    });
    if (!task || !taskUpdate) return;
    const { progress, isComplete } = taskUpdate;
    const taskCompletedAt = isComplete ? completedAt : null;
    await tx.dailyCardTask.update({
      where: { id: task.id },
      data: { progress, completedAt: taskCompletedAt },
    });

    const tasksAfterUpdate = card.tasks.map((candidate) =>
      candidate.id === task.id
        ? { ...candidate, progress, completedAt: taskCompletedAt }
        : candidate,
    );
    if (allTasksComplete(tasksAfterUpdate)) {
      await tx.dailyCard.update({
        where: { id: card.id },
        data: { status: 'CLAIMABLE' },
      });
    }
  }

  private async ensureDailyCardInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    worldId: string,
    dayKey: string,
  ): Promise<void> {
    const cardData = await this.buildDailyCardPayload(tx, userId, worldId);
    await tx.dailyCard.upsert({
      where: { userId_worldId_dayKey: { userId, worldId, dayKey } },
      update: {},
      create: { userId, worldId, dayKey, ...cardData },
      select: { id: true },
    });
  }

  private async buildDailyCardPayload(
    reader: CastleLevelReader,
    userId: string,
    worldId: string,
  ) {
    const scaling = getDailyCardScaling(
      await getPlayerMaxCastleLevel(reader, userId, worldId),
    );
    return {
      rewardWood: scaling.reward.wood,
      rewardStone: scaling.reward.stone,
      rewardIron: scaling.reward.iron,
      tasks: {
        create: scaling.tasks.map((task) => ({
          type: task.type,
          label: task.label,
          target: task.target,
          metadata: task.metadata as Prisma.InputJsonObject,
        })),
      },
    };
  }

  private async expireStaleCards(
    userId: string,
    worldId: string,
    currentDayKey: string,
    now: Date,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.expireStaleCardsInTransaction(
        tx,
        userId,
        worldId,
        currentDayKey,
        now,
      );
    });
  }

  private async expireStaleCardsInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    worldId: string,
    currentDayKey: string,
    now: Date,
  ): Promise<void> {
    const claimableDayKeys = getClaimableDayKeys(now);
    await tx.dailyCard.updateMany({
      where: {
        userId,
        worldId,
        status: 'ACTIVE',
        dayKey: { not: currentDayKey },
      },
      data: { status: 'EXPIRED' },
    });
    await tx.dailyCard.updateMany({
      where: {
        userId,
        worldId,
        status: 'CLAIMABLE',
        dayKey: { notIn: claimableDayKeys },
      },
      data: { status: 'EXPIRED' },
    });
  }
}

function allTasksComplete(
  tasks: Array<{ progress: number; target: number; completedAt: Date | null }>,
): boolean {
  return tasks.every(
    (task) => task.completedAt || task.progress >= task.target,
  );
}

function mapTask(task: DailyCardTask): DailyCardTaskDto {
  return {
    id: task.id,
    type: task.type,
    label: task.label,
    progress: task.progress,
    target: task.target,
    completedAt: task.completedAt?.toISOString() ?? null,
    metadata: parseTaskMetadata(task.metadata),
  };
}

function mapCard(card: CardWithTasks): DailyCardDto {
  return {
    id: card.id,
    worldId: card.worldId,
    dayKey: card.dayKey,
    status: card.status,
    reward: {
      type: card.rewardType,
      wood: card.rewardWood,
      stone: card.rewardStone,
      iron: card.rewardIron,
    },
    rewardVillageId: card.rewardVillageId,
    claimedAt: card.claimedAt?.toISOString() ?? null,
    createdAt: card.createdAt.toISOString(),
    tasks: card.tasks.map(mapTask),
  };
}

function mapOyez(oyez: {
  id: string;
  worldId: string;
  title: string;
  description: string;
  theme: string;
  startsAt: Date;
  endsAt: Date;
}): DailyOyezDto {
  return {
    id: oyez.id,
    worldId: oyez.worldId,
    title: oyez.title,
    description: oyez.description,
    theme: oyez.theme,
    startsAt: oyez.startsAt.toISOString(),
    endsAt: oyez.endsAt.toISOString(),
  };
}
