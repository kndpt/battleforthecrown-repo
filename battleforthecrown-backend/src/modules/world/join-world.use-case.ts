import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Village } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianSeedingService } from './barbarian-seeding.service';
import { VillagePlacementService } from './village-placement.service';
import { getInitialPlayerVillageBuildings } from '../village/player-village-building-lifecycle';

interface JoinWorldParams {
  userId: string;
  worldId: string;
  villageName?: string;
}

@Injectable()
export class JoinWorldUseCase {
  private readonly logger = new Logger(JoinWorldUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly barbarianSeeding: BarbarianSeedingService,
    private readonly villagePlacement: VillagePlacementService,
  ) {}

  async execute(params: JoinWorldParams) {
    const { userId, worldId, villageName } = params;

    const result = await this.prisma.$transaction(async (tx) => {
      const world = await tx.world.findUnique({ where: { id: worldId } });
      if (!world) {
        throw new NotFoundException(`World ${worldId} not found`);
      }

      if (world.status === 'LOCKED' || world.status === 'ENDED') {
        throw new BadRequestException(
          `World ${worldId} is not open for joining`,
        );
      }

      const membership = await tx.worldMembership.upsert({
        where: { userId_worldId: { userId, worldId } },
        update: { lastLoginAt: new Date() },
        create: { userId, worldId, lastLoginAt: new Date() },
      });

      const existingVillages = await tx.village.findMany({
        where: { userId, worldId },
      });

      let village: Village | null = null;
      if (existingVillages.length === 0 && villageName) {
        village = await this.createInitialVillage(tx, {
          userId,
          worldId,
          villageName,
          gridWidth: world.gridWidth,
          gridHeight: world.gridHeight,
        });
      }

      return {
        membership,
        village,
        existingVillages: existingVillages.length,
        worldStatus: world.status,
      };
    });

    if (result.village) {
      this.scheduleBarbarianSeeding(
        worldId,
        result.village.x,
        result.village.y,
        result.village.id,
      );
    }

    return result;
  }

  private async createInitialVillage(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    params: {
      userId: string;
      worldId: string;
      villageName: string;
      gridWidth: number;
      gridHeight: number;
    },
  ): Promise<Village> {
    const { userId, worldId, villageName, gridWidth, gridHeight } = params;

    const { x, y } = await this.villagePlacement.findVillagePosition({
      worldId,
      world: { gridWidth, gridHeight },
    });

    const village = await tx.village.create({
      data: { worldId, userId, name: villageName, x, y },
    });

    await tx.building.createMany({
      data: getInitialPlayerVillageBuildings().map((b) => ({
        villageId: village.id,
        type: b.type,
        level: b.level,
      })),
    });

    const storageLimit = this.worldConfig.getStorageLimit(worldId, 1);
    await tx.resourceStock.create({
      data: {
        villageId: village.id,
        wood: startingResourceAmount('WOOD_STARTING_AMOUNT'),
        stone: startingResourceAmount('STONE_STARTING_AMOUNT'),
        iron: startingResourceAmount('IRON_STARTING_AMOUNT'),
        maxPerType: storageLimit,
      },
    });

    const initialPopulation = this.worldConfig.createInitialPopulation(
      worldId,
      1,
    );
    await tx.population.create({
      data: {
        villageId: village.id,
        used: initialPopulation.used,
        max: initialPopulation.max,
      },
    });

    await tx.crownBalance.create({
      data: { userId, worldId, balance: 0, lastUpdateTs: new Date() },
    });

    return village;
  }

  private scheduleBarbarianSeeding(
    worldId: string,
    villageX: number,
    villageY: number,
    anchorVillageId: string,
  ) {
    void this.barbarianSeeding
      .seedAroundVillage({ worldId, villageX, villageY, anchorVillageId })
      .then((seedResult) => {
        this.logger.log(
          `Barbarian seeding completed: ${seedResult.created} BVs in ${seedResult.chunksProcessed} chunks`,
        );
      })
      .catch((err) => {
        this.logger.error('Barbarian seeding failed', err);
      });
  }
}

export const DEFAULT_STARTING_RESOURCE_AMOUNT = 1000;

export function startingResourceAmount(key: string): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_STARTING_RESOURCE_AMOUNT;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${key}: expected a non-negative number`);
  }
  return value;
}
