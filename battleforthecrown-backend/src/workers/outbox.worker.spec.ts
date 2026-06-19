import { Logger } from '@nestjs/common';
import { OutboxWorker } from './outbox.worker';
import type { EventOutboxService } from '../modules/event/event-outbox.service';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((r) => setImmediate(r));

type Privates = { runDispatch(): Promise<void> };

function makeWorker(dispatch: () => Promise<void>) {
  const dispatchPendingEvents = jest.fn(dispatch);
  const outboxService = {
    dispatchPendingEvents,
  } as unknown as EventOutboxService;
  const worker = new OutboxWorker({} as never, outboxService);
  return { worker, dispatchPendingEvents };
}

describe('OutboxWorker teardown', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('onModuleDestroy awaits an in-flight dispatch before resolving', async () => {
    // The poll tick runs against Prisma; if onModuleDestroy returned while a
    // dispatch was mid-query, Nest would disconnect the engine underneath it
    // and segfault the worker process. This guards that invariant.
    const gate = deferred();
    let calls = 0;
    const { worker } = makeWorker(() => {
      calls += 1;
      return calls === 1 ? Promise.resolve() : gate.promise;
    });

    await worker.onModuleInit(); // initial dispatch completes, interval armed

    // Simulate a poll tick landing right as shutdown begins.
    void (worker as unknown as Privates).runDispatch();
    await flush();
    expect(calls).toBe(2);

    let destroyed = false;
    const destroyP = worker.onModuleDestroy().then(() => {
      destroyed = true;
    });
    await flush();
    expect(destroyed).toBe(false); // blocked on the in-flight dispatch

    gate.resolve();
    await destroyP;
    expect(destroyed).toBe(true);
  });

  it('does not start a new dispatch once shutdown has begun', async () => {
    const { worker, dispatchPendingEvents } = makeWorker(() =>
      Promise.resolve(),
    );
    await worker.onModuleInit();
    await worker.onModuleDestroy();

    dispatchPendingEvents.mockClear();
    await (worker as unknown as Privates).runDispatch();
    expect(dispatchPendingEvents).not.toHaveBeenCalled();
  });
});
