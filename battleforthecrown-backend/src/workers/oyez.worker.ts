import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { OyezProducerService } from '../modules/retention/oyez-producer.service';
import { registerScheduledQueueWorker } from '../infra/pg-boss/queue-worker.helper';

const OYEZ_QUEUE = 'retention:oyez';
// 04:00 Europe/Paris matches the daily card reset (DST handled by pg-boss tz).
const OYEZ_CRON = '0 4 * * *';

@Injectable()
export class OyezWorker implements OnModuleInit {
  private readonly logger = new Logger(OyezWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly producer: OyezProducerService,
  ) {}

  async onModuleInit() {
    await registerScheduledQueueWorker(
      this.boss,
      this.logger,
      {
        queueName: OYEZ_QUEUE,
        cron: OYEZ_CRON,
        tz: 'Europe/Paris',
        displayName: 'Oyez',
      },
      () => this.handleOyezTick(),
    );
  }

  async handleOyezTick(now = new Date()): Promise<number> {
    return this.producer.produceForOpenWorlds(now);
  }
}
