import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { buildShieldState } from '@battleforthecrown/shared';
import { formatAnonymousPlayerName } from '@battleforthecrown/shared/auth';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import {
  computeRadiusBounds,
  presentCaptureWindow,
  type GridSize,
  type RadiusBounds,
} from './world-entities-query.utils';

const captureWindowSchema = z
  .object({
    status: z.literal('OPEN'),
    pendingConquestId: z.string(),
    attackerVillageId: z.string(),
    captureUntil: z.string(),
  })
  .optional();

const barbarianVillageDataSchema = z.object({
  tier: z.string().nullable(),
  name: z.string(),
  villageId: z.string(),
  captureWindow: captureWindowSchema,
});

type BarbarianVillageData = z.infer<typeof barbarianVillageDataSchema>;

type BarbarianVillageEntity = {
  id: string;
  worldId: string;
  kind: 'BARBARIAN_VILLAGE';
  x: number;
  y: number;
  data: BarbarianVillageData;
};

const playerVillageDataSchema = z.object({
  userId: z.string(),
  ownerDisplayName: z.string(),
  name: z.string(),
  villageId: z.string(),
  castleLevel: z.number().int().min(1).max(10),
  captureWindow: captureWindowSchema,
  newbieShield: z
    .object({
      endsAt: z.string(),
      brokenAt: z.string().nullable(),
      active: z.boolean(),
    })
    .optional(),
});

type PlayerVillageData = z.infer<typeof playerVillageDataSchema>;

type PlayerVillageEntity = {
  id: string;
  worldId: string;
  kind: 'PLAYER_VILLAGE';
  x: number;
  y: number;
  data: PlayerVillageData;
};

export type WorldEntity = BarbarianVillageEntity | PlayerVillageEntity;

export type VillageSummary = Prisma.VillageGetPayload<{
  select: typeof VILLAGE_SUMMARY_SELECT;
}>;

@Injectable()
export class WorldEntitiesQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
  ) {}

  async getEntitiesInRadius(
    worldId: string,
    centerX: number,
    centerY: number,
    radius: number,
    kinds?: string[],
  ): Promise<WorldEntity[]> {
    const bounds = computeRadiusBounds(
      await this.loadGridSize(worldId),
      centerX,
      centerY,
      radius,
    );

    const barbarianVillages =
      (await this.fetchBarbarianVillages(worldId, kinds, bounds)) ?? [];
    const playerVillages =
      (await this.fetchPlayerVillages(worldId, kinds, bounds)) ?? [];

    return [...barbarianVillages, ...playerVillages].sort(byCoord);
  }

  async getAllEntities(
    worldId: string,
    kinds?: string[],
  ): Promise<WorldEntity[]> {
    const barbarianVillages =
      (await this.fetchBarbarianVillages(worldId, kinds)) ?? [];
    const playerVillages =
      (await this.fetchPlayerVillages(worldId, kinds)) ?? [];

    return [...barbarianVillages, ...playerVillages].sort(byCoord);
  }

  async getVillagesInRadius(
    worldId: string,
    centerX: number,
    centerY: number,
    radius: number,
  ): Promise<VillageSummary[]> {
    const { minX, maxX, minY, maxY } = computeRadiusBounds(
      await this.loadGridSize(worldId),
      centerX,
      centerY,
      radius,
    );

    return this.prisma.village.findMany({
      where: {
        worldId,
        x: { gte: minX, lte: maxX },
        y: { gte: minY, lte: maxY },
      },
      select: VILLAGE_SUMMARY_SELECT,
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });
  }

  async getAllVillages(worldId: string): Promise<VillageSummary[]> {
    return this.prisma.village.findMany({
      where: { worldId },
      select: VILLAGE_SUMMARY_SELECT,
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });
  }

  private async loadGridSize(worldId: string): Promise<GridSize> {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: { gridWidth: true, gridHeight: true },
    });
    if (!world) {
      throw new NotFoundException(`World ${worldId} not found`);
    }
    return world;
  }

  private async fetchBarbarianVillages(
    worldId: string,
    kinds: string[] | undefined,
    bounds?: RadiusBounds,
  ): Promise<BarbarianVillageEntity[] | null> {
    const shouldInclude =
      !kinds || kinds.length === 0 || kinds.includes('BARBARIAN_VILLAGE');
    if (!shouldInclude) return null;

    const barbarians = await this.prisma.village.findMany({
      where: {
        worldId,
        isBarbarian: true,
        ...(bounds
          ? {
              x: { gte: bounds.minX, lte: bounds.maxX },
              y: { gte: bounds.minY, lte: bounds.maxY },
            }
          : {}),
      },
      select: {
        id: true,
        x: true,
        y: true,
        name: true,
        tier: true,
        pendingConquestTargets: {
          where: { status: 'OPEN' },
          select: {
            id: true,
            attackerVillageId: true,
            captureUntil: true,
          },
          take: 1,
        },
      },
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });

    return barbarians.map((b) => {
      const captureWindow = presentCaptureWindow(b.pendingConquestTargets[0]);

      return {
        id: b.id,
        worldId,
        kind: 'BARBARIAN_VILLAGE' as const,
        x: b.x,
        y: b.y,
        data: barbarianVillageDataSchema.parse({
          tier: b.tier,
          name: b.name,
          villageId: b.id,
          ...(captureWindow ? { captureWindow } : {}),
        }),
      };
    });
  }

  private async fetchPlayerVillages(
    worldId: string,
    kinds: string[] | undefined,
    bounds?: RadiusBounds,
  ): Promise<PlayerVillageEntity[] | null> {
    const shouldInclude =
      !kinds || kinds.length === 0 || kinds.includes('PLAYER_VILLAGE');
    if (!shouldInclude) return null;

    const villages = await this.prisma.village.findMany({
      where: {
        worldId,
        isBarbarian: false,
        userId: { not: null },
        ...(bounds
          ? {
              x: { gte: bounds.minX, lte: bounds.maxX },
              y: { gte: bounds.minY, lte: bounds.maxY },
            }
          : {}),
      },
      select: {
        id: true,
        x: true,
        y: true,
        name: true,
        userId: true,
        user: {
          select: {
            displayName: true,
            worldMemberships: {
              where: { worldId },
              select: { joinedAt: true, shieldBrokenAt: true },
            },
          },
        },
        buildings: {
          where: { type: 'CASTLE' },
          select: { level: true },
          orderBy: [{ level: 'desc' }, { createdAt: 'asc' }],
          take: 1,
        },
        pendingConquestTargets: {
          where: { status: 'OPEN' },
          select: {
            id: true,
            attackerVillageId: true,
            captureUntil: true,
          },
          take: 1,
        },
      },
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });

    const shieldHours = (await this.worldConfig.getConfig(worldId)).lifecycle
      .newbieShieldHours;
    const now = new Date();

    return villages.map((village) => {
      const castleLevel = village.buildings[0]?.level ?? 1;
      const captureWindow = presentCaptureWindow(
        village.pendingConquestTargets[0],
      );
      const membership = village.user?.worldMemberships?.[0];
      const shieldState = membership
        ? buildShieldState({
            joinedAt: membership.joinedAt,
            brokenAt: membership.shieldBrokenAt,
            newbieShieldHours: shieldHours,
            now,
          })
        : null;
      const newbieShield = shieldState?.active ? shieldState : undefined;

      return {
        id: village.id,
        worldId,
        kind: 'PLAYER_VILLAGE' as const,
        x: village.x,
        y: village.y,
        data: playerVillageDataSchema.parse({
          userId: village.userId,
          ownerDisplayName:
            village.user?.displayName ??
            formatAnonymousPlayerName(village.userId),
          name: village.name,
          villageId: village.id,
          castleLevel,
          ...(captureWindow ? { captureWindow } : {}),
          ...(newbieShield ? { newbieShield } : {}),
        }),
      };
    });
  }
}

const VILLAGE_SUMMARY_SELECT = {
  id: true,
  name: true,
  x: true,
  y: true,
  userId: true,
  isBarbarian: true,
  tier: true,
  createdAt: true,
  user: { select: { displayName: true } },
} as const;

const byCoord = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.y !== b.y ? a.y - b.y : a.x - b.x;
