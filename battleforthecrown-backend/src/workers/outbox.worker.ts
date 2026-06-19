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
  private stopped = false;
  // Promise of the dispatch currently hitting Prisma, if any. Tracked so that
  // onModuleDestroy can await it before Prisma disconnects — otherwise a poll
  // tick mid-query races the engine shutdown and segfaults the worker process.
  private inFlight: Promise<void> | null = null;

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

      // Immediate first dispatch (a failure here still fails boot).
      this.logger.log('🔄 [Outbox] Running initial dispatch...');
      this.inFlight = this.handleDispatch();
      try {
        await this.inFlight;
      } finally {
        this.inFlight = null;
      }

      this.intervalId = setInterval(() => {
        void this.runDispatch();
      }, pollInterval);

      this.logger.log('✅ [Outbox] Worker fully initialized with interval');
    } catch (error) {
      this.logger.error('❌ [Outbox] Failed to initialize:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.stopped = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Let an in-flight dispatch finish before Nest tears Prisma down, so the
    // native engine is never disconnected from under a running query.
    if (this.inFlight) {
      await this.inFlight.catch(() => undefined);
    }
    this.logger.log('Outbox worker stopped');
  }

  // Serialized poll-tick dispatch: never overlaps a previous run and never
  // starts once shutdown began. Tracks inFlight so onModuleDestroy can await it.
  private async runDispatch(): Promise<void> {
    if (this.stopped || this.inFlight) return;
    this.inFlight = this.handleDispatch().finally(() => {
      this.inFlight = null;
    });
    try {
      await this.inFlight;
    } catch (error) {
      this.logger.error('❌ [Outbox] Error in dispatch interval:', error);
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
