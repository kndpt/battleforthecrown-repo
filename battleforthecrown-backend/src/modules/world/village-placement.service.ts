import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';

interface Position {
  x: number;
  y: number;
}

interface World {
  gridWidth: number;
  gridHeight: number;
}

@Injectable()
export class VillagePlacementService {
  private readonly logger = new Logger(VillagePlacementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
  ) {}

  /**
   * Find a valid position for a new player village using concentric zones
   */
  async findVillagePosition(params: {
    worldId: string;
    world: World;
  }): Promise<Position> {
    const { worldId, world } = params;
    const config = await this.worldConfig.getConfig(worldId);
    const placementConfig = config.playerVillagePlacement;

    if (!placementConfig?.enabled) {
      // Fallback to old random logic
      return this.findRandomPosition({ worldId, world });
    }

    // Calculate center
    const centerX = Math.floor(world.gridWidth / 2);
    const centerY = Math.floor(world.gridHeight / 2);

    // Try each zone from innermost to outermost
    for (
      let zoneIndex = 0;
      zoneIndex < placementConfig.zones.length;
      zoneIndex++
    ) {
      const zone = placementConfig.zones[zoneIndex];

      // Check if zone has capacity
      const hasCapacity = await this.checkZoneCapacity(
        worldId,
        zoneIndex,
        zone.maxVillages,
      );

      if (!hasCapacity) {
        this.logger.debug(`Zone ${zoneIndex} is full, trying next zone`);
        continue;
      }

      // Try to find position in this zone
      const position = await this.findPositionInZone({
        worldId,
        world,
        centerX,
        centerY,
        zone,
        minSpacing: placementConfig.minSpacing,
      });

      if (position) {
        // Increment zone capacity
        await this.incrementZoneCount(worldId, zoneIndex);
        this.logger.log(
          `Found position (${position.x}, ${position.y}) in zone ${zoneIndex} (radius ${zone.minRadius}-${zone.maxRadius})`,
        );
        return position;
      }
    }

    throw new BadRequestException(
      'Could not find available position in any zone. World may be full.',
    );
  }

  /**
   * Check if a zone has capacity for more villages
   */
  private async checkZoneCapacity(
    worldId: string,
    zoneIndex: number,
    maxVillages: number,
  ): Promise<boolean> {
    const zoneCapacity = await this.prisma.zoneCapacity.findUnique({
      where: {
        worldId_zoneIndex: { worldId, zoneIndex },
      },
    });

    const currentCount = zoneCapacity?.villageCount ?? 0;
    return currentCount < maxVillages;
  }

  /**
   * Increment village count for a zone
   */
  private async incrementZoneCount(
    worldId: string,
    zoneIndex: number,
  ): Promise<void> {
    await this.prisma.zoneCapacity.upsert({
      where: {
        worldId_zoneIndex: { worldId, zoneIndex },
      },
      create: {
        worldId,
        zoneIndex,
        villageCount: 1,
      },
      update: {
        villageCount: { increment: 1 },
      },
    });
  }

  /**
   * Try to find a valid position within a specific zone
   */
  private async findPositionInZone(params: {
    worldId: string;
    world: World;
    centerX: number;
    centerY: number;
    zone: { minRadius: number; maxRadius: number };
    minSpacing: number;
  }): Promise<Position | null> {
    const { worldId, world, centerX, centerY, zone, minSpacing } = params;

    const maxAttempts = 100;

    // Get all existing villages for collision check
    const existingVillages = await this.prisma.village.findMany({
      where: { worldId },
      select: { x: true, y: true },
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random angle
      const angle = Math.random() * 2 * Math.PI;

      // Generate random radius within zone bounds
      const radius =
        zone.minRadius + Math.random() * (zone.maxRadius - zone.minRadius);

      // Calculate position
      const x = Math.floor(centerX + radius * Math.cos(angle));
      const y = Math.floor(centerY + radius * Math.sin(angle));

      // Check bounds
      if (x < 0 || x >= world.gridWidth || y < 0 || y >= world.gridHeight) {
        continue;
      }

      // Check if position is actually in the zone (exact distance check)
      const actualDistance = Math.hypot(x - centerX, y - centerY);
      if (actualDistance < zone.minRadius || actualDistance > zone.maxRadius) {
        continue;
      }

      // Check spacing from existing villages
      const tooClose = existingVillages.some(
        (v) => Math.hypot(x - v.x, y - v.y) < minSpacing,
      );

      if (tooClose) {
        continue;
      }

      // Check if position is already occupied
      const existing = await this.prisma.village.findUnique({
        where: { worldId_x_y: { worldId, x, y } },
      });

      if (!existing) {
        return { x, y };
      }
    }

    return null;
  }

  /**
   * Fallback to random position (legacy behavior)
   */
  private async findRandomPosition(params: {
    worldId: string;
    world: World;
  }): Promise<Position> {
    const { worldId, world } = params;
    const maxAttempts = 100;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const x = Math.floor(Math.random() * world.gridWidth);
      const y = Math.floor(Math.random() * world.gridHeight);

      const existing = await this.prisma.village.findUnique({
        where: { worldId_x_y: { worldId, x, y } },
      });

      if (!existing) {
        return { x, y };
      }
    }

    throw new BadRequestException('Could not find available position');
  }

  /**
   * Get zone statistics for a world (useful for debugging/testing)
   */
  async getZoneStatistics(worldId: string) {
    const config = await this.worldConfig.getConfig(worldId);
    const placementConfig = config.playerVillagePlacement;

    if (!placementConfig?.enabled) {
      return { enabled: false, zones: [] };
    }

    const zoneStats = await Promise.all(
      placementConfig.zones.map(async (zone, index) => {
        const capacity = await this.prisma.zoneCapacity.findUnique({
          where: {
            worldId_zoneIndex: { worldId, zoneIndex: index },
          },
        });

        return {
          zoneIndex: index,
          minRadius: zone.minRadius,
          maxRadius: zone.maxRadius,
          maxVillages: zone.maxVillages,
          currentCount: capacity?.villageCount ?? 0,
          utilization: ((capacity?.villageCount ?? 0) / zone.maxVillages) * 100,
        };
      }),
    );

    return {
      enabled: true,
      zones: zoneStats,
    };
  }
}
