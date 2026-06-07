import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api';
import { enterErrorMessage, joinErrorMessage } from './useWorldCardModels';

describe('joinErrorMessage', () => {
  it('returns generic fallback for non-ApiError', () => {
    expect(joinErrorMessage(new Error('internal'))).toBe(
      'Inscription au royaume impossible.',
    );
    expect(joinErrorMessage('some string')).toBe(
      'Inscription au royaume impossible.',
    );
    expect(joinErrorMessage(null)).toBe('Inscription au royaume impossible.');
  });

  it('translates "not open for joining" to French', () => {
    const err = new ApiError('World not open for joining', 400);
    expect(joinErrorMessage(err)).toBe(
      'Les inscriptions de ce royaume sont closes.',
    );
  });

  it('translates "already joined" to French', () => {
    const err = new ApiError('User already joined this world', 400);
    expect(joinErrorMessage(err)).toBe(
      "Tu as déjà un village dans ce royaume : utilise « Entrer dans le royaume ».",
    );
  });

  it('returns the raw message for unrecognized ApiErrors', () => {
    const err = new ApiError('World is at capacity', 409);
    expect(joinErrorMessage(err)).toBe('World is at capacity');
  });

  it('returns generic fallback when ApiError message is empty', () => {
    const err = new ApiError('', 500);
    expect(joinErrorMessage(err)).toBe('Inscription au royaume impossible.');
  });
});

describe('enterErrorMessage', () => {
  it('translates missing membership to French', () => {
    const err = new ApiError('World world-1 membership not found', 404);
    expect(enterErrorMessage(err)).toBe(
      "Tu n'es pas encore inscrit à ce royaume.",
    );
  });

  it('returns a generic fallback for non-ApiError inputs', () => {
    expect(enterErrorMessage(new Error('internal'))).toBe(
      "Impossible d'entrer dans le royaume.",
    );
  });

  it('returns the raw message for non-404 ApiErrors', () => {
    const err = new ApiError('World is not open for entry', 400);
    expect(enterErrorMessage(err)).toBe('World is not open for entry');
  });

  it('returns generic fallback when non-404 ApiError message is empty', () => {
    const err = new ApiError('', 500);
    expect(enterErrorMessage(err)).toBe(
      "Impossible d'entrer dans le royaume.",
    );
  });
});
