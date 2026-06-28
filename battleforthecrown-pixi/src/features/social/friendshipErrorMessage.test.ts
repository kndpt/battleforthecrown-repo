import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api';
import { FRIENDSHIP_ERROR_CODES } from '@battleforthecrown/shared/social';
import { friendshipErrorMessage } from './friendshipErrorMessage';

function conflict(code: string) {
  return new ApiError('server message', 409, { message: 'server message', code });
}

describe('friendshipErrorMessage', () => {
  it('maps each known code to a distinct FR message', () => {
    const already = friendshipErrorMessage(
      conflict(FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE),
      'fallback',
    );
    const pending = friendshipErrorMessage(
      conflict(FRIENDSHIP_ERROR_CODES.PENDING_AWAITING_ACCEPT),
      'fallback',
    );
    const cap = friendshipErrorMessage(
      conflict(FRIENDSHIP_ERROR_CODES.CAP_REACHED),
      'fallback',
    );

    expect(already).toMatch(/déjà amis/i);
    expect(pending).toMatch(/acceptez/i);
    expect(cap).toMatch(/5 amis/i);
    // All three must be distinct so the UX guides correctly.
    expect(new Set([already, pending, cap]).size).toBe(3);
  });

  it('steers PENDING_AWAITING_ACCEPT toward accepting', () => {
    expect(
      friendshipErrorMessage(
        conflict(FRIENDSHIP_ERROR_CODES.PENDING_AWAITING_ACCEPT),
        'fallback',
      ),
    ).toMatch(/Reçues/);
  });

  it('falls back to the server message for an unmapped ApiError', () => {
    const err = new ApiError('You cannot befriend yourself', 400, {
      message: 'You cannot befriend yourself',
    });
    expect(friendshipErrorMessage(err, 'fallback')).toBe(
      'You cannot befriend yourself',
    );
  });

  it('ignores an unknown code and uses the server message', () => {
    expect(friendshipErrorMessage(conflict('SOME_OTHER_CODE'), 'fallback')).toBe(
      'server message',
    );
  });

  it('uses the provided fallback for a non-ApiError', () => {
    expect(friendshipErrorMessage(new Error('boom'), 'fallback')).toBe(
      'fallback',
    );
  });
});
