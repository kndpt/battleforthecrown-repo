import { z } from 'zod';
import {
  VILLAGE_LABELS,
  type UpdateVillageLabelRequest,
} from '@battleforthecrown/shared/village';

export const updateVillageLabelSchema = z.object({
  label: z.enum(VILLAGE_LABELS).nullable(),
}) satisfies z.ZodType<UpdateVillageLabelRequest>;

export type UpdateVillageLabelDto = UpdateVillageLabelRequest;
