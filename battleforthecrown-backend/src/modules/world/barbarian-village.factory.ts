import { Injectable } from '@nestjs/common';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import type { VillageOriginKind } from '@battleforthecrown/shared/village';
import { getOnboardingNarrativeLoot } from '@battleforthecrown/shared/onboarding';
import { generateBarbarianName } from '@battleforthecrown/shared/world';
import { WorldConfigService } from './world-config.service';
import { PrismaClientOrTx } from '../../common/prisma.types';
import {
  getBuildingTemplate,
  getPopulationMax,
  getWarehouseLevel,
  rollInitialBarbarianUnits,
} from './barbarian-tier-templates';

/**
 * Fixed garrison for the onboarding narrative target: the smoke contract
 * (`ONBOARDING_TRAIN_TROOPS_TARGET = 5`) can win against this specific village.
 * Standard T1 villages stay at 9-15 militia (rollInitialBarbarianUnits) so they
 * remain genuine adversaries — see `docs/gameplay/06-barbarians.md` and run 054.
 */
const ONBOARDING_NARRATIVE_MILITIA_COUNT = 3;

@Injectable()
export class BarbarianVillageFactory {
  constructor(private readonly worldConfig: WorldConfigService) {}

  /**
   * Creates a barbarian village with its buildings, units, resources and
   * population. Idempotency at the position level is the caller's responsibility
   * (handled via P2002 in BarbarianSeedingService.seedChunk).
   *
   * When `originKind === 'ONBOARDING_NARRATIVE'`, the village is built with a
   * fixed weak garrison (3 militia, reduced loot) so the final onboarding step
   * can complete deterministically. All other paths keep the standard roll.
   */
  async create(
    tx: PrismaClientOrTx,
    params: {
      worldId: string;
      tier: string;
      x: number;
      y: number;
      originKind?: VillageOriginKind;
    },
  ) {
    const { worldId, tier, x, y, originKind = 'STANDARD' } = params;
    const isNarrative = originKind === 'ONBOARDING_NARRATIVE';

    const now = new Date();
    const village = await tx.village.create({
      data: {
        worldId,
        userId: null,
        isBarbarian: true,
        originKind,
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

    const units = isNarrative
      ? { [UNIT_TYPES.MILITIA]: ONBOARDING_NARRATIVE_MILITIA_COUNT }
      : rollInitialBarbarianUnits(tier);
    const unitRows = Object.entries(units)
      .filter(([, quantity]) => quantity > 0)
      .map(([unitType, quantity]) => ({
        villageId: village.id,
        unitType,
        quantity,
      }));
    await tx.unitInventory.createMany({ data: unitRows });

    const resources = isNarrative
      ? this.generateNarrativeResources(worldId, tier)
      : this.generateResources(worldId, tier);
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

  private generateNarrativeResources(worldId: string, tier: string) {
    const warehouseLevel = getWarehouseLevel(tier);
    const maxPerType = this.worldConfig.getStorageLimit(
      worldId,
      warehouseLevel,
    );
    const loot = getOnboardingNarrativeLoot(tier);

    return {
      ...loot,
      maxPerType,
    };
  }
}
