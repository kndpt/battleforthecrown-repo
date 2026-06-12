import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WATCHTOWER_VISION_LEVELS } from '@battleforthecrown/shared/village';
import { findOnboardingNarrativeTargetPosition } from '@battleforthecrown/shared/onboarding';
import { determineTier } from '@battleforthecrown/shared/world';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { BarbarianVillageFactory } from '../world/barbarian-village.factory';

type Tx = Prisma.TransactionClient;

@Injectable()
export class OnboardingNarrativeTargetService {
  private readonly logger = new Logger(OnboardingNarrativeTargetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly barbarianFactory: BarbarianVillageFactory,
  ) {}

  async ensureForWatchtowerReveal(
    tx: Tx,
    params: {
      userId: string;
      worldId: string;
      villageId: string;
      villageX: number;
      villageY: number;
    },
  ): Promise<string | null> {
    const state = await tx.onboardingState.findUnique({
      where: {
        userId_worldId: {
          userId: params.userId,
          worldId: params.worldId,
        },
      },
      select: {
        id: true,
        status: true,
        narrativeTargetVillageId: true,
      },
    });

    if (!state || state.status !== 'ACTIVE' || state.narrativeTargetVillageId) {
      return state?.narrativeTargetVillageId ?? null;
    }

    return this.createNarrativeTarget(tx, {
      onboardingStateId: state.id,
      worldId: params.worldId,
      villageX: params.villageX,
      villageY: params.villageY,
    });
  }

  async ensureForActiveOnboarding(
    userId: string,
    worldId: string,
  ): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const state = await tx.onboardingState.findUnique({
        where: { userId_worldId: { userId, worldId } },
        include: {
          narrativeTarget: {
            select: { id: true },
          },
        },
      });

      if (!state || state.status !== 'ACTIVE') {
        return state?.narrativeTargetVillageId ?? null;
      }

      if (state.narrativeTargetVillageId) {
        return state.narrativeTargetVillageId;
      }

      const village = await tx.village.findUnique({
        where: { id: state.firstVillageId },
        select: { x: true, y: true },
      });
      if (!village) return null;

      const watchtower = await tx.building.findFirst({
        where: {
          villageId: state.firstVillageId,
          type: 'WATCHTOWER',
          level: { gte: 1 },
        },
        select: { id: true },
      });
      if (!watchtower) return null;

      return this.createNarrativeTarget(tx, {
        onboardingStateId: state.id,
        worldId,
        villageX: village.x,
        villageY: village.y,
      });
    });
  }

  private async createNarrativeTarget(
    tx: Tx,
    params: {
      onboardingStateId: string;
      worldId: string;
      villageX: number;
      villageY: number;
    },
  ): Promise<string | null> {
    const { onboardingStateId, worldId, villageX, villageY } = params;
    const config = await this.worldConfig.getConfig(worldId);
    const seedingConfig = config.barbarianSeeding;
    if (!seedingConfig?.enabled) return null;

    const world = await tx.world.findUnique({
      where: { id: worldId },
      select: { gridWidth: true, gridHeight: true },
    });
    if (!world) return null;

    const watchtowerLevelOneRadius =
      WATCHTOWER_VISION_LEVELS[1]?.visibilityRadius ?? 0;
    const tierOneRange = seedingConfig.tierRanges.find(
      (range) => range.tier === 'T1',
    );
    const minDistance = Math.max(
      seedingConfig.rMin,
      tierOneRange?.minDistance ?? 0,
    );
    const maxDistance = Math.min(
      watchtowerLevelOneRadius,
      tierOneRange?.maxDistance ?? watchtowerLevelOneRadius,
    );

    if (maxDistance < minDistance) return null;

    const halo = watchtowerLevelOneRadius + seedingConfig.minSpacing;
    const nearbyVillages = await tx.village.findMany({
      where: {
        worldId,
        x: {
          gte: Math.floor(villageX - halo),
          lte: Math.ceil(villageX + halo),
        },
        y: {
          gte: Math.floor(villageY - halo),
          lte: Math.ceil(villageY + halo),
        },
      },
      select: { x: true, y: true, isBarbarian: true },
    });

    const playerVillages = nearbyVillages
      .filter((village) => !village.isBarbarian)
      .map(({ x, y }) => ({ x, y }));
    const existingPositions = nearbyVillages.map(({ x, y }) => ({ x, y }));
    const spacingAttempts = [
      seedingConfig.minSpacing,
      seedingConfig.playerExclusion,
      1,
    ];

    let position = null;
    for (const minSpacing of spacingAttempts) {
      position = findOnboardingNarrativeTargetPosition({
        centerX: villageX,
        centerY: villageY,
        worldWidth: world.gridWidth,
        worldHeight: world.gridHeight,
        minDistance,
        maxDistance,
        minSpacing,
        playerExclusion: seedingConfig.playerExclusion,
        existingPositions,
        playerVillages,
      });
      if (position) break;
    }

    if (!position) {
      this.logger.warn(
        `Could not place onboarding narrative target near (${villageX}, ${villageY}) in world ${worldId}`,
      );
      return null;
    }

    const tier = determineTier(position, villageX, villageY, seedingConfig);
    if (tier !== 'T1') {
      this.logger.warn(
        `Onboarding narrative target candidate at (${position.x}, ${position.y}) resolved to ${tier}, skipping`,
      );
      return null;
    }

    try {
      const village =
        await this.barbarianFactory.createNarrativeOnboardingTarget(tx, {
          worldId,
          x: position.x,
          y: position.y,
        });

      await tx.onboardingState.update({
        where: { id: onboardingStateId },
        data: { narrativeTargetVillageId: village.id },
      });

      return village.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingTarget = await tx.onboardingState.findUnique({
          where: { id: onboardingStateId },
          select: { narrativeTargetVillageId: true },
        });
        return existingTarget?.narrativeTargetVillageId ?? null;
      }
      throw error;
    }
  }
}
