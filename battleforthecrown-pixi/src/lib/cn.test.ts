import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges class names and dedupes tailwind utilities', () => {
    const isHidden: boolean = false;
    expect(cn('p-2', 'p-4', isHidden && 'hidden', 'text-white')).toBe('p-4 text-white');
  });

  it('handles falsy values', () => {
    expect(cn(undefined, null, false, '', 'rounded')).toBe('rounded');
  });
});
