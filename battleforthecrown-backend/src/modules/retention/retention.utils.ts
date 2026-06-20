import {
  Prisma,
  type DailyCardTask,
  type DailyCardTaskType,
} from '@prisma/client';
import type {
  BattleResolvedPayload,
  BuildingCompletedPayload,
  EventKind,
  PayloadForKind,
  ReinforcementSentPayload,
  ScoutReportedPayload,
  UnitTrainedPayload,
} from '../event/event-types';
import {
  compareBarbarianTier,
  type DailyTaskMetadata,
} from './retention-scaling';

const PARIS_RESET_HOUR = 4;

export interface CastleLevelReader {
  building: {
    aggregate(args: {
      where: { type: string; village: { userId: string; worldId: string } };
      _max: { level: true };
    }): Promise<{ _max: { level: number | null } }>;
  };
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
    case 'scout.reported': {
      const eventPayload = payload as ScoutReportedPayload;
      return {
        villageId: eventPayload.villageId,
        type: 'SCOUT_TARGET',
        completedQty: 1,
        targetTier: null,
      };
    }
    case 'reinforcement.sent': {
      const eventPayload = payload as ReinforcementSentPayload;
      return {
        villageId: eventPayload.villageId,
        type: 'SEND_REINFORCEMENT',
        completedQty: 1,
        targetTier: null,
      };
    }
    default:
      return null;
  }
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
