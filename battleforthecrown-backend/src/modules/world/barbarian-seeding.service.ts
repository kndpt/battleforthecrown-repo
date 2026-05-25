import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WATCHTOWER_VISION_LEVELS } from '@battleforthecrown/shared/village';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianVillageFactory } from './barbarian-village.factory';
import {
  adjustCapacityForPlayerPresence,
  determineTier,
  findReachableBarbarianSeedPosition,
  getChunkBounds,
  getChunksInRings,
  samplePositions,
  type BarbarianSeedingPlan,
  type ChunkCoord,
} from '@battleforthecrown/shared/world';

const MAX_SYNC_CHUNKS = 4;

@Injectable()
export class BarbarianSeedingService {
  private readonly logger = new Logger(BarbarianSeedingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly factory: BarbarianVillageFactory,
  ) {}

  /**
   * Seed barbarian villages around a newly created player village.
   * Processes the closest MAX_SYNC_CHUNKS chunks synchronously.
   */
  async seedAroundVillage(params: {
    worldId: string;
    villageX: number;
    villageY: number;
    anchorVillageId?: string;
  }): Promise<{ created: number; chunksProcessed: number }> {
    const { worldId, villageX, villageY, anchorVillageId } = params;
    const config = await this.worldConfig.getConfig(worldId);
    const seedingConfig = config.barbarianSeeding;

    if (!seedingConfig?.enabled) {
      this.logger.log('Barbarian seeding disabled for this world');
      return { created: 0, chunksProcessed: 0 };
    }

    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
    });
    if (!world) throw new Error(`World ${worldId} not found`);

    const chunks = getChunksInRings(
      villageX,
      villageY,
      seedingConfig.rMin,
      seedingConfig.rMax,
      seedingConfig.chunkSize,
      world.gridWidth,
      world.gridHeight,
    );

    const sortedChunks = sortChunksByDistance(
      chunks,
      villageX,
      villageY,
      seedingConfig.chunkSize,
    );

    const toProcess = Math.min(MAX_SYNC_CHUNKS, sortedChunks.length);
    let totalCreated = 0;

    for (let i = 0; i < toProcess; i++) {
      totalCreated += await this.seedChunk({
        worldId,
        chunk: sortedChunks[i],
        centerX: villageX,
        centerY: villageY,
        world,
        config: seedingConfig,
        anchorVillageId,
      });
    }

    totalCreated += await this.ensureReachableTierOne({
      worldId,
      centerX: villageX,
      centerY: villageY,
      world,
      config: seedingConfig,
    });

    this.logger.log(
      `Seeded ${totalCreated} BVs in ${toProcess} chunks around village at (${villageX}, ${villageY})`,
    );

    return { created: totalCreated, chunksProcessed: toProcess };
  }

  /**
   * Seed a single chunk inside a transaction. Idempotent : reruns may produce
   * 0 villages when the chunk already meets its target capacity.
   */
  private async seedChunk(params: {
    worldId: string;
    chunk: ChunkCoord;
    centerX: number;
    centerY: number;
    world: { gridWidth: number; gridHeight: number };
    config: BarbarianSeedingPlan;
    anchorVillageId?: string;
  }): Promise<number> {
    const { worldId, chunk, centerX, centerY, world, config, anchorVillageId } =
      params;

    return this.prisma.$transaction(async (tx) => {
      await tx.chunkSpawnState.upsert({
        where: { worldId_cx_cy: { worldId, cx: chunk.cx, cy: chunk.cy } },
        create: {
          worldId,
          cx: chunk.cx,
          cy: chunk.cy,
          seedVersion: config.seedVersion,
        },
        update: {},
      });

      const bounds = getChunkBounds(
        chunk.cx,
        chunk.cy,
        config.chunkSize,
        world.gridWidth,
        world.gridHeight,
      );

      const existingCount = await tx.village.count({
        where: {
          worldId,
          isBarbarian: true,
          x: { gte: bounds.minX, lte: bounds.maxX },
          y: { gte: bounds.minY, lte: bounds.maxY },
        },
      });

      const halo = config.minSpacing;
      const haloVillages = await tx.village.findMany({
        where: {
          worldId,
          x: { gte: bounds.minX - halo, lte: bounds.maxX + halo },
          y: { gte: bounds.minY - halo, lte: bounds.maxY + halo },
        },
        select: { id: true, x: true, y: true, isBarbarian: true, userId: true },
      });

      // Spec § Anti-submersion : compte les villages joueurs AUTRES que le
      // déclencheur (`id ≠ anchorVillageId`). Sans cette exclusion, le village
      // anchor compte comme "autre joueur" dans son propre halo et la capacité
      // est divisée par 2 systématiquement.
      const distinctOtherPlayerCount = new Set(
        haloVillages
          .filter((v) => !v.isBarbarian && v.userId && v.id !== anchorVillageId)
          .map((v) => v.userId as string),
      ).size;

      const rawCapacity = randomInt(config.targetMin, config.targetMax);
      const capacity = adjustCapacityForPlayerPresence(
        rawCapacity,
        distinctOtherPlayerCount,
      );

      if (capacity === 0 && distinctOtherPlayerCount >= 2) {
        this.logger.debug(
          `Skipping chunk (cx=${chunk.cx}, cy=${chunk.cy}): ${distinctOtherPlayerCount} other players in halo`,
        );
      }

      const need = Math.max(0, capacity - existingCount);
      if (need === 0) return 0;

      const positions = samplePositions({
        need,
        bounds,
        existingPositions: haloVillages.map(({ x, y }) => ({ x, y })),
        playerVillages: haloVillages
          .filter((v) => !v.isBarbarian)
          .map(({ x, y }) => ({ x, y })),
        centerX,
        centerY,
        rMin: config.rMin,
        rMax: config.rMax,
        minSpacing: config.minSpacing,
        playerExclusion: config.playerExclusion,
      });

      let created = 0;
      for (const pos of positions) {
        const tier = determineTier(pos, centerX, centerY, config);
        try {
          await this.factory.create(tx, { worldId, tier, x: pos.x, y: pos.y });
          created++;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            this.logger.debug(
              `Skipping duplicate village at (${pos.x}, ${pos.y})`,
            );
            continue;
          }
          throw error;
        }
      }

      await tx.chunkSpawnState.update({
        where: { worldId_cx_cy: { worldId, cx: chunk.cx, cy: chunk.cy } },
        data: {
          lastSeededAt: new Date(),
          existingCount: existingCount + created,
        },
      });

      return created;
    });
  }

  private async ensureReachableTierOne(params: {
    worldId: string;
    centerX: number;
    centerY: number;
    world: { gridWidth: number; gridHeight: number };
    config: BarbarianSeedingPlan;
  }): Promise<number> {
    const { worldId, centerX, centerY, world, config } = params;
    const watchtowerLevelOneRadius =
      WATCHTOWER_VISION_LEVELS[1]?.visibilityRadius ?? 0;
    const tierOneRange = config.tierRanges.find((range) => range.tier === 'T1');
    const minDistance = Math.max(config.rMin, tierOneRange?.minDistance ?? 0);
    const maxDistance = Math.min(
      watchtowerLevelOneRadius,
      tierOneRange?.maxDistance ?? watchtowerLevelOneRadius,
    );

    if (maxDistance < minDistance) return 0;

    return this.prisma.$transaction(async (tx) => {
      const existingTierOne = await tx.village.findMany({
        where: {
          worldId,
          isBarbarian: true,
          tier: 'T1',
          x: {
            gte: Math.floor(centerX - watchtowerLevelOneRadius),
            lte: Math.ceil(centerX + watchtowerLevelOneRadius),
          },
          y: {
            gte: Math.floor(centerY - watchtowerLevelOneRadius),
            lte: Math.ceil(centerY + watchtowerLevelOneRadius),
          },
        },
        select: { x: true, y: true },
      });

      const alreadyReachable = existingTierOne.some(
        (village) =>
          Math.hypot(village.x - centerX, village.y - centerY) <=
          watchtowerLevelOneRadius,
      );
      if (alreadyReachable) return 0;

      const halo = watchtowerLevelOneRadius + config.minSpacing;
      const nearbyVillages = await tx.village.findMany({
        where: {
          worldId,
          x: {
            gte: Math.floor(centerX - halo),
            lte: Math.ceil(centerX + halo),
          },
          y: {
            gte: Math.floor(centerY - halo),
            lte: Math.ceil(centerY + halo),
          },
        },
        select: { x: true, y: true, isBarbarian: true },
      });

      const position = findReachableBarbarianSeedPosition({
        centerX,
        centerY,
        worldWidth: world.gridWidth,
        worldHeight: world.gridHeight,
        minDistance,
        maxDistance,
        minSpacing: config.minSpacing,
        playerExclusion: config.playerExclusion,
        existingPositions: nearbyVillages.map(({ x, y }) => ({ x, y })),
        playerVillages: nearbyVillages
          .filter((village) => !village.isBarbarian)
          .map(({ x, y }) => ({ x, y })),
      });

      if (!position) {
        this.logger.warn(
          `Could not guarantee a reachable T1 barbarian near (${centerX}, ${centerY}) in world ${worldId}`,
        );
        return 0;
      }

      const tier = determineTier(position, centerX, centerY, config);
      if (tier !== 'T1') {
        this.logger.warn(
          `Reachable barbarian guarantee candidate at (${position.x}, ${position.y}) resolved to ${tier}, skipping`,
        );
        return 0;
      }

      try {
        await this.factory.create(tx, {
          worldId,
          tier: 'T1',
          x: position.x,
          y: position.y,
        });
        return 1;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          this.logger.debug(
            `Skipping duplicate reachable T1 at (${position.x}, ${position.y})`,
          );
          return 0;
        }
        throw error;
      }
    });
  }
}

function sortChunksByDistance(
  chunks: ChunkCoord[],
  centerX: number,
  centerY: number,
  chunkSize: number,
): ChunkCoord[] {
  const distance = (chunk: ChunkCoord) =>
    Math.hypot(
      chunk.cx * chunkSize + chunkSize / 2 - centerX,
      chunk.cy * chunkSize + chunkSize / 2 - centerY,
    );
  return [...chunks].sort((a, b) => distance(a) - distance(b));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
