import { describe, expect, it } from 'vitest';
import {
  CancelConstructionResponseSchema,
  CancelTrainingResponseSchema,
} from './cancelResponses';

describe('cancel response schemas', () => {
  it('accepts a construction refund response with required resource fields', () => {
    expect(
      CancelConstructionResponseSchema.parse({
        success: true,
        refunded: {
          wood: 120,
          stone: 80,
          iron: 40,
          population: 3,
        },
      }),
    ).toEqual({
      success: true,
      refunded: {
        wood: 120,
        stone: 80,
        iron: 40,
        population: 3,
      },
    });
  });

  it('requires crowns on training refund responses', () => {
    expect(() =>
      CancelTrainingResponseSchema.parse({
        success: true,
        refunded: {
          wood: 120,
          stone: 80,
          iron: 40,
          population: 3,
        },
      }),
    ).toThrow();
  });
});
