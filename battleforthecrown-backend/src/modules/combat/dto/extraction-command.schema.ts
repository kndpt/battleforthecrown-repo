import { z } from 'zod';
import {
  ExtractionCommandSchema,
  type ExtractionCommand,
} from '@battleforthecrown/shared/extraction';

export const extractionCommandSchema =
  ExtractionCommandSchema satisfies z.ZodType<ExtractionCommand>;

export type ExtractionCommandDto = z.infer<typeof extractionCommandSchema>;
