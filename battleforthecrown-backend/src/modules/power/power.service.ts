import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import {
  getBuildingPowerWeight,
  getUnitPowerWeight,
} from '@battleforthecrown/shared/power';

type LeaderboardType = 'total' | 'kingdom' | 'army';
type UnitQuantityMap = Record<string, number>;

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
      include: { buildings: true },
    });

    if (!village) throw new NotFoundException('Village not found');

    const buildings = this.calculateBuildingPower(village.buildings);
    const army =
      (await this.getArmyPowerByOriginVillage([villageId])).get(villageId) ?? 0;

    const total = buildings + army;
    return { villageId, total, buildings, army };
  }

  async getPublicVillagePower(villageId: string) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: { buildings: true },
    });

    if (!village) throw new NotFoundException('Village not found');

    const buildings = this.calculateBuildingPower(village.buildings);

    return { villageId, buildings };
  }

  async getLeaderboard(type: LeaderboardType, limit = 20) {
    const villages = await this.prisma.village.findMany({
      include: { buildings: true, user: true },
    });
    const armyPowerByVillage = await this.getArmyPowerByOriginVillage(
      villages.map((village) => village.id),
    );

    const computed = villages
      .filter((village) => village.user !== null) // Exclude barbarian villages
      .map((village) => {
        const scores = this.computeScores(
          village,
          armyPowerByVillage.get(village.id) ?? 0,
        );
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

  private computeScores(
    village: {
      buildings: { type: string; level: number }[];
    },
    army: number,
  ) {
    const building = this.calculateBuildingPower(village.buildings);

    return { total: building + army, building, army };
  }

  /**
   * Get total power for all villages of a player (Kingdom Power)
   * Kingdom Power = Σ(Village_Power) as defined in documentation
   */
  async getKingdomPower(userId: string) {
    const villages = await this.prisma.village.findMany({
      where: { userId },
      include: { buildings: true },
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
    const armyPowerByVillage = await this.getArmyPowerByOriginVillage(
      villages.map((village) => village.id),
    );

    const villagePowers = villages.map((village) => {
      const building = this.calculateBuildingPower(village.buildings);
      const army = armyPowerByVillage.get(village.id) ?? 0;

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

  private calculateBuildingPower(
    buildings: { type: string; level: number }[],
  ): number {
    return buildings.reduce((sum, building) => {
      const base = getBuildingPowerWeight(building.type);
      return sum + base * building.level;
    }, 0);
  }

  private calculateUnitPower(units: UnitQuantityMap): number {
    return Object.entries(units).reduce((sum, [unitType, quantity]) => {
      if (quantity <= 0) return sum;
      return sum + getUnitPowerWeight(unitType) * quantity;
    }, 0);
  }

  private addArmyPower(
    totals: Map<string, number>,
    originVillageId: string,
    units: UnitQuantityMap,
  ): void {
    if (!totals.has(originVillageId)) return;
    totals.set(
      originVillageId,
      (totals.get(originVillageId) ?? 0) + this.calculateUnitPower(units),
    );
  }

  private parseUnitMap(value: unknown): UnitQuantityMap {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const units: UnitQuantityMap = {};
    for (const [unitType, quantity] of Object.entries(value)) {
      if (typeof quantity === 'number' && Number.isFinite(quantity)) {
        units[unitType] = quantity;
      }
    }
    return units;
  }

  private async getArmyPowerByOriginVillage(
    villageIds: string[],
  ): Promise<Map<string, number>> {
    const uniqueVillageIds = [...new Set(villageIds)];
    const totals = new Map(uniqueVillageIds.map((id) => [id, 0]));
    if (uniqueVillageIds.length === 0) return totals;

    const [inventories, garrisons, expeditions] = await Promise.all([
      this.prisma.unitInventory.findMany({
        where: { villageId: { in: uniqueVillageIds } },
      }),
      this.prisma.garrison.findMany({
        where: { originVillageId: { in: uniqueVillageIds } },
      }),
      this.prisma.expedition.findMany({
        where: {
          status: { in: ['EN_ROUTE', 'RETURNING'] },
          OR: [
            { attackerVillageId: { in: uniqueVillageIds } },
            { reinforcementOriginVillageId: { in: uniqueVillageIds } },
          ],
        },
      }),
    ]);

    for (const inventory of inventories) {
      this.addArmyPower(totals, inventory.villageId, {
        [inventory.unitType]: inventory.quantity,
      });
    }

    for (const garrison of garrisons) {
      this.addArmyPower(totals, garrison.originVillageId, {
        [garrison.unitType]: garrison.quantity,
      });
    }

    for (const expedition of expeditions) {
      const originVillageId =
        expedition.reinforcementOriginVillageId ?? expedition.attackerVillageId;
      const units =
        expedition.status === 'RETURNING' && !expedition.recalled
          ? this.parseUnitMap(expedition.survivingUnits)
          : this.parseUnitMap(expedition.units);
      this.addArmyPower(totals, originVillageId, units);
    }

    return totals;
  }
}
