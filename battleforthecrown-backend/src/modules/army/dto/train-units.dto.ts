import { z } from 'zod';
import {
  BARRACKS_UNIT_TYPES,
  type TrainUnitsRequest,
} from '@battleforthecrown/shared/army';

export const trainUnitsSchema = z.object({
  // NOBLE volontairement absent : recrutement à la Salle du Trône, pas à la Caserne
  // (spec docs/gameplay/10-conquest.md § Bâtiment requis). Endpoint dédié — voir Ticket #40.
  unitType: z.enum(BARRACKS_UNIT_TYPES),
  quantity: z.number().int().min(1).max(1000),
}) satisfies z.ZodType<TrainUnitsRequest>;

export type TrainUnitsDto = TrainUnitsRequest;
