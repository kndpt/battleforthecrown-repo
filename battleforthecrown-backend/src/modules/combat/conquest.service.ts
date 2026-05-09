import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PowerService } from '../power/power.service';
import { createOutboxEvent } from '../event/event.utils';

@Injectable()
export class ConquestService {
  private readonly logger = new Logger(ConquestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly powerService: PowerService,
  ) {}

  /**
   * Conquer a village (MVP: barbarians only)
   * Future: Support player villages with loyalty system
   */
  async conquerVillage(params: {
    attackerVillageId: string;
    targetVillageId: string;
    attackerUserId: string;
  }): Promise<{
    success: boolean;
    villageId: string;
    name: string;
    buildings: number;
    tier?: string;
  }> {
    const { attackerVillageId, targetVillageId, attackerUserId } = params;

    this.logger.log(
      `Attempting conquest: ${attackerVillageId} → ${targetVillageId}`,
    );

    return this.prisma.$transaction(async (tx) => {
      // Fetch target village
      const target = await tx.village.findUnique({
        where: { id: targetVillageId },
        include: {
          buildings: true,
          unitInventory: true,
          resourceStock: true,
        },
      });

      if (!target) {
        throw new NotFoundException('Target village not found');
      }

      // MVP: Only barbarians can be conquered
      if (!target.isBarbarian) {
        throw new ForbiddenException(
          'Player village conquest not implemented yet (requires loyalty system)',
        );
      }

      // Future: For player villages, check loyalty
      // if (!target.isBarbarian) {
      //   const loyalty = await this.loyaltyService.getLoyalty(targetVillageId);
      //   if (loyalty > 0) {
      //     throw new ForbiddenException('Village loyalty too high for conquest');
      //   }
      // }

      // Verify attacker exists
      const attacker = await tx.village.findUnique({
        where: { id: attackerVillageId },
        select: { userId: true },
      });

      if (!attacker) {
        throw new NotFoundException('Attacker village not found');
      }

      if (attacker.userId !== attackerUserId) {
        throw new ForbiddenException(
          'Attacker village does not belong to user',
        );
      }

      // Transfer ownership
      await tx.village.update({
        where: { id: targetVillageId },
        data: {
          userId: attackerUserId,
          isBarbarian: false,
          tier: null, // Clear tier (now a player village)
          conqueredAt: new Date(),
        },
      });

      // Remove barbarian troops (they don't transfer)
      await tx.unitInventory.deleteMany({
        where: { villageId: targetVillageId },
      });

      // Watchtower is never materialized on barbarian conquest — the player must build it.
      // Cf. docs/gameplay/13-barbarian-conquest.md § Vision propre. Aligns the higher tiers
      // (T3+) whose templates include a Watchtower with the spec.
      await tx.building.deleteMany({
        where: { villageId: targetVillageId, type: 'WATCHTOWER' },
      });

      // Keep 50% of resources (game design choice)
      if (target.resourceStock) {
        await tx.resourceStock.update({
          where: { villageId: targetVillageId },
          data: {
            wood: Math.floor(target.resourceStock.wood * 0.5),
            stone: Math.floor(target.resourceStock.stone * 0.5),
            iron: Math.floor(target.resourceStock.iron * 0.5),
          },
        });
      }

      // Buildings stay intact (one of the benefits of conquest!)

      // Calculate initial power snapshot for new village
      try {
        await this.powerService.calculateAndSave(targetVillageId, tx);
      } catch (error) {
        this.logger.warn(
          `Failed to calculate power for conquered village`,
          error,
        );
      }

      // Create event
      await createOutboxEvent(tx, 'village.conquered', targetVillageId, {
        villageId: targetVillageId,
        newOwnerId: attackerUserId,
        previousTier: target.tier,
        x: target.x,
        y: target.y,
        buildingsKept: target.buildings.length,
      });

      this.logger.log(
        `✅ Village ${target.name} conquered by user ${attackerUserId}`,
      );

      return {
        success: true,
        villageId: target.id,
        name: target.name,
        buildings: target.buildings.length,
        tier: target.tier || undefined,
      };
    });
  }

  /**
   * Check if a village can be conquered
   * Future: Check loyalty for player villages
   */
  async canConquer(villageId: string): Promise<{
    canConquer: boolean;
    reason?: string;
  }> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { isBarbarian: true, userId: true },
    });

    if (!village) {
      return { canConquer: false, reason: 'Village not found' };
    }

    // Barbarians can always be conquered (MVP)
    if (village.isBarbarian) {
      return { canConquer: true };
    }

    // Player villages require loyalty system (future)
    return {
      canConquer: false,
      reason: 'Player village conquest not implemented',
    };
  }
}
