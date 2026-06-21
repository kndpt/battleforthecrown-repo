import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { OyezProducerService } from '../modules/retention/oyez-producer.service';

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
    try {
      await this.boss.createQueue(OYEZ_QUEUE);
      await this.boss.work(OYEZ_QUEUE, async () => {
        await this.handleOyezTick();
      });
      await this.boss.schedule(
        OYEZ_QUEUE,
        OYEZ_CRON,
        {},
        {
          tz: 'Europe/Paris',
        },
      );

      this.logger.log(`Oyez worker initialized (${OYEZ_CRON} Europe/Paris)`);
    } catch (error) {
      this.logger.error('Failed to initialize Oyez worker:', error);
      throw error;
    }
  }

  async handleOyezTick(now = new Date()): Promise<number> {
    return this.producer.produceForOpenWorlds(now);
  }
}
