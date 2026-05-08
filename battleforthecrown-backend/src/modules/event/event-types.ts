export * from '@battleforthecrown/shared/events';

import type {
  EventKind,
  AnyEventPayload,
} from '@battleforthecrown/shared/events';

export interface OutboxEvent {
  id: string;
  kind: EventKind;
  aggregateId: string;
  payload: AnyEventPayload;
  createdAt: Date;
  dispatchedAt: Date | null;
}
