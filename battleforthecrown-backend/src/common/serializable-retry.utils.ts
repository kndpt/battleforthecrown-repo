import { Logger } from '@nestjs/common';

export async function withSerializableRetry<T>(
  operation: () => Promise<T>,
  logger: Logger,
  context = 'transaction',
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSerializationFailure(error) || attempt === maxAttempts) {
        throw error;
      }
      logger.warn(
        `Retrying serializable ${context} after conflict (${attempt}/${maxAttempts})`,
      );
    }
  }
  throw new Error('Unreachable serializable retry state');
}

// Postgres SQLSTATEs that mean "transaction aborted, safe to retry":
// 40001 serialization_failure, 40P01 deadlock_detected.
const RETRYABLE_PG_CODES = new Set(['40001', '40P01']);

export function isSerializationFailure(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  if (code === 'P2034') {
    return true;
  }

  if (code === 'P2010') {
    const meta =
      'meta' in error && typeof error.meta === 'object' && error.meta !== null
        ? error.meta
        : undefined;
    if (
      meta &&
      'code' in meta &&
      typeof meta.code === 'string' &&
      RETRYABLE_PG_CODES.has(meta.code)
    ) {
      return true;
    }
    if (
      meta &&
      'message' in meta &&
      typeof meta.message === 'string' &&
      (meta.message.includes('could not serialize') ||
        meta.message.includes('deadlock detected'))
    ) {
      return true;
    }
  }

  return false;
}
