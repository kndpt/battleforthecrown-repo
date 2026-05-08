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

  /**
   * Maps each entity to its visibility-aware payload. Out-of-vision entities
   * are returned as anonymous blips: `{ kind: 'fogged', id, x, y }`.
   *
   * **Contract — intentional, do not "fix" by hiding x/y/id**:
   * - `x, y` are exposed by design. The blip is meant to convey "something
   *   is here" (TW/KingsAge style). Cf. ADR-11 and
   *   `docs/gameplay/01-overview.md` (section "Exploration & brouillard de
   *   guerre").
   * - `id` is exposed as a stable key for frontend reconciliation (Pixi
   *   sprite tracking across fetches). It is an opaque cuid; it does not
   *   reveal type, owner, level or name.
   * - `tier`, `name`, `villageId`, `userId` and any other gameplay payload
   *   are stripped — that is the actual fog.
   * - A fogged target **cannot be attacked**: enforced server-side in
   *   `CombatService.initiateAttack` (gated by `world.config.fogOfWar.enabled`).
   *
   * Master vision shortcut: if any disk has `radius === null` (watchtower
   * lvl 10), every entity is returned unmasked.
   */
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
