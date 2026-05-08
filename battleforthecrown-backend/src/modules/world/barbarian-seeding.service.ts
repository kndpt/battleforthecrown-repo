import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianVillageFactory } from './barbarian-village.factory';
import {
  determineTier,
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
  }): Promise<{ created: number; chunksProcessed: number }> {
    const { worldId, villageX, villageY } = params;
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
      });
    }

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
  }): Promise<number> {
    const { worldId, chunk, centerX, centerY, world, config } = params;

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

      const capacity = randomInt(config.targetMin, config.targetMax);
      const need = Math.max(0, capacity - existingCount);
      if (need === 0) return 0;

      const halo = config.minSpacing;
      const haloVillages = await tx.village.findMany({
        where: {
          worldId,
          x: { gte: bounds.minX - halo, lte: bounds.maxX + halo },
          y: { gte: bounds.minY - halo, lte: bounds.maxY + halo },
        },
        select: { x: true, y: true, isBarbarian: true },
      });

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
