import type { Logger } from '@nestjs/common';
import type PgBoss from 'pg-boss';

export interface ScheduledQueueWorkerOptions {
  queueName: string;
  cron: string;
  tz: string;
  displayName?: string;
}

export async function registerScheduledQueueWorker(
  boss: PgBoss,
  logger: Logger,
  opts: ScheduledQueueWorkerOptions,
  handler: () => Promise<unknown>,
): Promise<void> {
  const label = opts.displayName ?? opts.queueName;
  try {
    await boss.createQueue(opts.queueName);
    await boss.work(opts.queueName, async () => {
      await handler();
    });
    await boss.schedule(opts.queueName, opts.cron, {}, { tz: opts.tz });
    logger.log(`${label} worker initialized (${opts.cron} ${opts.tz})`);
  } catch (error) {
    logger.error(`Failed to initialize ${label} worker:`, error);
    throw error;
  }
}

export interface JobQueueWorkerOptions {
  queueName: string;
  workOptions?: PgBoss.WorkOptions;
  displayName?: string;
}

export async function registerJobQueueWorker<TData extends object>(
  boss: PgBoss,
  logger: Logger,
  opts: JobQueueWorkerOptions,
  handler: (data: TData) => Promise<unknown>,
): Promise<void> {
  const label = opts.displayName ?? opts.queueName;
  try {
    await boss.createQueue(opts.queueName);
    const workHandler: PgBoss.WorkHandler<TData> = async (jobs) => {
      const job = Array.isArray(jobs) ? jobs[0] : jobs;
      return handler(job.data);
    };
    if (opts.workOptions) {
      await boss.work(opts.queueName, opts.workOptions, workHandler);
    } else {
      await boss.work(opts.queueName, workHandler);
    }
    logger.log(`${label} worker initialized`);
  } catch (error) {
    logger.error(`Failed to initialize ${label} worker:`, error);
    throw error;
  }
}
