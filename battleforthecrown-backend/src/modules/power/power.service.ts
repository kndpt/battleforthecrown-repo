import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { PrismaClientOrTx } from '../../common/prisma.types';
import {
  getBuildingPowerWeight,
  getUnitPowerWeight,
} from '@battleforthecrown/shared/power';

type LeaderboardType = 'total' | 'kingdom' | 'army';

@Injectable()
export class PowerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getVillagePower(villageId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: { buildings: true, unitInventory: true },
    });

    if (!village) throw new NotFoundException('Village not found');

    const buildings = village.buildings.reduce((sum, building) => {
      const base = getBuildingPowerWeight(building.type);
      return sum + base * building.level;
    }, 0);

    const army = village.unitInventory.reduce((sum, unit) => {
      const weight = getUnitPowerWeight(unit.unitType);
      return sum + weight * unit.quantity;
    }, 0);

    const total = buildings + army;
    return { villageId, total, buildings, army };
  }

  async getPublicVillagePower(villageId: string) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: { buildings: true },
    });

    if (!village) throw new NotFoundException('Village not found');

    const buildings = village.buildings.reduce((sum, building) => {
      const base = getBuildingPowerWeight(building.type);
      return sum + base * building.level;
    }, 0);

    return { villageId, buildings };
  }

  async getLeaderboard(type: LeaderboardType, limit = 20) {
    const villages = await this.prisma.village.findMany({
      include: { buildings: true, unitInventory: true, user: true },
    });

    const computed = villages
      .filter((village) => village.user !== null) // Exclude barbarian villages
      .map((village) => {
        const scores = this.computeScores(village);
        return {
          villageId: village.id,
          villageName: village.name,
          userId: village.userId!,
          email: village.user!.email,
          ...scores,
        };
      });

    const sorted = computed.sort((a, b) => {
      if (type === 'kingdom') return b.building - a.building;
      if (type === 'army') return b.army - a.army;
      return b.total - a.total;
    });

    return sorted.slice(0, limit);
  }

  /**
   * Calculate and save power snapshot for a village
   * Used after conquest or major changes
   */
  async calculateAndSave(villageId: string, tx?: PrismaClientOrTx) {
    const prisma = tx || this.prisma;

    const village = await prisma.village.findUnique({
      where: { id: villageId },
      include: { buildings: true, unitInventory: true },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const scores = this.computeScores(village);

    return prisma.powerSnapshot.create({
      data: {
        villageId,
        total: scores.total,
        kingdom: scores.building, // Note: DB field still named 'kingdom' but represents building power
        army: scores.army,
      },
    });
  }

  private computeScores(village: {
    buildings: { type: string; level: number }[];
    unitInventory: { unitType: string; quantity: number }[];
  }) {
    const building = village.buildings.reduce((sum, building) => {
      const base = getBuildingPowerWeight(building.type);
      return sum + base * building.level;
    }, 0);

    const army = village.unitInventory.reduce((sum, unit) => {
      const weight = getUnitPowerWeight(unit.unitType);
      return sum + weight * unit.quantity;
    }, 0);

    return { total: building + army, building, army };
  }

  /**
   * Get total power for all villages of a player (Kingdom Power)
   * Kingdom Power = Σ(Village_Power) as defined in documentation
   */
  async getKingdomPower(userId: string) {
    const villages = await this.prisma.village.findMany({
      where: { userId },
      include: { buildings: true, unitInventory: true },
    });

    if (villages.length === 0) {
      return {
        userId,
        kingdomPower: 0,
        villageCount: 0,
        villages: [],
        totalBuildings: 0,
        totalArmy: 0,
      };
    }

    let totalBuildings = 0;
    let totalArmy = 0;

    const villagePowers = villages.map((village) => {
      const building = village.buildings.reduce((sum, building) => {
        const base = getBuildingPowerWeight(building.type);
        return sum + base * building.level;
      }, 0);

      const army = village.unitInventory.reduce((sum, unit) => {
        const weight = getUnitPowerWeight(unit.unitType);
        return sum + weight * unit.quantity;
      }, 0);

      totalBuildings += building;
      totalArmy += army;

      return {
        villageId: village.id,
        villageName: village.name,
        total: building + army,
        building,
        army,
      };
    });

    return {
      userId,
      kingdomPower: totalBuildings + totalArmy,
      villageCount: villages.length,
      villages: villagePowers,
      totalBuildings,
      totalArmy,
    };
  }

  async getPublicKingdomPower(userId: string) {
    const kingdom = await this.getKingdomPower(userId);
    return {
      userId: kingdom.userId,
      kingdomPower: kingdom.kingdomPower,
    };
  }
}
