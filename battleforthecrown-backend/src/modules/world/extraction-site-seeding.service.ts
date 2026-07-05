import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ResourceExtractionSite } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  EXTRACTION_SITES_PER_PLAYER_RATIO,
  EXTRACTION_SITE_INITIAL_CAPACITY,
  type ExtractionResourceType,
} from '@battleforthecrown/shared/extraction';

const MAX_PLACEMENT_ATTEMPTS = 50;

const RESOURCE_TYPES_IN_ORDER: readonly ExtractionResourceType[] = [
  'WOOD',
  'STONE',
  'IRON',
];

@Injectable()
export class ExtractionSiteSeedingService {
  private readonly logger = new Logger(ExtractionSiteSeedingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure the world has its target number of ACTIVE extraction sites.
   * Target is always strictly below the member count (spec: sites rares,
   * en nombre inférieur au nombre de joueurs d'une zone).
   *
   * Concurrent joins racing this method would otherwise TOCTOU the
   * read-count-then-create sequence (both read the same `activeCount` and
   * both create, overshooting `target`). A per-world advisory lock (same
   * pattern as `RecruitTroopsUseCase`) serializes the whole read→create
   * sequence across concurrent callers.
   */
  async ensureSites(worldId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`extraction-site-seeding:${worldId}`}))`;

      const memberCount = await tx.worldMembership.count({
        where: { worldId },
      });

      const target = Math.floor(
        memberCount * EXTRACTION_SITES_PER_PLAYER_RATIO,
      );
      if (target <= 0) {
        return;
      }

      const activeCount = await tx.resourceExtractionSite.count({
        where: { worldId, state: 'ACTIVE' },
      });

      const need = target - activeCount;
      if (need <= 0) {
        return;
      }

      for (let i = 0; i < need; i++) {
        const resourceType = await this.pickLeastRepresentedType(worldId, tx);
        const created = await this.respawnSite(tx, worldId, resourceType);
        if (!created) {
          this.logger.warn(
            `Could not place extraction site (${resourceType}) for world ${worldId}: no valid spot found`,
          );
          break;
        }
      }
    });
  }

  /**
   * Create a single ACTIVE site of the given resource type at a new random
   * valid position. Usable inside an existing transaction (e.g. lifecycle
   * respawn on depletion). Returns undefined (no throw) if no valid spot is
   * found within the attempt budget.
   */
  async respawnSite(
    tx: Prisma.TransactionClient,
    worldId: string,
    resourceType: ExtractionResourceType,
  ): Promise<ResourceExtractionSite | undefined> {
    const world = await tx.world.findUnique({ where: { id: worldId } });
    if (!world) {
      this.logger.warn(
        `Cannot respawn extraction site: world ${worldId} not found`,
      );
      return undefined;
    }

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const x = Math.floor(Math.random() * world.gridWidth);
      const y = Math.floor(Math.random() * world.gridHeight);

      const [collidingVillage, collidingSite] = await Promise.all([
        tx.village.findUnique({ where: { worldId_x_y: { worldId, x, y } } }),
        tx.resourceExtractionSite.findUnique({
          where: { worldId_x_y: { worldId, x, y } },
        }),
      ]);

      if (collidingVillage || collidingSite) {
        continue;
      }

      try {
        return await tx.resourceExtractionSite.create({
          data: {
            worldId,
            x,
            y,
            resourceType,
            initialCapacity: EXTRACTION_SITE_INITIAL_CAPACITY,
            remainingCapacity: EXTRACTION_SITE_INITIAL_CAPACITY,
            state: 'ACTIVE',
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          this.logger.debug(
            `Skipping duplicate extraction site at (${x}, ${y})`,
          );
          continue;
        }
        throw error;
      }
    }

    this.logger.warn(
      `Could not find a valid spot for extraction site (${resourceType}) in world ${worldId} after ${MAX_PLACEMENT_ATTEMPTS} attempts`,
    );
    return undefined;
  }

  /**
   * Pick the resource type least represented among ACTIVE sites, defaulting
   * to WOOD → STONE → IRON on ties for a stable, balanced distribution.
   */
  private async pickLeastRepresentedType(
    worldId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<ExtractionResourceType> {
    const grouped = await tx.resourceExtractionSite.groupBy({
      by: ['resourceType'],
      where: { worldId, state: 'ACTIVE' },
      _count: { _all: true },
    });

    const counts: Record<ExtractionResourceType, number> = {
      WOOD: 0,
      STONE: 0,
      IRON: 0,
    };
    for (const row of grouped) {
      counts[row.resourceType] = row._count._all;
    }

    return RESOURCE_TYPES_IN_ORDER.reduce((least, current) =>
      counts[current] < counts[least] ? current : least,
    );
  }
}
