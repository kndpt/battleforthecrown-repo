import { describe, expect, it } from 'vitest';
import { clamp, clamp01 } from './math';

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the lower bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to the upper bound', () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('returns the bound when value equals it', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('clamp01', () => {
  it('passes through values within [0, 1]', () => {
    expect(clamp01(0.42)).toBeCloseTo(0.42);
  });

  it('clamps negatives to 0 and overflows to 1', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });
});
