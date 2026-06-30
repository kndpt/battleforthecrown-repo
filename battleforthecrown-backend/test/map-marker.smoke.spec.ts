import request from 'supertest';
import {
  MAP_MARKER_CAP,
  MAP_MARKER_NOTE_MAX_LENGTH,
  type MapMarkerDto,
} from '@battleforthecrown/shared/map-markers';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

type Player = { userId: string; accessToken: string };

const asMarker = (res: request.Response) => res.body as MapMarkerDto;
const asList = (res: request.Response) => res.body as MapMarkerDto[];
const asError = (res: request.Response) => res.body as { code?: string };

describe('map-marker smoke', () => {
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
    return { userId: user.userId, accessToken: user.accessToken };
  }

  const markers = (worldId: string) => `/worlds/${worldId}/map-markers`;

  it('CRUD + upsert idempotence on a tile', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'crud');

    // Create.
    const created = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 10, y: 20, kind: 'TARGET', note: '  raid here  ' });
    expect(created.status).toBe(200);
    expect(asMarker(created).kind).toBe('TARGET');
    // Note is trimmed server-side.
    expect(asMarker(created).note).toBe('raid here');
    const id = asMarker(created).id;

    // List shows it.
    const list1 = await request(ctx.server)
      .get(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(list1.status).toBe(200);
    expect(asList(list1)).toHaveLength(1);

    // Re-POST on the SAME tile upserts in place (same id, edited kind/note),
    // does not create a second row.
    const upserted = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 10, y: 20, kind: 'DANGER', note: '' });
    expect(upserted.status).toBe(200);
    expect(asMarker(upserted).id).toBe(id);
    expect(asMarker(upserted).kind).toBe('DANGER');
    expect(asMarker(upserted).note).toBeNull(); // empty note → null
    expect(
      await ctx.prisma.mapMarker.count({ where: { worldId: world.id } }),
    ).toBe(1);

    // PATCH kind only — note untouched.
    await request(ctx.server)
      .patch(`${markers(world.id)}/${id}`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ kind: 'TO_SCOUT' })
      .expect(200);
    const afterPatch = await ctx.prisma.mapMarker.findUniqueOrThrow({
      where: { id },
    });
    expect(afterPatch.kind).toBe('TO_SCOUT');

    // DELETE.
    await request(ctx.server)
      .delete(`${markers(world.id)}/${id}`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .expect(204);
    const list2 = await request(ctx.server)
      .get(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(asList(list2)).toHaveLength(0);
  });

  it('validation: rejects an over-long note and an unknown kind', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'valid');

    const tooLong = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({
        x: 1,
        y: 1,
        kind: 'NOTE',
        note: 'x'.repeat(MAP_MARKER_NOTE_MAX_LENGTH + 1),
      });
    expect(tooLong.status).toBe(400);

    const badKind = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 1, y: 1, kind: 'NOPE' });
    expect(badKind.status).toBe(400);

    const created = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 2, y: 2, kind: 'NOTE' });
    const emptyPatch = await request(ctx.server)
      .patch(`${markers(world.id)}/${asMarker(created).id}`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({});
    expect(emptyPatch.status).toBe(400);
  });

  it('caps markers at MAP_MARKER_CAP new tiles per world; upsert on a marked tile still allowed at cap', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'cap');

    // Seed the cap directly (fast) — a distinct tile per row.
    await ctx.prisma.mapMarker.createMany({
      data: Array.from({ length: MAP_MARKER_CAP }, (_, i) => ({
        userId: a.userId,
        worldId: world.id,
        x: i,
        y: 0,
        kind: 'INTEREST' as const,
      })),
    });

    // A genuinely new tile is refused — caller already at the cap.
    const overflow = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 999, y: 999, kind: 'TARGET' });
    expect(overflow.status).toBe(409);
    expect(asError(overflow).code).toBe('MAP_MARKER_CAP_REACHED');

    // Editing an ALREADY-marked tile is still allowed at the cap (no new row).
    const editAtCap = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 0, y: 0, kind: 'DANGER' });
    expect(editAtCap.status).toBe(200);
    expect(
      await ctx.prisma.mapMarker.count({ where: { worldId: world.id } }),
    ).toBe(MAP_MARKER_CAP);
  });

  it('isolates markers per account: B never sees, edits, or deletes A’s marker', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'iso-a');
    const b = await newPlayer(world.id, 'iso-b');

    const created = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 5, y: 5, kind: 'TARGET' });
    const aMarkerId = asMarker(created).id;

    // B's list is empty — A's marker never leaks.
    const bList = await request(ctx.server)
      .get(markers(world.id))
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(asList(bList)).toHaveLength(0);

    // B cannot PATCH or DELETE A's marker — 404 (never 403, no existence leak).
    const bPatch = await request(ctx.server)
      .patch(`${markers(world.id)}/${aMarkerId}`)
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ kind: 'DANGER' });
    expect(bPatch.status).toBe(404);
    expect(asError(bPatch).code).toBe('MAP_MARKER_NOT_FOUND');

    const bDelete = await request(ctx.server)
      .delete(`${markers(world.id)}/${aMarkerId}`)
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(bDelete.status).toBe(404);

    // A's marker is untouched.
    expect(
      await ctx.prisma.mapMarker.findUnique({ where: { id: aMarkerId } }),
    ).not.toBeNull();
  });

  it('isolates markers per world: a marker on world1 is invisible / unreachable from world2', async () => {
    const world1 = await seedSmokeWorld(ctx.prisma);
    const world2 = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server, `xworld-${Date.now()}`);
    await joinWorld(ctx.server, user.accessToken, world1.id, 'v1');
    await joinWorld(ctx.server, user.accessToken, world2.id, 'v2');

    const created = await request(ctx.server)
      .post(markers(world1.id))
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ x: 3, y: 3, kind: 'TARGET' });
    const id = asMarker(created).id;

    // world2 list excludes it.
    const w2List = await request(ctx.server)
      .get(markers(world2.id))
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(asList(w2List)).toHaveLength(0);

    // Reaching the marker through the wrong world path 404s (worldId guard).
    const wrongWorld = await request(ctx.server)
      .patch(`${markers(world2.id)}/${id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ kind: 'DANGER' });
    expect(wrongWorld.status).toBe(404);
  });

  it('read-only ENDED world: mutations rejected, GET still allowed', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'ended');

    const created = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 7, y: 7, kind: 'INTEREST' });
    const id = asMarker(created).id;

    await ctx.prisma.world.update({
      where: { id: world.id },
      data: { status: 'ENDED', endsAt: new Date() },
    });

    // GET stays available during the ENDED consultation window.
    const list = await request(ctx.server)
      .get(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(list.status).toBe(200);
    expect(asList(list)).toHaveLength(1);

    // Every mutation is rejected with WORLD_READ_ONLY.
    const post = await request(ctx.server)
      .post(markers(world.id))
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ x: 8, y: 8, kind: 'TARGET' });
    expect(post.status).toBe(403);
    expect(asError(post).code).toBe('WORLD_READ_ONLY');

    const patch = await request(ctx.server)
      .patch(`${markers(world.id)}/${id}`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ kind: 'DANGER' });
    expect(patch.status).toBe(403);

    const del = await request(ctx.server)
      .delete(`${markers(world.id)}/${id}`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(del.status).toBe(403);
  });
});
