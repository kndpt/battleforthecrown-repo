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
import type {
  BattleResolvedPayload,
  BuildingCompletedPayload,
  EventKind,
  PayloadForKind,
  UnitTrainedPayload,
} from '../event/event-types';
import { createOutboxEvent } from '../event/event.utils';
import { ResourcesService } from '../resources/resources.service';
import {
  compareBarbarianTier,
  getDailyCardScaling,
  type DailyTaskMetadata,
} from './retention-scaling';
import type {
  ClaimDailyCardResponse,
  DailyCardDto,
  DailyCardTaskDto,
  DailyOyezDto,
  RetentionSummaryDto,
} from '@battleforthecrown/shared/retention';

const DAILY_CARD_LIMIT = 1;
const PARIS_RESET_HOUR = 4;

type CardWithTasks = DailyCard & { tasks: DailyCardTask[] };

@Injectable()
export class RetentionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
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
      const scaling = getDailyCardScaling(
        await getPlayerMaxCastleLevel(this.prisma, userId, worldId),
      );
      await this.prisma.dailyCard.create({
        data: {
          userId,
          worldId,
          dayKey,
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
        },
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

    const task = card.tasks.find(
      (candidate) =>
        candidate.type === type &&
        !candidate.completedAt &&
        calculateTaskProgressUpdate(candidate, completedQty, targetTier) !==
          null,
    );
    if (!task) return;

    const update = calculateTaskProgressUpdate(task, completedQty, targetTier);
    if (!update) return;
    const progress = update.progress;
    const taskCompletedAt = update.isComplete ? completedAt : null;
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
    const scaling = getDailyCardScaling(
      await getPlayerMaxCastleLevel(tx, userId, worldId),
    );
    await tx.dailyCard.upsert({
      where: { userId_worldId_dayKey: { userId, worldId, dayKey } },
      update: {},
      create: {
        userId,
        worldId,
        dayKey,
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
      },
      select: { id: true },
    });
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

export function getTaskProjection<K extends EventKind>(
  kind: K,
  payload: PayloadForKind<K>,
): {
  villageId: string;
  type: DailyCardTaskType;
  completedQty: number;
  targetTier: string | null;
} | null {
  switch (kind) {
    case 'unit.trained': {
      const eventPayload = payload as UnitTrainedPayload;
      return {
        villageId: eventPayload.villageId,
        type: 'TRAIN_UNITS',
        completedQty: eventPayload.completedQty,
        targetTier: null,
      };
    }
    case 'building.completed': {
      const eventPayload = payload as BuildingCompletedPayload;
      return {
        villageId: eventPayload.villageId,
        type: 'COMPLETE_BUILDING',
        completedQty: 1,
        targetTier: null,
      };
    }
    case 'battle.resolved': {
      const eventPayload = payload as BattleResolvedPayload;
      return eventPayload.targetKind === 'BARBARIAN_VILLAGE' &&
        eventPayload.isVictory
        ? {
            villageId: eventPayload.villageId,
            type: 'RAID_BARBARIAN',
            completedQty: 1,
            targetTier: eventPayload.targetTier ?? null,
          }
        : null;
    }
    default:
      return null;
  }
}

interface CastleLevelReader {
  building: {
    aggregate(args: {
      where: { type: string; village: { userId: string; worldId: string } };
      _max: { level: true };
    }): Promise<{ _max: { level: number | null } }>;
  };
}

export async function getPlayerMaxCastleLevel(
  prisma: CastleLevelReader,
  userId: string,
  worldId: string,
): Promise<number> {
  const result = await prisma.building.aggregate({
    where: {
      type: 'CASTLE',
      village: { userId, worldId },
    },
    _max: { level: true },
  });

  return result._max.level ?? 1;
}

export function calculateTaskProgressUpdate(
  task: Pick<DailyCardTask, 'progress' | 'target' | 'metadata'>,
  eventCompletedQty: number,
  targetTier: string | null,
): { progress: number; isComplete: boolean } | null {
  if (eventCompletedQty <= 0) return null;
  const metadata = parseTaskMetadata(task.metadata);
  if (
    metadata.minTargetTier &&
    compareBarbarianTier(targetTier, metadata.minTargetTier) < 0
  ) {
    return null;
  }
  const completedQty = metadata.completedQty ?? eventCompletedQty;
  const progress = Math.min(task.progress + completedQty, task.target);
  return { progress, isComplete: progress >= task.target };
}

export function parseTaskMetadata(
  metadata: Prisma.JsonValue,
): DailyTaskMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const raw = metadata as Record<string, unknown>;
  return {
    completedQty:
      typeof raw.completedQty === 'number' && Number.isFinite(raw.completedQty)
        ? Math.max(1, Math.floor(raw.completedQty))
        : undefined,
    minTargetTier:
      typeof raw.minTargetTier === 'string' &&
      /^T[1-5]$/.test(raw.minTargetTier)
        ? (raw.minTargetTier as DailyTaskMetadata['minTargetTier'])
        : undefined,
  };
}

function allTasksComplete(
  tasks: Array<{ progress: number; target: number; completedAt: Date | null }>,
): boolean {
  return tasks.every(
    (task) => task.completedAt || task.progress >= task.target,
  );
}

export function getParisDailyKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const hour = Number(values.hour);

  if (hour >= PARIS_RESET_HOUR) {
    return formatDayKey(year, month, day);
  }
  return previousDayKey(year, month, day);
}

export function getPreviousParisDailyKey(now: Date): string {
  return previousDayKeyFromKey(getParisDailyKey(now));
}

export function getClaimableDayKeys(now: Date): string[] {
  return [getParisDailyKey(now), getPreviousParisDailyKey(now)];
}

export function isWithinClaimGrace(dayKey: string, now: Date): boolean {
  return getClaimableDayKeys(now).includes(dayKey);
}

function formatDayKey(year: number, month: number, day: number): string {
  return [
    year.toString().padStart(4, '0'),
    month.toString().padStart(2, '0'),
    day.toString().padStart(2, '0'),
  ].join('-');
}

function previousDayKey(year: number, month: number, day: number): string {
  const previousDate = new Date(Date.UTC(year, month - 1, day - 1));
  return previousDate.toISOString().slice(0, 10);
}

function previousDayKeyFromKey(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return previousDayKey(year, month, day);
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
