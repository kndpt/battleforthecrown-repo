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

// Smokes/tests spend most of their wall-clock waiting for job workers to pick
// up chained jobs (training → next unit, combat → return, …). Each pickup costs
// one poll cycle (pg-boss default 2s). `PGBOSS_WORKER_POLL_MS` lets the test env
// tighten this to pg-boss's 500ms floor without touching prod cadence (unset in
// prod/dev → workOptions used verbatim, keeping the 2s default / explicit 1s).
function withPollOverride(
  workOptions?: PgBoss.WorkOptions,
): PgBoss.WorkOptions | undefined {
  const overrideMs = Number(process.env.PGBOSS_WORKER_POLL_MS);
  if (!Number.isFinite(overrideMs) || overrideMs <= 0) return workOptions;
  return { ...workOptions, pollingIntervalSeconds: overrideMs / 1000 };
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
      // pg-boss delivers a job batch — iterate to honor batchSize > 1 callers.
      const normalizedJobs = Array.isArray(jobs) ? jobs : [jobs];
      for (const job of normalizedJobs) {
        await handler(job.data);
      }
    };
    const workOptions = withPollOverride(opts.workOptions);
    if (workOptions) {
      await boss.work(opts.queueName, workOptions, workHandler);
    } else {
      await boss.work(opts.queueName, workHandler);
    }
    logger.log(`${label} worker initialized`);
  } catch (error) {
    logger.error(`Failed to initialize ${label} worker:`, error);
    throw error;
  }
}
