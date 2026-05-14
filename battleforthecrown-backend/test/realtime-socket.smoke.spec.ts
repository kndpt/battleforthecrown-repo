import request from 'supertest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('realtime socket smoke', () => {
  let ctx: SmokeContext;
  let port: number;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    port = (ctx.server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('outbox dispatch: real Socket.IO client receives building.completed', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'ws-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });

    const client: ClientSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: user.accessToken },
      transports: ['websocket'],
      forceNew: true,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        client.once('connect', () => resolve());
        client.once('connect_error', (err) => reject(err));
        setTimeout(() => reject(new Error('socket connect timeout')), 5_000);
      });

      const received = new Promise<unknown>((resolve, reject) => {
        client.once('building.completed', (data) => resolve(data));
        setTimeout(
          () => reject(new Error('building.completed not received within 15s')),
          15_000,
        );
      });

      await request(ctx.server)
        .post(`/village/${villageId}/upgrade`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ buildingType: 'WOOD' });

      const payload = await received;
      expect(payload).toBeTruthy();
    } finally {
      client.disconnect();
    }
  });
});
