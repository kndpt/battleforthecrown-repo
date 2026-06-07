import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { CONQUEST_FINALIZE_QUEUE, ConquestService } from './conquest.service';

interface ConquestFinalizeJob {
  pendingConquestId: string;
}

@Injectable()
export class ConquestFinalizeWorker implements OnModuleInit {
  private readonly logger = new Logger(ConquestFinalizeWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly conquest: ConquestService,
  ) {}

  async onModuleInit() {
    try {
      await this.boss.createQueue(CONQUEST_FINALIZE_QUEUE);
      await this.boss.work(CONQUEST_FINALIZE_QUEUE, async (jobs) => {
        const job = Array.isArray(jobs) ? jobs[0] : jobs;
        return this.handleFinalize(job.data as ConquestFinalizeJob);
      });

      this.logger.log('Conquest finalize worker initialized');
    } catch (error) {
      this.logger.error(
        'Failed to initialize conquest finalize worker:',
        error,
      );
      throw error;
    }
  }

  private async handleFinalize(data: ConquestFinalizeJob) {
    try {
      const result = await this.conquest.finalizeCaptureWindow(
        data.pendingConquestId,
      );
      if (!result.completed) {
        this.logger.debug(
          `Pending conquest ${data.pendingConquestId} is no longer open, skipping`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to finalize conquest ${data.pendingConquestId}:`,
        error,
      );
      throw error;
    }
  }
}
