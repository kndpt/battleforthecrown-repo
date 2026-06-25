import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { registerScheduledQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import { RankingsCycleService } from '../modules/rankings/rankings-cycle.service';

const RANKINGS_CYCLE_QUEUE = 'rankings:cycle';
// Hourly tick. The boundary is wall-clock Monday 00:00 UTC; an hourly cadence
// closes a cycle within the hour of its end and trivially catches up any missed
// cycle after downtime (the service loops over all due indexes per tick).
const RANKINGS_CYCLE_CRON = '0 * * * *';

@Injectable()
export class RankingsCycleWorker implements OnModuleInit {
  private readonly logger = new Logger(RankingsCycleWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly rankingsCycle: RankingsCycleService,
  ) {}

  async onModuleInit() {
    await registerScheduledQueueWorker(
      this.boss,
      this.logger,
      {
        queueName: RANKINGS_CYCLE_QUEUE,
        cron: RANKINGS_CYCLE_CRON,
        tz: 'UTC',
        displayName: 'Rankings cycle close',
      },
      () => this.rankingsCycle.closeDueCycles(),
    );
  }
}
