import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

interface ResetWorldParams {
  userId: string;
  worldId: string;
}

@Injectable()
export class ResetWorldUseCase {
  private readonly logger = new Logger(ResetWorldUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: ResetWorldParams): Promise<void> {
    const { userId, worldId } = params;

    await this.prisma.$transaction(async (tx) => {
      const villages = await tx.village.findMany({
        where: { userId, worldId },
        select: { id: true },
      });
      const villageIds = villages.map((v) => v.id);

      this.logger.log(
        `Resetting world ${worldId} for user ${userId} (${villageIds.length} villages)`,
      );

      if (villageIds.length > 0) {
        await tx.expedition.deleteMany({
          where: { attackerVillageId: { in: villageIds } },
        });
      }
      await tx.combatReport.deleteMany({
        where: { worldId, attackerUserId: userId },
      });
      await tx.combatReport.updateMany({
        where: { worldId, defenderUserId: userId },
        data: { defenderUserId: null, defenderVillageId: null },
      });
      await tx.scoutReport.deleteMany({
        where: { worldId, scoutUserId: userId },
      });
      await tx.villageIntel.deleteMany({ where: { worldId, userId } });
      await tx.onboardingState.deleteMany({ where: { userId, worldId } });
      await tx.village.deleteMany({ where: { userId, worldId } });
      await tx.crownBalance.deleteMany({ where: { userId, worldId } });
      await tx.worldSeedState.deleteMany({ where: { userId, worldId } });
      await tx.worldMembership.deleteMany({ where: { userId, worldId } });
    });

    this.logger.log(`Reset complete for world ${worldId} / user ${userId}`);
  }
}
