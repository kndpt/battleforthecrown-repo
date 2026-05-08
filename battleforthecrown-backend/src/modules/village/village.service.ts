import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import {
  getBuildingLevelValues,
  getBuildingMaxLevel,
} from '@battleforthecrown/shared/village';

@Injectable()
export class VillageService {
  constructor(
    private prisma: PrismaService,
    private ownership: OwnershipService,
  ) {}

  async getVillages(worldId: string, userId: string) {
    const villages = await this.prisma.village.findMany({
      where: { worldId, userId },
      orderBy: { createdAt: 'asc' },
    });

    return villages.map((v) => ({
      id: v.id,
      name: v.name,
      worldId: v.worldId,
      x: v.x,
      y: v.y,
      createdAt: v.createdAt,
    }));
  }

  async getBuildings(villageId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        buildings: {
          orderBy: { type: 'asc' },
        },
      },
    });

    if (!village) throw new NotFoundException('Village not found');

    return village.buildings.map((b) => ({
      id: b.id,
      type: b.type,
      level: b.level,
      maxLevel: getBuildingMaxLevel(b.type),
      populationCost: getBuildingLevelValues(b.type, b.level)?.population ?? 0,
      isUnderConstruction: !!b.endTime,
      startTime: b.startTime,
      endTime: b.endTime,
    }));
  }

  async getQueue(villageId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const buildings = await this.prisma.building.findMany({
      where: { villageId, endTime: { not: null } },
      orderBy: { endTime: 'asc' },
    });

    return buildings.map((b) => ({
      id: b.id,
      type: b.type,
      level: b.level + 1,
      startTime: b.startTime,
      endTime: b.endTime,
    }));
  }
}
