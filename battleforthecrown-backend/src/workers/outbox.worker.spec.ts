import { Test, TestingModule } from '@nestjs/testing';
import { OutboxWorker } from './outbox.worker';
import { EventOutboxService } from '../modules/event/event-outbox.service';
import PgBoss from 'pg-boss';

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/await-thenable */

describe('OutboxWorker', () => {
  let worker: OutboxWorker;
  let mockPgBoss: jest.Mocked<PgBoss>;
  let mockOutboxService: jest.Mocked<EventOutboxService>;
  let mockSetInterval: jest.MockedFunction<typeof setInterval>;
  let mockClearInterval: jest.MockedFunction<typeof clearInterval>;
  let originalSetInterval: typeof setInterval;
  let originalClearInterval: typeof clearInterval;

  beforeEach(() => {
    mockPgBoss = {} as jest.Mocked<PgBoss>;
    mockOutboxService = {
      dispatchPendingEvents: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EventOutboxService>;

    mockSetInterval = jest.fn();
    mockClearInterval = jest.fn();

    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    global.setInterval = mockSetInterval;
    global.clearInterval = mockClearInterval;
  });

  afterEach(() => {
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxWorker,
        { provide: 'PG_BOSS', useValue: mockPgBoss },
        { provide: EventOutboxService, useValue: mockOutboxService },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get<OutboxWorker>(OutboxWorker);
  });

  describe('onModuleInit', () => {
    it('should initialize with default poll interval and run initial dispatch', async () => {
      delete process.env.OUTBOX_POLL_INTERVAL;

      await worker.onModuleInit();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should initialize with custom poll interval from environment', async () => {
      process.env.OUTBOX_POLL_INTERVAL = '5000';

      await worker.onModuleInit();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);

      delete process.env.OUTBOX_POLL_INTERVAL;
    });

    it('should handle errors in dispatch interval gracefully', async () => {
      const mockError = new Error('Dispatch failed');
      mockOutboxService.dispatchPendingEvents
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(mockError);

      await worker.onModuleInit();

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);

      const intervalCallback = mockSetInterval.mock.calls[0][0];
      await intervalCallback();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(2);
    });

    it('should throw error if initial dispatch fails', async () => {
      const mockError = new Error('Initial dispatch failed');
      mockOutboxService.dispatchPendingEvents.mockRejectedValue(mockError);

      await expect(worker.onModuleInit()).rejects.toThrow(
        'Initial dispatch failed',
      );
      expect(mockSetInterval).not.toHaveBeenCalled();
    });

    it('should handle zero poll interval', async () => {
      process.env.OUTBOX_POLL_INTERVAL = '0';

      await worker.onModuleInit();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        1000, // Fallback to default when value is falsy
      );

      delete process.env.OUTBOX_POLL_INTERVAL;
    });

    it('should handle invalid poll interval and fallback to default', async () => {
      process.env.OUTBOX_POLL_INTERVAL = 'invalid';

      await worker.onModuleInit();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);

      delete process.env.OUTBOX_POLL_INTERVAL;
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear interval if exists', async () => {
      const mockTimeoutId = {} as NodeJS.Timeout;
      mockSetInterval.mockReturnValue(mockTimeoutId);

      await worker.onModuleInit();
      await worker.onModuleDestroy();

      expect(mockClearInterval).toHaveBeenCalledWith(mockTimeoutId);
    });

    it('should handle cleanup when no interval exists', async () => {
      await worker.onModuleDestroy();

      expect(mockClearInterval).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls safely', async () => {
      const mockTimeoutId = {} as NodeJS.Timeout;
      mockSetInterval.mockReturnValue(mockTimeoutId);

      await worker.onModuleInit();
      await worker.onModuleDestroy();
      await worker.onModuleDestroy();

      expect(mockClearInterval).toHaveBeenCalledTimes(1); // Improved implementation: only clears when intervalId exists
    });
  });

  describe('handleDispatch', () => {
    it('should call outbox service dispatchPendingEvents', async () => {
      await worker['handleDispatch']();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(1);
    });

    it('should handle dispatch errors and rethrow', async () => {
      const mockError = new Error('Dispatch error');
      mockOutboxService.dispatchPendingEvents.mockRejectedValue(mockError);

      await expect(worker['handleDispatch']()).rejects.toThrow(
        'Dispatch error',
      );
    });

    it('should handle successful dispatch', async () => {
      mockOutboxService.dispatchPendingEvents.mockResolvedValue(undefined);

      await expect(worker['handleDispatch']()).resolves.toBeUndefined();
      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(1);
    });
  });

  describe('interval behavior', () => {
    it('should continuously dispatch events on interval', async () => {
      await worker.onModuleInit();

      const intervalCallback = mockSetInterval.mock.calls[0][0];

      await intervalCallback();
      await intervalCallback();
      await intervalCallback();

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(4); // 1 initial + 3 interval calls
    });

    it('should handle interval errors without stopping', async () => {
      const mockError = new Error('Interval error');
      mockOutboxService.dispatchPendingEvents
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(undefined);

      await worker.onModuleInit();

      const intervalCallback = mockSetInterval.mock.calls[0][0];

      await intervalCallback(); // Should succeed
      await intervalCallback(); // Should fail but not stop interval
      await intervalCallback(); // Should succeed again

      expect(mockOutboxService.dispatchPendingEvents).toHaveBeenCalledTimes(4); // 1 initial + 3 interval calls
    });
  });

  describe('environment variable handling', () => {
    it('should handle string number poll interval', async () => {
      process.env.OUTBOX_POLL_INTERVAL = '2500';

      await worker.onModuleInit();

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 2500);

      delete process.env.OUTBOX_POLL_INTERVAL;
    });

    it('should handle negative poll interval', async () => {
      process.env.OUTBOX_POLL_INTERVAL = '-1000';

      await worker.onModuleInit();

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), -1000);

      delete process.env.OUTBOX_POLL_INTERVAL;
    });

    it('should handle very large poll interval', async () => {
      process.env.OUTBOX_POLL_INTERVAL = '999999999';

      await worker.onModuleInit();

      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        999999999,
      );

      delete process.env.OUTBOX_POLL_INTERVAL;
    });
  });
});
