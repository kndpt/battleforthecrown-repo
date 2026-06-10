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

export function isSerializationFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2034'
  );
}
