import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';
import {
  CONQUEST_FINALIZE_QUEUE,
  ConquestService,
} from '../src/modules/combat/conquest.service';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import {
  BUILDING_TYPES,
  isBuildingEnabled,
  getBuildingLevelValues,
  getFarmPopulationLimit,
  type BuildingType,
} from '@battleforthecrown/shared/village';

const EXPECTED_MATERIALIZED_BUILDINGS = [
  BUILDING_TYPES.BARRACKS,
  BUILDING_TYPES.CASTLE,
  BUILDING_TYPES.FARM,
  BUILDING_TYPES.IRON,
  BUILDING_TYPES.STONE,
  BUILDING_TYPES.WAREHOUSE,
  BUILDING_TYPES.WOOD,
] as const satisfies readonly BuildingType[];
const EXPECTED_MATERIALIZED_BUILDING_SET = new Set<BuildingType>(
  EXPECTED_MATERIALIZED_BUILDINGS,
);
const EXPECTED_UNBUILT_BUILDINGS = (
  Object.values(BUILDING_TYPES) as BuildingType[]
)
  .filter(
    (type) =>
      isBuildingEnabled(type) && !EXPECTED_MATERIALIZED_BUILDING_SET.has(type),
  )
  .sort();
const EXPECTED_T2_BUILDINGS = [
  ...EXPECTED_MATERIALIZED_BUILDINGS,
  ...EXPECTED_UNBUILT_BUILDINGS,
].sort();
const EXPECTED_T2_LEVEL = 1;
const EXPECTED_T2_BUILDING_POPULATION = EXPECTED_MATERIALIZED_BUILDINGS.reduce(
  (total, type) =>
    total + (getBuildingLevelValues(type, EXPECTED_T2_LEVEL)?.population ?? 0),
  0,
);

describe('conquest finalize smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function createTarget(worldId: string, x: number, y: number) {
    return ctx.prisma.village.create({
      data: {
        worldId,
        isBarbarian: true,
        name: `capture-target-${x}-${y}`,
        x,
        y,
        tier: 'T2',
        resourceStock: {
          create: { wood: 100, stone: 100, iron: 100, maxPerType: 100_000 },
        },
        buildings: {
          create: [
            { type: 'WOOD', level: 1 },
            { type: 'WATCHTOWER', level: 1 },
          ],
        },
        unitInventory: {
          create: [{ unitType: 'MILITIA', quantity: 10 }],
        },
      },
    });
  }

  it('opens a capture window then conquest:finalize transfers the village and emits events', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(
      ctx.server,
      `capture-complete-${Date.now()}`,
    );
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'capture-complete-origin',
    );
    const target = await createTarget(
      world.id,
      join.village.x + 1,
      join.village.y,
    );
    await ctx.prisma.garrison.create({
      data: {
        villageId: target.id,
        originVillageId: join.village.id,
        unitType: UNIT_TYPES.NOBLE,
        quantity: 1,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: join.village.id },
      data: { used: { increment: UNIT_COSTS[UNIT_TYPES.NOBLE].population } },
    });

    const conquest = ctx.app.get(ConquestService);
    const pending = await conquest.openCaptureWindow({
      attackerVillageId: join.village.id,
      targetVillageId: target.id,
      attackerUserId: user.userId,
      captureUntil: new Date(Date.now() + 100),
    });

    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.capture-window-opened', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: pending.id, status: 'COMPLETED' },
        }),
      { timeoutMs: 15_000 },
    );

    const conquered = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: target.id },
      include: { resourceStock: true, buildings: true, unitInventory: true },
    });
    const buildingsByType = [...conquered.buildings].sort((a, b) =>
      a.type.localeCompare(b.type),
    );
    const strategyConfig =
      await ctx.prisma.villageStrategyConfig.findUniqueOrThrow({
        where: { villageId: target.id },
      });
    const population = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: target.id },
    });
    const originPopulation = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: join.village.id },
    });
    const noblePopulation = UNIT_COSTS[UNIT_TYPES.NOBLE].population;

    expect(conquered.userId).toBe(user.userId);
    expect(conquered.isBarbarian).toBe(false);
    expect(conquered.resourceStock?.wood).toBe(0);
    expect(conquered.resourceStock?.stone).toBe(0);
    expect(conquered.resourceStock?.iron).toBe(0);
    expect(conquered.resourceStock?.maxPerType).toBe(
      getWarehouseStorageLimit(EXPECTED_T2_LEVEL).wood,
    );
    expect(buildingsByType.map((building) => building.type)).toEqual(
      EXPECTED_T2_BUILDINGS,
    );
    expect(
      buildingsByType.filter((building) =>
        EXPECTED_MATERIALIZED_BUILDING_SET.has(building.type as BuildingType),
      ),
    ).toEqual(
      [...EXPECTED_MATERIALIZED_BUILDINGS]
        .sort()
        .map((type) =>
          expect.objectContaining({ type, level: EXPECTED_T2_LEVEL }),
        ),
    );
    expect(
      buildingsByType.filter((building) =>
        EXPECTED_UNBUILT_BUILDINGS.includes(building.type as BuildingType),
      ),
    ).toEqual(
      EXPECTED_UNBUILT_BUILDINGS.map((type) =>
        expect.objectContaining({ type, level: 0 }),
      ),
    );
    expect(conquered.unitInventory).toHaveLength(0);
    expect(originPopulation.used).toBe(17);
    expect(strategyConfig.strategy).toBe('BALANCED');
    expect(population.used).toBe(
      EXPECTED_T2_BUILDING_POPULATION + noblePopulation,
    );
    expect(population.max).toBe(getFarmPopulationLimit(EXPECTED_T2_LEVEL));

    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.capture-window-completed', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );
    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );
  }, 30_000);

  it('interrupts an open capture window and finalization becomes a no-op', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(
      ctx.server,
      `capture-interrupt-${Date.now()}`,
    );
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'capture-interrupt-origin',
    );
    const target = await createTarget(
      world.id,
      join.village.x + 2,
      join.village.y,
    );

    const conquest = ctx.app.get(ConquestService);
    const pending = await conquest.openCaptureWindow({
      attackerVillageId: join.village.id,
      targetVillageId: target.id,
      attackerUserId: user.userId,
      captureUntil: new Date(Date.now() + 60_000),
    });

    const interrupted = await conquest.interruptCaptureWindow(
      target.id,
      'noble-killed',
    );
    expect(interrupted).toEqual({
      interrupted: true,
      pendingConquestId: pending.id,
    });

    await ctx.boss.send(CONQUEST_FINALIZE_QUEUE, {
      pendingConquestId: pending.id,
    });

    await waitFor(
      () =>
        ctx.prisma.pendingConquest.findFirst({
          where: { id: pending.id, status: 'INTERRUPTED' },
        }),
      { timeoutMs: 10_000 },
    );

    await outboxDispatched(
      ctx.prisma,
      { kind: 'village.capture-window-interrupted', aggregateId: target.id },
      { timeoutMs: 10_000 },
    );

    const targetAfter = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(targetAfter.userId).toBeNull();
    expect(targetAfter.isBarbarian).toBe(true);
  }, 30_000);
});
