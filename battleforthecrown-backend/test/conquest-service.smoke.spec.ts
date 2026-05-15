import {
  BUILDING_TYPES,
  type BuildingType,
} from '@battleforthecrown/shared/village';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';
import { ConquestService } from '../src/modules/combat/conquest.service';

describe('conquest service smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('conquest: ConquestService → village.userId reassigned + village.conquered dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'conqueror',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-conquer-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    const conquest = ctx.app.get(ConquestService);
    const result = await conquest.conquerVillage({
      attackerVillageId: attackerId,
      targetVillageId: barbarian.id,
      attackerUserId: user.userId,
    });
    expect(result.success).toBe(true);

    const conquered = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: barbarian.id },
    });
    expect(conquered.userId).toBe(user.userId);

    const joinBuildings = await ctx.prisma.building.findMany({
      where: { villageId: attackerId },
      select: { type: true },
    });
    const conqueredBuildings = await ctx.prisma.building.findMany({
      where: { villageId: barbarian.id },
      select: { type: true, level: true },
    });
    const conqueredByType = new Map(
      conqueredBuildings.map((building) => [
        building.type as BuildingType,
        building.level,
      ]),
    );

    expect(conqueredBuildings.map((building) => building.type).sort()).toEqual(
      joinBuildings.map((building) => building.type).sort(),
    );
    expect(conqueredByType.get(BUILDING_TYPES.WATCHTOWER)).toBe(0);
    expect(conqueredByType.get(BUILDING_TYPES.COUNCIL_HALL)).toBe(0);
    expect(conqueredByType.get(BUILDING_TYPES.THRONE_HALL)).toBe(0);
    expect(conqueredByType.has(BUILDING_TYPES.WALL)).toBe(false);
    expect(conqueredByType.has(BUILDING_TYPES.HIDEOUT)).toBe(false);

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: barbarian.id },
      { timeoutMs: 5_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
    expect(event?.payload).toMatchObject({
      newOwnerId: user.userId,
      previousOwnerId: null,
    });
  });

  it('village.conquered payload keeps the previous owner for player villages', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(
      ctx.server,
      `conquer-attacker-${Date.now()}`,
    );
    const defender = await registerUser(
      ctx.server,
      `conquer-defender-${Date.now()}`,
    );
    const attackerJoin = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'pvp-conqueror',
    );
    const defenderJoin = await joinWorld(
      ctx.server,
      defender.accessToken,
      world.id,
      'pvp-target',
    );

    const conquest = ctx.app.get(ConquestService);
    await conquest.conquerVillage({
      attackerVillageId: attackerJoin.village.id,
      targetVillageId: defenderJoin.village.id,
      attackerUserId: attacker.userId,
    });

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: defenderJoin.village.id },
      { timeoutMs: 5_000 },
    );
    expect(event?.payload).toMatchObject({
      newOwnerId: attacker.userId,
      previousOwnerId: defender.userId,
    });
  });
});
