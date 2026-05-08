import { EventKind, PayloadForKind } from './event-types';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { encodeEventPayload } from './codecs/payload.codec';

/**
 * Type-safe helper to create outbox events.
 * The generic parameter `K` enforces that `payload` matches `kind` at compile time.
 * Runtime payload validation happens in the OutboxWorker on dispatch
 * (via parseEventPayload) — writing remains a thin frontier cast handled by the codec.
 */
export async function createOutboxEvent<K extends EventKind>(
  tx: PrismaClientOrTx,
  kind: K,
  aggregateId: string,
  payload: PayloadForKind<K>,
): Promise<void> {
  await tx.eventOutbox.create({
    data: {
      kind,
      aggregateId,
      payload: encodeEventPayload<K>(payload),
    },
  });
}
