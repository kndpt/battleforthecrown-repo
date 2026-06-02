export const DAILY_CARD_STATUSES = [
  'ACTIVE',
  'CLAIMABLE',
  'CLAIMED',
  'EXPIRED',
] as const;
export type DailyCardStatus = (typeof DAILY_CARD_STATUSES)[number];

export const DAILY_CARD_TASK_TYPES = [
  'TRAIN_UNITS',
  'COMPLETE_BUILDING',
  'RAID_BARBARIAN',
  'SCOUT_TARGET',
  'SEND_REINFORCEMENT',
] as const;
export type DailyCardTaskType = (typeof DAILY_CARD_TASK_TYPES)[number];

export const DAILY_REWARD_TYPES = ['RESOURCES'] as const;
export type DailyRewardType = (typeof DAILY_REWARD_TYPES)[number];

export interface DailyCardTaskDto {
  id: string;
  type: DailyCardTaskType;
  label: string;
  progress: number;
  target: number;
  completedAt: string | null;
}

export interface DailyCardRewardDto {
  type: DailyRewardType;
  wood: number;
  stone: number;
  iron: number;
}

export interface DailyCardDto {
  id: string;
  worldId: string;
  dayKey: string;
  status: DailyCardStatus;
  reward: DailyCardRewardDto;
  rewardVillageId: string | null;
  claimedAt: string | null;
  createdAt: string;
  tasks: DailyCardTaskDto[];
}

export interface DailyOyezDto {
  id: string;
  worldId: string;
  title: string;
  description: string;
  theme: string;
  startsAt: string;
  endsAt: string;
}

export interface RetentionSummaryDto {
  worldId: string;
  currentDayKey: string;
  backlogLimit: number;
  claimableCount: number;
  defaultRewardVillageId: string | null;
  oyez: DailyOyezDto | null;
  cards: DailyCardDto[];
}

export interface ClaimDailyCardRequest {
  villageId: string;
}

export interface ClaimDailyCardResponse {
  card: DailyCardDto;
  rewardVillageId: string;
}
