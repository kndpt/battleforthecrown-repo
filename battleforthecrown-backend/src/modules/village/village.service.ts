import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import {
  getBuildingLevelValues,
  getBuildingMaxLevel,
  type VillageLabel,
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
      include: {
        buildings: {
          where: { type: { in: ['CASTLE', 'WATCHTOWER'] } },
          select: { type: true, level: true },
          orderBy: [{ level: 'desc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ conqueredAt: 'asc' }, { createdAt: 'asc' }],
    });
    const capitalVillageId = this.getCapitalVillageId(villages);

    return villages.map((v) => ({
      id: v.id,
      name: v.name,
      worldId: v.worldId,
      x: v.x,
      y: v.y,
      userId: v.userId ?? undefined,
      castleLevel: v.buildings.find((b) => b.type === 'CASTLE')?.level ?? 1,
      watchtowerLevel:
        v.buildings.find((b) => b.type === 'WATCHTOWER')?.level ?? 0,
      createdAt: v.createdAt,
      conqueredAt: v.conqueredAt,
      label: v.label,
      isCapital: v.id === capitalVillageId,
    }));
  }

  async updateLabel(
    villageId: string,
    userId: string,
    label: VillageLabel | null,
  ) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    return this.prisma.village.update({
      where: { id: villageId },
      data: { label },
      select: { id: true, label: true },
    });
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

  private getCapitalVillageId(
    villages: Array<{ id: string; conqueredAt: Date | null; createdAt: Date }>,
  ): string | null {
    const [capital] = [...villages].sort((a, b) => {
      const aAcquiredAt = a.conqueredAt ?? a.createdAt;
      const bAcquiredAt = b.conqueredAt ?? b.createdAt;
      return aAcquiredAt.getTime() - bAcquiredAt.getTime();
    });
    return capital?.id ?? null;
  }
}
