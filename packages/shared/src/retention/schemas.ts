import { z } from "zod";
import {
  DAILY_CARD_STATUSES,
  DAILY_CARD_TASK_TYPES,
  DAILY_REWARD_TYPES,
} from "./types";

export const DailyCardStatusSchema = z.enum(DAILY_CARD_STATUSES);
export const DailyCardTaskTypeSchema = z.enum(DAILY_CARD_TASK_TYPES);
export const DailyRewardTypeSchema = z.enum(DAILY_REWARD_TYPES);

export const DailyCardTaskMetadataSchema = z.object({
  completedQty: z.number().optional(),
  minTargetTier: z.enum(["T1", "T2", "T3", "T4", "T5"]).optional(),
});

export const DailyCardTaskSchema = z.object({
  id: z.string(),
  type: DailyCardTaskTypeSchema,
  label: z.string(),
  progress: z.number(),
  target: z.number(),
  completedAt: z.string().nullable(),
  metadata: DailyCardTaskMetadataSchema,
});

export const DailyCardRewardSchema = z.object({
  type: DailyRewardTypeSchema,
  wood: z.number(),
  stone: z.number(),
  iron: z.number(),
});

export const DailyCardSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  dayKey: z.string(),
  status: DailyCardStatusSchema,
  reward: DailyCardRewardSchema,
  rewardVillageId: z.string().nullable(),
  claimedAt: z.string().nullable(),
  createdAt: z.string(),
  tasks: z.array(DailyCardTaskSchema),
});

export const DailyOyezSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  title: z.string(),
  description: z.string(),
  theme: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
});

export const RetentionSummarySchema = z.object({
  worldId: z.string(),
  currentDayKey: z.string(),
  backlogLimit: z.number(),
  claimableCount: z.number(),
  defaultRewardVillageId: z.string().nullable(),
  oyez: DailyOyezSchema.nullable(),
  cards: z.array(DailyCardSchema),
});

export const ClaimDailyCardRequestSchema = z.object({
  villageId: z.string(),
});
