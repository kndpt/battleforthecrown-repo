import { Injectable } from '@nestjs/common';
import {
  BUILDING_TYPES,
  WATCHTOWER_VISION_LEVELS,
} from '@battleforthecrown/shared/village';
import {
  isPointInAnyVisionDisk,
  type VisionDisk,
  type WorldEntityFogged,
} from '@battleforthecrown/shared/world';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type { VisionDisk, WorldEntityFogged };

interface PositionedEntity {
  id: string;
  x: number;
  y: number;
}

export type FogResult<T extends PositionedEntity> = T | WorldEntityFogged;

@Injectable()
export class VisionService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisionDisks(userId: string, worldId: string): Promise<VisionDisk[]> {
    const villages = await this.prisma.village.findMany({
      where: { userId, worldId, isBarbarian: false },
      select: {
        x: true,
        y: true,
        buildings: {
          where: { type: BUILDING_TYPES.WATCHTOWER },
          select: { level: true },
        },
      },
    });

    const disks: VisionDisk[] = [];
    for (const village of villages) {
      const watchtower = village.buildings[0];
      if (!watchtower) continue;
      const visionLevel = WATCHTOWER_VISION_LEVELS[watchtower.level];
      if (!visionLevel || !visionLevel.isWorldUnlocked) continue;
      disks.push({
        x: village.x,
        y: village.y,
        radius: visionLevel.visibilityRadius,
      });
    }
    return disks;
  }

  isInVision(
    point: { x: number; y: number },
    disks: readonly VisionDisk[],
  ): boolean {
    return isPointInAnyVisionDisk(point, disks);
  }

  applyFogOfWar<T extends PositionedEntity>(
    entities: readonly T[],
    disks: readonly VisionDisk[],
  ): FogResult<T>[] {
    if (disks.some((d) => d.radius === null)) {
      return [...entities];
    }
    return entities.map<FogResult<T>>((entity) => {
      if (this.isInVision(entity, disks)) return entity;
      return { kind: 'fogged', id: entity.id, x: entity.x, y: entity.y };
    });
  }
}
