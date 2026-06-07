import type { DailyCardTaskType } from '@prisma/client';
import { RESOURCE_PRODUCTION_PER_HOUR } from '@battleforthecrown/shared/resources';

export type BarbarianTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface DailyTaskMetadata {
  completedQty?: number;
  minTargetTier?: BarbarianTier;
}

export interface ScaledTaskTemplate {
  type: DailyCardTaskType;
  label: string;
  target: number;
  metadata: DailyTaskMetadata;
  rewardWeight: number;
}

export interface DailyCardScaling {
  castleLevel: number;
  reward: { wood: number; stone: number; iron: number };
  rewardCapPerResource: number;
  tasks: ScaledTaskTemplate[];
}

const MIN_CASTLE_LEVEL = 1;
const MAX_CASTLE_LEVEL = 10;
const DAILY_REWARD_CAP_RATIO = 0.12;
const REWARD_WEIGHT_TOTAL = 4;

const BAND_TASKS: Record<number, ScaledTaskTemplate[]> = {
  1: [trainingTask(1, 1), buildingTask(1, 1), raidTask('T1', 1, 2)],
  2: [trainingTask(2, 1), buildingTask(1, 1), raidTask('T1', 1, 2)],
  3: [trainingTask(3, 1), buildingTask(1, 1), raidTask('T1', 2, 2)],
  4: [trainingTask(4, 1), buildingTask(1, 1), raidTask('T2', 1, 2)],
  5: [trainingTask(5, 1), buildingTask(1, 1), raidTask('T2', 2, 2)],
  6: [trainingTask(6, 1), buildingTask(1, 1), raidTask('T3', 1, 2)],
  7: [trainingTask(8, 1), buildingTask(1, 1), raidTask('T3', 2, 2)],
  8: [trainingTask(10, 1), buildingTask(1, 1), raidTask('T4', 1, 2)],
  9: [trainingTask(12, 1), buildingTask(1, 1), raidTask('T4', 2, 2)],
  10: [trainingTask(15, 1), buildingTask(1, 1), raidTask('T5', 1, 2)],
};

export function getDailyCardScaling(castleLevel: number): DailyCardScaling {
  const band = clampCastleLevel(castleLevel);
  const rewardCapPerResource = getRewardCapPerResource(band);
  const tasks = BAND_TASKS[band];
  const weightedReward = tasks.reduce(
    (sum, task) => sum + task.rewardWeight,
    0,
  );
  const rewardPerResource = Math.min(
    rewardCapPerResource,
    Math.round((rewardCapPerResource * weightedReward) / REWARD_WEIGHT_TOTAL),
  );

  return {
    castleLevel: band,
    reward: {
      wood: rewardPerResource,
      stone: rewardPerResource,
      iron: rewardPerResource,
    },
    rewardCapPerResource,
    tasks,
  };
}

export function clampCastleLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_CASTLE_LEVEL;
  return Math.min(
    MAX_CASTLE_LEVEL,
    Math.max(MIN_CASTLE_LEVEL, Math.floor(level)),
  );
}

export function getRewardCapPerResource(castleLevel: number): number {
  const band = clampCastleLevel(castleLevel);
  const hourlyProduction = RESOURCE_PRODUCTION_PER_HOUR[band];
  return Math.round(hourlyProduction * 24 * DAILY_REWARD_CAP_RATIO);
}

export function compareBarbarianTier(
  actual: string | null | undefined,
  floor: BarbarianTier,
): number {
  return barbarianTierRank(actual) - barbarianTierRank(floor);
}

function barbarianTierRank(tier: string | null | undefined): number {
  const match = /^T([1-5])$/.exec(tier ?? '');
  return match ? Number(match[1]) : 0;
}

function trainingTask(
  target: number,
  rewardWeight: number,
): ScaledTaskTemplate {
  return {
    type: 'TRAIN_UNITS',
    label: target === 1 ? 'Former une unité' : `Former ${target} unités`,
    target,
    metadata: {},
    rewardWeight,
  };
}

function buildingTask(
  target: number,
  rewardWeight: number,
): ScaledTaskTemplate {
  return {
    type: 'COMPLETE_BUILDING',
    label: 'Terminer une construction',
    target,
    metadata: {},
    rewardWeight,
  };
}

function raidTask(
  minTargetTier: BarbarianTier,
  target: number,
  rewardWeight: number,
): ScaledTaskTemplate {
  const tierLabel = minTargetTier;
  return {
    type: 'RAID_BARBARIAN',
    label:
      target === 1
        ? `Vaincre un barbare ${tierLabel} ou plus`
        : `Vaincre ${target} barbares ${tierLabel} ou plus`,
    target,
    metadata: { minTargetTier },
    rewardWeight,
  };
}
