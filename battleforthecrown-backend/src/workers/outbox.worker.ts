import {
  Injectable,
  Logger,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import { EventOutboxService } from '../modules/event/event-outbox.service';

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorker.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly outboxService: EventOutboxService,
  ) {}

  async onModuleInit() {
    try {
      const pollInterval = Number(process.env.OUTBOX_POLL_INTERVAL) || 1000;
      this.logger.log(
        `🚀 Outbox worker initialized (dispatching every ${pollInterval}ms via setInterval)`,
      );

      // Immediate first dispatch
      this.logger.log('🔄 [Outbox] Running initial dispatch...');
      await this.handleDispatch();

      this.intervalId = setInterval(() => {
        this.handleDispatch().catch((error) => {
          this.logger.error('❌ [Outbox] Error in dispatch interval:', error);
        });
      }, pollInterval);

      this.logger.log('✅ [Outbox] Worker fully initialized with interval');
    } catch (error) {
      this.logger.error('❌ [Outbox] Failed to initialize:', error);
      throw error;
    }
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Outbox worker stopped');
    }
  }

  private async handleDispatch() {
    try {
      await this.outboxService.dispatchPendingEvents();
    } catch (error) {
      this.logger.error('Failed to dispatch outbox events:', error);
      throw error;
    }
  }
}
