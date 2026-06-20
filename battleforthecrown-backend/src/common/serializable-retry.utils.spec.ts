import { Logger } from '@nestjs/common';
import {
  isSerializationFailure,
  withSerializableRetry,
} from './serializable-retry.utils';

const silentLogger = { warn: jest.fn() } as unknown as Logger;

describe('serializable-retry.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSerializationFailure', () => {
    it('returns true for an object with code P2034', () => {
      expect(isSerializationFailure({ code: 'P2034' })).toBe(true);
    });

    it('returns false for a different Prisma error code', () => {
      expect(isSerializationFailure({ code: 'P2002' })).toBe(false);
    });

    it('returns true for a P2010 raw-query error with SQLSTATE 40001 in meta.code', () => {
      expect(
        isSerializationFailure({ code: 'P2010', meta: { code: '40001' } }),
      ).toBe(true);
    });

    it('returns true for a P2010 raw-query error with deadlock 40P01 in meta.code', () => {
      expect(
        isSerializationFailure({ code: 'P2010', meta: { code: '40P01' } }),
      ).toBe(true);
    });

    it('returns true for a P2010 error whose meta.message reports a serialization conflict', () => {
      expect(
        isSerializationFailure({
          code: 'P2010',
          meta: {
            message: 'could not serialize access due to concurrent update',
          },
        }),
      ).toBe(true);
    });

    it('returns false for a P2010 error with an unrelated SQLSTATE', () => {
      expect(
        isSerializationFailure({ code: 'P2010', meta: { code: '23505' } }),
      ).toBe(false);
    });

    it('returns false for a plain Error object (no code)', () => {
      expect(isSerializationFailure(new Error('oops'))).toBe(false);
    });

    it('returns false for null', () => {
      expect(isSerializationFailure(null)).toBe(false);
    });

    it('returns false for a string', () => {
      expect(isSerializationFailure('P2034')).toBe(false);
    });

    it('returns false for a number', () => {
      expect(isSerializationFailure(2034)).toBe(false);
    });
  });

  describe('withSerializableRetry', () => {
    it('returns the value immediately on success', async () => {
      const operation = jest.fn().mockResolvedValue('ok');
      const result = await withSerializableRetry(
        operation,
        silentLogger,
        'test',
      );
      expect(result).toBe('ok');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on serialization failure and returns value when it eventually succeeds', async () => {
      const serializationError = { code: 'P2034' };
      const operation = jest
        .fn()
        .mockRejectedValueOnce(serializationError)
        .mockResolvedValue('ok');

      const result = await withSerializableRetry(
        operation,
        silentLogger,
        'test',
        3,
      );
      expect(result).toBe('ok');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('rethrows a non-serialization error immediately without retrying', async () => {
      const otherError = new Error('unique constraint');
      const operation = jest.fn().mockRejectedValue(otherError);

      await expect(
        withSerializableRetry(operation, silentLogger, 'test', 3),
      ).rejects.toBe(otherError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('exhausts all attempts and rethrows the serialization error', async () => {
      const serializationError = { code: 'P2034' };
      const operation = jest.fn().mockRejectedValue(serializationError);

      await expect(
        withSerializableRetry(operation, silentLogger, 'test', 3),
      ).rejects.toBe(serializationError);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('logs a warning on each retried attempt', async () => {
      const warnMock = jest.fn();
      const logger = { warn: warnMock } as unknown as Logger;
      const serializationError = { code: 'P2034' };
      const operation = jest
        .fn()
        .mockRejectedValueOnce(serializationError)
        .mockRejectedValueOnce(serializationError)
        .mockResolvedValue('done');

      await withSerializableRetry(operation, logger, 'ctx', 3);
      expect(warnMock).toHaveBeenCalledTimes(2);
    });

    it('uses maxAttempts = 3 by default', async () => {
      const serializationError = { code: 'P2034' };
      const operation = jest.fn().mockRejectedValue(serializationError);

      await expect(withSerializableRetry(operation, silentLogger)).rejects.toBe(
        serializationError,
      );
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });
});
