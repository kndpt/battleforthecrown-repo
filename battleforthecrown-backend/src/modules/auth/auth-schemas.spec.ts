import { authSessionResponseSchema } from '@battleforthecrown/shared/auth';

describe('authSessionResponseSchema', () => {
  it('strips email from wire payloads before mapping to client session', () => {
    const parsed = authSessionResponseSchema.parse({
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user-1',
      email: 'player@example.test',
      displayName: 'Sire Test',
    });

    expect(parsed).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user-1',
      displayName: 'Sire Test',
    });
    expect('email' in parsed).toBe(false);
  });

  it('defaults displayName when absent on wire', () => {
    expect(
      authSessionResponseSchema.parse({
        accessToken: 'access',
        refreshToken: 'refresh',
        userId: 'user-1',
        email: 'player@example.test',
      }),
    ).toMatchObject({ displayName: 'Joueur' });
  });
});
