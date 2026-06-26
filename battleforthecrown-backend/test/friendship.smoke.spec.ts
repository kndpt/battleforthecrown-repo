import request from 'supertest';
import type {
  FriendshipDto,
  MyFriendshipsResponse,
} from '@battleforthecrown/shared/social';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

type Player = {
  userId: string;
  accessToken: string;
  displayName: string;
};

const asFriendship = (res: request.Response) => res.body as FriendshipDto;
const asMine = (res: request.Response) => res.body as MyFriendshipsResponse;
const asError = (res: request.Response) => res.body as { code?: string };

describe('friendship smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function newPlayer(worldId: string, tag: string): Promise<Player> {
    const user = await registerUser(ctx.server, `${tag}-${Date.now()}`);
    await joinWorld(ctx.server, user.accessToken, worldId, `v-${tag}`);
    return {
      userId: user.userId,
      accessToken: user.accessToken,
      displayName: user.displayName,
    };
  }

  const friendships = (worldId: string) => `/worlds/${worldId}/friendships`;

  it('request → accept → active lifecycle, with display-name lookup', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'a');
    const b = await newPlayer(world.id, 'b');

    // A requests B by display name.
    const reqRes = await request(ctx.server)
      .post(friendships(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ recipientDisplayName: b.displayName });
    expect(reqRes.status).toBe(200);
    expect(asFriendship(reqRes).status).toBe('PENDING');
    expect(asFriendship(reqRes).otherDisplayName).toBe(b.displayName);
    const friendshipId = asFriendship(reqRes).id;

    // Idempotent re-request from A returns the same PENDING row.
    const reReq = await request(ctx.server)
      .post(friendships(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ recipientUserId: b.userId });
    expect(reReq.status).toBe(200);
    expect(asFriendship(reReq).id).toBe(friendshipId);

    // Buckets: A sees pendingOut, B sees pendingIn.
    const meA = await request(ctx.server)
      .get(`${friendships(world.id)}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(asMine(meA).pendingOut).toHaveLength(1);
    expect(asMine(meA).pendingIn).toHaveLength(0);

    const meB = await request(ctx.server)
      .get(`${friendships(world.id)}/me`)
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(asMine(meB).pendingIn).toHaveLength(1);
    expect(asMine(meB).pendingIn[0].otherDisplayName).toBe(a.displayName);

    // Symmetric request from B while A's request is pending → guided to accept.
    const symRes = await request(ctx.server)
      .post(friendships(world.id))
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ recipientUserId: a.userId });
    expect(symRes.status).toBe(409);
    expect(asError(symRes).code).toBe('FRIENDSHIP_PENDING_AWAITING_ACCEPT');

    // Only the recipient can accept.
    const wrongAccept = await request(ctx.server)
      .post(`${friendships(world.id)}/${friendshipId}/accept`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(wrongAccept.status).toBe(403);

    // B accepts → ACTIVE both ways.
    const acceptRes = await request(ctx.server)
      .post(`${friendships(world.id)}/${friendshipId}/accept`)
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(acceptRes.status).toBe(200);
    expect(asFriendship(acceptRes).status).toBe('ACTIVE');

    const activeA = await request(ctx.server)
      .get(`${friendships(world.id)}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(asMine(activeA).active).toHaveLength(1);

    // Re-requesting an already-active pair → ALREADY_ACTIVE.
    const dupRes = await request(ctx.server)
      .post(friendships(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ recipientUserId: b.userId });
    expect(dupRes.status).toBe(409);
    expect(asError(dupRes).code).toBe('FRIENDSHIP_ALREADY_ACTIVE');

    // Either side can delete; here the recipient removes it.
    const delRes = await request(ctx.server)
      .delete(`${friendships(world.id)}/${friendshipId}`)
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(delRes.status).toBe(204);

    const afterDelete = await request(ctx.server)
      .get(`${friendships(world.id)}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(asMine(afterDelete).active).toHaveLength(0);
  });

  it('rejects self-friendship', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'self');
    const res = await request(ctx.server)
      .post(friendships(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ recipientUserId: a.userId });
    expect(res.status).toBe(400);
  });

  it('caps ACTIVE friends at 5, rechecked on the requester side at accept', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    // H sends 6 requests while at 0 ACTIVE (requests are allowed). As each
    // recipient accepts, H's ACTIVE count climbs — the 6th accept must be
    // refused because the REQUESTER (H) is already at the cap.
    const h = await newPlayer(world.id, 'h');
    const recipients: Player[] = [];
    const friendshipIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await newPlayer(world.id, `r${i}`);
      recipients.push(r);
      const res = await request(ctx.server)
        .post(friendships(world.id))
        .set('Authorization', `Bearer ${h.accessToken}`)
        .send({ recipientUserId: r.userId });
      expect(res.status).toBe(200);
      friendshipIds.push(asFriendship(res).id);
    }

    for (let i = 0; i < 5; i++) {
      const res = await request(ctx.server)
        .post(`${friendships(world.id)}/${friendshipIds[i]}/accept`)
        .set('Authorization', `Bearer ${recipients[i].accessToken}`);
      expect(res.status).toBe(200);
    }

    // 6th accept → requester H already at 5 ACTIVE → CAP_REACHED.
    const sixth = await request(ctx.server)
      .post(`${friendships(world.id)}/${friendshipIds[5]}/accept`)
      .set('Authorization', `Bearer ${recipients[5].accessToken}`);
    expect(sixth.status).toBe(409);
    expect(asError(sixth).code).toBe('DEFENSIVE_FRIENDS_CAP_REACHED');

    // H, now at cap, cannot even send a fresh request.
    const overflow = await newPlayer(world.id, 'overflow');
    const reqRes = await request(ctx.server)
      .post(friendships(world.id))
      .set('Authorization', `Bearer ${h.accessToken}`)
      .send({ recipientUserId: overflow.userId });
    expect(reqRes.status).toBe(409);
    expect(asError(reqRes).code).toBe('DEFENSIVE_FRIENDS_CAP_REACHED');
  });
});
