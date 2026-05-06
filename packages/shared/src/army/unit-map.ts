import { z } from 'zod';
import { UNIT_TYPES, type UnitType } from './types';

export const UnitTypeSchema = z.enum(UNIT_TYPES);

export const UnitMapSchema = z.partialRecord(
  UnitTypeSchema,
  z.number().int().nonnegative(),
);

export type UnitMap = Partial<Record<UnitType, number>>;
