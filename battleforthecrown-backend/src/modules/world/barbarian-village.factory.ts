import { Injectable } from '@nestjs/common';
import { WorldConfigService } from './world-config.service';
import { PrismaClientOrTx } from '../../common/prisma.types';
import {
  getBuildingTemplate,
  getPopulationMax,
  getWarehouseLevel,
  rollInitialBarbarianUnits,
} from './barbarian-tier-templates';
import {
  ONBOARDING_NARRATIVE_TARGET_NAME,
  ONBOARDING_NARRATIVE_TARGET_UNITS,
} from '@battleforthecrown/shared/onboarding';
import { generateBarbarianName } from '@battleforthecrown/shared/world';

@Injectable()
export class BarbarianVillageFactory {
  constructor(private readonly worldConfig: WorldConfigService) {}

  /**
   * Creates a barbarian village with its buildings, units, resources and
   * population. Idempotency at the position level is the caller's responsibility
   * (handled via P2002 in BarbarianSeedingService.seedChunk).
   */
  async create(
    tx: PrismaClientOrTx,
    params: { worldId: string; tier: string; x: number; y: number },
  ) {
    const { worldId, tier, x, y } = params;

    const now = new Date();
    const village = await tx.village.create({
      data: {
        worldId,
        userId: null,
        isBarbarian: true,
        tier,
        barbarianTroopsLastRegenTs: now,
        name: generateBarbarianName(tier, x, y),
        x,
        y,
      },
    });

    const buildings = getBuildingTemplate(tier).map((b) => ({
      villageId: village.id,
      type: b.type,
      level: b.level,
    }));
    await tx.building.createMany({ data: buildings });

    const units = rollInitialBarbarianUnits(tier);
    const unitRows = Object.entries(units)
      .filter(([, quantity]) => quantity > 0)
      .map(([unitType, quantity]) => ({
        villageId: village.id,
        unitType,
        quantity,
      }));
    await tx.unitInventory.createMany({ data: unitRows });

    const resources = this.generateResources(worldId, tier);
    await tx.resourceStock.create({
      data: {
        villageId: village.id,
        wood: resources.wood,
        stone: resources.stone,
        iron: resources.iron,
        maxPerType: resources.maxPerType,
        lastUpdateTs: now,
      },
    });

    await tx.population.create({
      data: {
        villageId: village.id,
        used: 0,
        max: getPopulationMax(tier),
      },
    });

    return village;
  }

  async createNarrativeOnboardingTarget(
    tx: PrismaClientOrTx,
    params: { worldId: string; x: number; y: number },
  ) {
    const { worldId, x, y } = params;
    const tier = 'T1';
    const now = new Date();
    const village = await tx.village.create({
      data: {
        worldId,
        userId: null,
        isBarbarian: true,
        isOnboardingNarrativeTarget: true,
        tier,
        barbarianTroopsLastRegenTs: now,
        name: ONBOARDING_NARRATIVE_TARGET_NAME,
        x,
        y,
      },
    });

    const buildings = getBuildingTemplate(tier).map((b) => ({
      villageId: village.id,
      type: b.type,
      level: b.level,
    }));
    await tx.building.createMany({ data: buildings });

    const unitRows = Object.entries(ONBOARDING_NARRATIVE_TARGET_UNITS)
      .filter(([, quantity]) => quantity > 0)
      .map(([unitType, quantity]) => ({
        villageId: village.id,
        unitType,
        quantity,
      }));
    await tx.unitInventory.createMany({ data: unitRows });

    const resources = this.generateResources(worldId, tier);
    await tx.resourceStock.create({
      data: {
        villageId: village.id,
        wood: resources.wood,
        stone: resources.stone,
        iron: resources.iron,
        maxPerType: resources.maxPerType,
        lastUpdateTs: now,
      },
    });

    await tx.population.create({
      data: {
        villageId: village.id,
        used: 0,
        max: getPopulationMax(tier),
      },
    });

    return village;
  }

  private generateResources(worldId: string, tier: string) {
    const warehouseLevel = getWarehouseLevel(tier);
    const maxPerType = this.worldConfig.getStorageLimit(
      worldId,
      warehouseLevel,
    );

    // Spawn with 30-100% of warehouse capacity for wood/stone (cf. spec 06-barbarians § Génération).
    // Iron is intentionally skewed at 70% of that ratio (so 21-70% of cap, dipping below the
    // spec's 30% floor for iron only): iron is the bottleneck resource (cf. run 001
    // audit-economy-progression) and the spec leaves per-resource ratios unconstrained.
    const fillRatio = 0.3 + Math.random() * 0.7;

    return {
      wood: Math.floor(maxPerType * fillRatio),
      stone: Math.floor(maxPerType * fillRatio),
      iron: Math.floor(maxPerType * fillRatio * 0.7),
      maxPerType,
    };
  }
}
