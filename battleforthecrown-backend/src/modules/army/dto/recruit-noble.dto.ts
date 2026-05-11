import { z } from 'zod';

export const recruitNobleSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).strict(),
);

export type RecruitNobleDto = z.infer<typeof recruitNobleSchema>;
