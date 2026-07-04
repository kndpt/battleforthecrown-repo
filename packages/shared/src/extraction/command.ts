import { z } from 'zod';
import type { UnitMap } from '../army/unit-map';
import { UnitMapSchema } from '../army/unit-map';
import {
  EXTRACTION_DURATIONS_HOURS,
  EXTRACTION_MIN_VILLAGERS,
  EXTRACTION_MAX_VILLAGERS,
  type ExtractionDurationHours,
} from './constants';

export interface ExtractionCommand {
  villageId: string;
  siteId: string;
  durationHours: ExtractionDurationHours;
  villagers: number;
  escortUnits?: UnitMap;
}

export const ExtractionCommandSchema = z.object({
  villageId: z.string().min(1),
  siteId: z.string().min(1),
  durationHours: z.union(
    EXTRACTION_DURATIONS_HOURS.map((hours) => z.literal(hours)) as [
      z.ZodLiteral<ExtractionDurationHours>,
      z.ZodLiteral<ExtractionDurationHours>,
      z.ZodLiteral<ExtractionDurationHours>,
    ],
  ),
  villagers: z
    .number()
    .int()
    .min(EXTRACTION_MIN_VILLAGERS)
    .max(EXTRACTION_MAX_VILLAGERS),
  escortUnits: UnitMapSchema.optional(),
}) satisfies z.ZodType<ExtractionCommand>;

export type ExtractionCommandDto = z.infer<typeof ExtractionCommandSchema>;
