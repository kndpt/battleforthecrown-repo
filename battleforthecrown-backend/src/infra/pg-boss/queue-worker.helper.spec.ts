import { Logger } from '@nestjs/common';
import type PgBoss from 'pg-boss';
import {
  registerJobQueueWorker,
  registerScheduledQueueWorker,
} from './queue-worker.helper';

type FakeBoss = {
  createQueue: jest.Mock;
  work: jest.Mock;
  schedule: jest.Mock;
};

function makeFakeBoss(): FakeBoss {
  return {
    createQueue: jest.fn().mockResolvedValue(undefined),
    work: jest.fn().mockResolvedValue('worker-id'),
    schedule: jest.fn().mockResolvedValue(undefined),
  };
}

function silentLogger(): Logger {
  const logger = new Logger('test');
  jest.spyOn(logger, 'log').mockImplementation(() => undefined);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  return logger;
}

describe('registerScheduledQueueWorker', () => {
  it('creates queue, registers worker, and schedules cron in that order', async () => {
    const boss = makeFakeBoss();
    const calls: string[] = [];
    boss.createQueue.mockImplementation(() => {
      calls.push('createQueue');
      return Promise.resolve();
    });
    boss.work.mockImplementation(() => {
      calls.push('work');
      return Promise.resolve('id');
    });
    boss.schedule.mockImplementation(() => {
      calls.push('schedule');
      return Promise.resolve();
    });

    const handler = jest.fn().mockResolvedValue(undefined);
    await registerScheduledQueueWorker(
      boss as unknown as PgBoss,
      silentLogger(),
      { queueName: 'q', cron: '*/5 * * * *', tz: 'UTC' },
      handler,
    );

    expect(calls).toEqual(['createQueue', 'work', 'schedule']);
    expect(boss.createQueue).toHaveBeenCalledWith('q');
    expect(boss.schedule).toHaveBeenCalledWith(
      'q',
      '*/5 * * * *',
      {},
      { tz: 'UTC' },
    );
  });

  it('invokes the supplied handler when pg-boss runs the work callback', async () => {
    const boss = makeFakeBoss();
    let bossWorkCallback: (() => Promise<unknown>) | undefined;
    boss.work.mockImplementation(
      (_name: string, cb: () => Promise<unknown>) => {
        bossWorkCallback = cb;
        return Promise.resolve('id');
      },
    );

    const handler = jest.fn().mockResolvedValue(undefined);
    await registerScheduledQueueWorker(
      boss as unknown as PgBoss,
      silentLogger(),
      { queueName: 'q', cron: '* * * * *', tz: 'UTC' },
      handler,
    );

    await bossWorkCallback?.();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('rethrows when createQueue fails and logs the failure', async () => {
    const boss = makeFakeBoss();
    boss.createQueue.mockRejectedValue(new Error('boom'));
    const logger = silentLogger();
    const errorSpy = jest.spyOn(logger, 'error');

    await expect(
      registerScheduledQueueWorker(
        boss as unknown as PgBoss,
        logger,
        { queueName: 'q', cron: '* * * * *', tz: 'UTC', displayName: 'Q' },
        jest.fn(),
      ),
    ).rejects.toThrow('boom');
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to initialize Q worker:',
      expect.any(Error),
    );
  });
});

describe('registerJobQueueWorker', () => {
  it('unwraps job arrays and forwards data to the handler', async () => {
    const boss = makeFakeBoss();
    let workHandler: PgBoss.WorkHandler<{ id: string }> | undefined;
    boss.work.mockImplementation(
      (_name: string, cb: PgBoss.WorkHandler<{ id: string }>) => {
        workHandler = cb;
        return Promise.resolve('id');
      },
    );

    const handler = jest.fn().mockResolvedValue(undefined);
    await registerJobQueueWorker<{ id: string }>(
      boss as unknown as PgBoss,
      silentLogger(),
      { queueName: 'q' },
      handler,
    );

    await workHandler?.([
      {
        id: 'job-1',
        name: 'q',
        data: { id: 'a' },
      } as PgBoss.Job<{ id: string }>,
    ]);
    expect(handler).toHaveBeenCalledWith({ id: 'a' });
  });

  it('passes workOptions through to pg-boss when provided', async () => {
    const boss = makeFakeBoss();
    await registerJobQueueWorker<{ id: string }>(
      boss as unknown as PgBoss,
      silentLogger(),
      {
        queueName: 'q',
        workOptions: { pollingIntervalSeconds: 1, batchSize: 1 },
      },
      jest.fn(),
    );

    expect(boss.work).toHaveBeenCalledWith(
      'q',
      { pollingIntervalSeconds: 1, batchSize: 1 },
      expect.any(Function) as unknown,
    );
  });

  it('uses the 2-arg work overload when no workOptions are supplied', async () => {
    const boss = makeFakeBoss();
    await registerJobQueueWorker<{ id: string }>(
      boss as unknown as PgBoss,
      silentLogger(),
      { queueName: 'q' },
      jest.fn(),
    );

    expect(boss.work).toHaveBeenCalledWith(
      'q',
      expect.any(Function) as unknown,
    );
  });

  it('rethrows when worker registration fails', async () => {
    const boss = makeFakeBoss();
    boss.work.mockRejectedValue(new Error('register failed'));
    const logger = silentLogger();
    const errorSpy = jest.spyOn(logger, 'error');

    await expect(
      registerJobQueueWorker<{ id: string }>(
        boss as unknown as PgBoss,
        logger,
        { queueName: 'q', displayName: 'My queue' },
        jest.fn(),
      ),
    ).rejects.toThrow('register failed');
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to initialize My queue worker:',
      expect.any(Error),
    );
  });
});
