import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../infra/prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const barbarianVillageDataSchema = z.object({
  tier: z.string().nullable(),
  name: z.string(),
  villageId: z.string(),
  captureWindow: z
    .object({
      status: z.literal('OPEN'),
      pendingConquestId: z.string(),
      attackerVillageId: z.string(),
      captureUntil: z.string(),
    })
    .optional(),
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

@Injectable()
export class WorldEntitiesQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getEntitiesInRadius(
    worldId: string,
    centerX: number,
    centerY: number,
    radius: number,
    kinds?: string[],
  ) {
    const minX = Math.max(centerX - radius, 0);
    const maxX = Math.min(centerX + radius, 499);
    const minY = Math.max(centerY - radius, 0);
    const maxY = Math.min(centerY + radius, 499);

    const worldEntities = await this.prisma.worldEntity.findMany({
      where: {
        worldId,
        x: { gte: minX, lte: maxX },
        y: { gte: minY, lte: maxY },
        ...(kinds && kinds.length > 0 ? { kind: { in: kinds } } : {}),
      },
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });

    const barbarianVillages =
      (await this.fetchBarbarianVillages(worldId, kinds, {
        minX,
        maxX,
        minY,
        maxY,
      })) ?? [];

    return [...worldEntities, ...barbarianVillages].sort(byCoord);
  }

  async getAllEntities(worldId: string, kinds?: string[]) {
    const worldEntities = await this.prisma.worldEntity.findMany({
      where: {
        worldId,
        ...(kinds && kinds.length > 0 ? { kind: { in: kinds } } : {}),
      },
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });

    const barbarianVillages =
      (await this.fetchBarbarianVillages(worldId, kinds)) ?? [];

    return [...worldEntities, ...barbarianVillages].sort(byCoord);
  }

  async getVillagesInRadius(
    worldId: string,
    centerX: number,
    centerY: number,
    radius: number,
  ) {
    const minX = Math.max(centerX - radius, 0);
    const maxX = centerX + radius;
    const minY = Math.max(centerY - radius, 0);
    const maxY = centerY + radius;

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

  async getAllVillages(worldId: string) {
    return this.prisma.village.findMany({
      where: { worldId },
      select: VILLAGE_SUMMARY_SELECT,
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });
  }

  private async fetchBarbarianVillages(
    worldId: string,
    kinds: string[] | undefined,
    bounds?: { minX: number; maxX: number; minY: number; maxY: number },
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
      const capture = b.pendingConquestTargets[0];

      return {
        id: b.id,
        worldId,
        kind: 'BARBARIAN_VILLAGE' as const,
        x: b.x,
        y: b.y,
        data: {
          tier: b.tier,
          name: b.name,
          villageId: b.id,
          ...(capture
            ? {
                captureWindow: {
                  status: 'OPEN' as const,
                  pendingConquestId: capture.id,
                  attackerVillageId: capture.attackerVillageId,
                  captureUntil: capture.captureUntil.toISOString(),
                },
              }
            : {}),
        },
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
  user: { select: { email: true } },
} as const;

const byCoord = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.y !== b.y ? a.y - b.y : a.x - b.x;
