import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { registerJobQueueWorker } from '../../infra/pg-boss/queue-worker.helper';
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
    await registerJobQueueWorker<ConquestFinalizeJob>(
      this.boss,
      this.logger,
      { queueName: CONQUEST_FINALIZE_QUEUE, displayName: 'Conquest finalize' },
      (data) => this.handleFinalize(data),
    );
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
