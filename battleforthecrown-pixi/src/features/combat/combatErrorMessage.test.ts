import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api';
import { combatErrorMessage } from './combatErrorMessage';

describe('combatErrorMessage', () => {
  it('translates POWER_RATIO_FORBIDDEN to the power-guard message', () => {
    const err = new ApiError('POWER_RATIO_FORBIDDEN', 403);
    expect(combatErrorMessage(err, 'fallback')).toBe(
      'Puissance trop faible',
    );
  });

  it('translates NEWBIE_SHIELD_ACTIVE to the shield message', () => {
    const err = new ApiError('NEWBIE_SHIELD_ACTIVE', 403);
    expect(combatErrorMessage(err, 'fallback')).toBe(
      'Joueur protégé par le bouclier débutant',
    );
  });

  it('passes through an unknown ApiError message', () => {
    const err = new ApiError('Some other server error', 400);
    expect(combatErrorMessage(err, 'fallback')).toBe('Some other server error');
  });

  it('uses the fallback for non-ApiError values', () => {
    expect(combatErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(combatErrorMessage('weird', 'fallback')).toBe('fallback');
  });
});
