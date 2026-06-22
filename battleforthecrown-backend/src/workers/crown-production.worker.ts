import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CrownsService } from '../modules/crowns/crowns.service';
import { registerScheduledQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import PgBoss from 'pg-boss';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';

const CROWN_PRODUCTION_QUEUE = 'crowns:production';
const CROWN_PRODUCTION_CRON = '*/5 * * * *';

@Injectable()
export class CrownProductionWorker implements OnModuleInit {
  private readonly logger = new Logger(CrownProductionWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly crownsService: CrownsService,
  ) {}

  async onModuleInit() {
    await registerScheduledQueueWorker(
      this.boss,
      this.logger,
      {
        queueName: CROWN_PRODUCTION_QUEUE,
        cron: CROWN_PRODUCTION_CRON,
        tz: 'UTC',
        displayName: 'Crown production',
      },
      () => this.handleCrownProduction(),
    );
  }

  private async handleCrownProduction() {
    const startTime = Date.now();

    try {
      // Get all active players (with at least one world membership, last login within 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

      const memberships = await this.prisma.worldMembership.findMany({
        where: {
          lastLoginAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          userId: true,
          worldId: true,
        },
      });

      if (memberships.length === 0) {
        this.logger.log('No active players to process');
        return;
      }

      this.logger.log(
        `Processing crown production for ${memberships.length} active players`,
      );

      let successCount = 0;
      let errorCount = 0;

      // Update production for each player-world combination
      for (const membership of memberships) {
        try {
          await this.crownsService.updateProduction(
            membership.userId,
            membership.worldId,
            true, // Create WebSocket event
          );
          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to update crown production for user ${membership.userId} in world ${membership.worldId}:`,
            error,
          );
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Crown production tick completed: ${successCount} success, ${errorCount} errors (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error('Failed to process crown production tick:', error);
      throw error;
    }
  }
}
