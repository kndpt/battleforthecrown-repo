import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import { bootSmokeApp, type SmokeContext } from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Bascule cohorte principale → retardataires (run 083). À
 * `startedAt + inscriptionMainDays` (7j en config smoke), le monde reste OPEN
 * mais émet un seul `world.inscription-phase.changed` et persiste
 * `inscriptionPhaseTransitionedAt`. Idempotence garantie par la colonne.
 */
describe('world inscription phase transition smoke', () => {
  let ctx: SmokeContext;
  let worker: WorldLifecycleWorker;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
    worker = ctx.app.get(WorldLifecycleWorker);
  });

  beforeEach(async () => {
    await ctx.prisma.eventOutbox.deleteMany();
    await ctx.prisma.worldMembership.deleteMany();
    await ctx.prisma.world.deleteMany();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedOpenWorld(id: string, startedDaysAgo: number) {
    const now = Date.now();
    await ctx.prisma.world.create({
      data: {
        id,
        name: id,
        status: 'OPEN',
        startedAt: new Date(now - startedDaysAgo * MS_PER_DAY),
        endsAt: new Date(now + (60 - startedDaysAgo) * MS_PER_DAY),
        config: SMOKE_WORLD_CONFIG,
      },
    });
  }

  async function inscriptionEvents(worldId: string) {
    return ctx.prisma.eventOutbox.findMany({
      where: { kind: 'world.inscription-phase.changed', aggregateId: worldId },
    });
  }

  it('emits exactly one event when crossing main → late, world stays OPEN', async () => {
    // 8 days > inscriptionMainDays (7), < main+late (10) so it is not locked.
    await seedOpenWorld('insc-8d', 8);
    const now = new Date();

    const result = await worker.handleLifecycleTick(now);
    expect(result.inscriptionPhaseChanged).toBe(1);

    const world = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: 'insc-8d' },
    });
    expect(world.status).toBe('OPEN');
    expect(world.inscriptionPhaseTransitionedAt).toEqual(now);

    const events = await inscriptionEvents('insc-8d');
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({
      worldId: 'insc-8d',
      from: 'main',
      to: 'late',
    });
  });

  it('is idempotent: a re-tick on a transitioned world emits no second event', async () => {
    await seedOpenWorld('insc-idem', 9);
    const first = new Date();

    await worker.handleLifecycleTick(first);
    const afterFirst = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: 'insc-idem' },
    });
    const stamped = afterFirst.inscriptionPhaseTransitionedAt;
    expect(stamped).not.toBeNull();

    const second = await worker.handleLifecycleTick(
      new Date(first.getTime() + 60_000),
    );
    expect(second.inscriptionPhaseChanged).toBe(0);

    const afterSecond = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: 'insc-idem' },
    });
    // Timestamp frozen at the first transition; not rewritten on re-tick.
    expect(afterSecond.inscriptionPhaseTransitionedAt).toEqual(stamped);
    expect(await inscriptionEvents('insc-idem')).toHaveLength(1);
  });

  it('does not transition a world still inside the main cohort window', async () => {
    await seedOpenWorld('insc-3d', 3); // < inscriptionMainDays (7)
    const now = new Date();

    const result = await worker.handleLifecycleTick(now);
    expect(result.inscriptionPhaseChanged).toBe(0);

    const world = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: 'insc-3d' },
    });
    expect(world.inscriptionPhaseTransitionedAt).toBeNull();
    expect(await inscriptionEvents('insc-3d')).toHaveLength(0);
  });
});
