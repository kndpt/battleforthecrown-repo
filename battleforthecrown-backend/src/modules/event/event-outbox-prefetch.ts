import type { Prisma } from '@prisma/client';
import { parseEventPayload } from './codecs';
import { collectVillageIdsFromPayload } from './event-outbox-village-ids';
import { EVENT_PAYLOAD_SCHEMAS, type EventKind } from './event-types';

export type VillageUserIdCache = Map<string, string | null>;

export function isInvalidEventPayloadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith('Invalid EventOutbox payload for kind')
  );
}

function isEventKind(kind: string): kind is EventKind {
  return kind in EVENT_PAYLOAD_SCHEMAS;
}

export type OutboxEventForPrefetch = {
  kind: string;
  payload: Prisma.JsonValue;
};

export function collectVillageIdsFromOutboxEvents(
  events: readonly OutboxEventForPrefetch[],
  parsePayload: typeof parseEventPayload = parseEventPayload,
): string[] {
  const villageIds = new Set<string>();

  for (const event of events) {
    if (!isEventKind(event.kind)) continue;

    try {
      const payload = parsePayload(event.kind, event.payload);
      for (const villageId of collectVillageIdsFromPayload(
        payload as unknown as Record<string, unknown>,
      )) {
        villageIds.add(villageId);
      }
    } catch (error) {
      if (isInvalidEventPayloadError(error)) {
        continue;
      }
      throw error;
    }
  }

  return [...villageIds];
}

export async function resolveVillageUserIdCache(
  prefetch: () => Promise<VillageUserIdCache>,
  onError?: (error: unknown) => void,
): Promise<VillageUserIdCache> {
  try {
    return await prefetch();
  } catch (error) {
    onError?.(error);
    return new Map();
  }
}
