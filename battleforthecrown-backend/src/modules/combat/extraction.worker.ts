import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { registerJobQueueWorker } from '../../infra/pg-boss/queue-worker.helper';
import {
  ExtractionLifecycleService,
  EXTRACTION_COMPLETE_QUEUE,
} from '../gameplay/extraction-lifecycle.service';

interface ExtractionCompleteJob {
  expeditionId: string;
}

@Injectable()
export class ExtractionWorker implements OnModuleInit {
  private readonly logger = new Logger(ExtractionWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly extractionLifecycle: ExtractionLifecycleService,
  ) {}

  async onModuleInit() {
    await registerJobQueueWorker<ExtractionCompleteJob>(
      this.boss,
      this.logger,
      {
        queueName: EXTRACTION_COMPLETE_QUEUE,
        displayName: 'Extraction complete',
      },
      (data) => this.handleCompletion(data),
    );
  }

  private async handleCompletion(data: ExtractionCompleteJob) {
    try {
      await this.extractionLifecycle.handleCompletion(data.expeditionId);
    } catch (error) {
      this.logger.error(
        `Failed to process extraction completion for ${data.expeditionId}:`,
        error,
      );
      throw error;
    }
  }
}
