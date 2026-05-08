import { Prisma } from '@prisma/client';
import {
  EVENT_PAYLOAD_SCHEMAS,
  type EventKind,
  type PayloadForKind,
} from '@battleforthecrown/shared/events';

/**
 * Decode an EventOutbox.payload JSON column for a given event kind.
 * Returns the typed payload or throws if the JSON shape doesn't match.
 */
export function parseEventPayload<K extends EventKind>(
  kind: K,
  raw: Prisma.JsonValue,
): PayloadForKind<K> {
  const schema = EVENT_PAYLOAD_SCHEMAS[kind];
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid EventOutbox payload for kind "${kind}": ${result.error.message}`,
    );
  }
  return result.data as PayloadForKind<K>;
}

/**
 * Encode an event payload for writing into the EventOutbox.payload JSON column.
 * Centralises the Prisma JSON frontier cast so individual call sites stay clean.
 */
export function encodeEventPayload<K extends EventKind>(
  payload: PayloadForKind<K>,
): Prisma.InputJsonValue {
  return payload as unknown as Prisma.InputJsonValue;
}
