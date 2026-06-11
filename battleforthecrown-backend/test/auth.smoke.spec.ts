import request from 'supertest';
import { bootSmokeApp, registerUser, type SmokeContext } from './helpers';

describe('auth smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('jwt auth: register → access protected → refresh → access with new token', async () => {
    const {
      email,
      displayName,
      accessToken: t1,
      refreshToken,
    } = await registerUser(ctx.server);
    expect(displayName).toMatch(/^Smoke_/);

    const r1 = await request(ctx.server)
      .get('/world/me/memberships')
      .set('Authorization', `Bearer ${t1}`);
    expect(r1.status).toBe(200);

    const refreshed = await request(ctx.server)
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(refreshed.status).toBeLessThan(300);
    const t2 = (refreshed.body as { accessToken: string }).accessToken;
    expect(t2).toBeTruthy();

    const r2 = await request(ctx.server)
      .get('/world/me/memberships')
      .set('Authorization', `Bearer ${t2}`);
    expect(r2.status).toBe(200);

    const login = await request(ctx.server)
      .post('/auth/login')
      .send({ email, password: 'smoke-password-123' });
    expect(login.status).toBeLessThan(300);
    const loginBody = login.body as {
      accessToken: string;
      displayName: string;
      email: string;
    };
    expect(loginBody.accessToken).toBeTruthy();
    expect(loginBody.displayName).toBe(displayName);
    expect(loginBody.email).toBe(email);
  });

  it('rejects duplicate display names case-insensitively', async () => {
    const first = await registerUser(ctx.server, 'dup-name-a');
    const second = await request(ctx.server).post('/auth/register').send({
      email: 'other-dup@test.local',
      displayName: first.displayName.toLowerCase(),
      password: 'smoke-password-123',
    });
    expect(second.status).toBe(409);
    expect((second.body as { message: string }).message).toBe(
      'Nom de joueur déjà pris',
    );
  });
});
