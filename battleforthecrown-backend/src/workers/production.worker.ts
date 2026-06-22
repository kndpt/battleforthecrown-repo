import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ResourcesService } from '../modules/resources/resources.service';
import { registerScheduledQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import PgBoss from 'pg-boss';

const PRODUCTION_QUEUE = 'production:tick';

@Injectable()
export class ProductionWorker implements OnModuleInit {
  private readonly logger = new Logger(ProductionWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const intervalMinutes = this.config.get<number>(
      'PRODUCTION_TICK_INTERVAL_MINUTES',
      60,
    );
    await registerScheduledQueueWorker(
      this.boss,
      this.logger,
      {
        queueName: PRODUCTION_QUEUE,
        cron: `*/${intervalMinutes} * * * *`,
        tz: 'UTC',
        displayName: 'Production',
      },
      () => this.handleProductionTick(),
    );
  }

  private async handleProductionTick() {
    const startTime = Date.now();

    try {
      // Get all villages
      const villages = await this.prisma.village.findMany({
        where: { isBarbarian: false },
        select: { id: true, name: true },
      });

      if (villages.length === 0) {
        this.logger.log('No villages to process');
        return;
      }

      this.logger.log(`Processing production for ${villages.length} villages`);

      let successCount = 0;
      let errorCount = 0;

      // Update production for each village.
      // No WebSocket broadcast on tick — the frontend interpolates locally
      // between mutation-driven `resources.changed` events. Documented under
      // "Exceptions au pattern Outbox" in `docs/architecture/realtime.md`.
      for (const village of villages) {
        try {
          await this.resourcesService.updateProduction(village.id);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to update production for village ${village.id}:`,
            error,
          );
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Production tick completed: ${successCount} success, ${errorCount} errors (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error('Failed to process production tick:', error);
      throw error;
    }
  }
}
