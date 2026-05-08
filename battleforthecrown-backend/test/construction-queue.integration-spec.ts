import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { VillageService } from '../src/modules/village/village.service';
type BuildingsConfig = {
  enabled?: Record<string, boolean>;
};
import { InputJsonValue } from '@prisma/client/runtime/library';

/**
 * Integration Tests for Construction Queue System
 *
 * Tests cover:
 * 1. Queue management (max queue, already under construction)
 * 2. Building constraints (max level, castle requirements, disabled)
 * 3. Construction cancellation (refund resources)
 */
describe('Construction Queue Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let villageService: VillageService;

  let testWorldId: string;
  let testUserId: string;
  let testVillageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    villageService = app.get(VillageService);

    // Create test world with complete config
    const world = await prisma.world.create({
      data: {
        id: `test-construction-${Date.now()}`,
        name: 'Test Construction World',
        status: 'OPEN',
        config: {
          buildings: {
            costs: {
              WOOD: {
                1: { wood: 50, stone: 50, iron: 20, population: 1 },
                2: { wood: 100, stone: 100, iron: 40, population: 2 },
                3: { wood: 150, stone: 150, iron: 60, population: 3 },
              },
              STONE: {
                1: { wood: 50, stone: 50, iron: 20, population: 1 },
              },
              IRON: {
                1: { wood: 50, stone: 50, iron: 20, population: 1 },
              },
              BARRACKS: {
                1: { wood: 100, stone: 100, iron: 50, population: 5 },
              },
            },
            times: {
              WOOD: { 1: 60, 2: 120, 3: 180 },
              STONE: { 1: 60 },
              IRON: { 1: 60 },
              BARRACKS: { 1: 300 },
            },
            maxLevels: { WOOD: 3, STONE: 5, IRON: 5, BARRACKS: 5 },
            enabled: { WOOD: true, STONE: true, IRON: true },
            maxQueue: 2,
            unlockRequirements: { BARRACKS: 2 },
          },
          castle: {
            constructionSpeedBonus: { 1: 1.0, 2: 0.95, 3: 0.9 },
          },
        },
        speedMultipliers: { construction: 1, production: 1, training: 1 },
      },
    });
    testWorldId = world.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-construction-${Date.now()}@test.com`,
        password: 'test123',
      },
    });
    testUserId = user.id;

    // Create test village
    const village = await prisma.village.create({
      data: {
        worldId: testWorldId,
        userId: testUserId,
        name: 'Test Village',
        x: 100,
        y: 100,
        isBarbarian: false,
      },
    });
    testVillageId = village.id;

    // Create initial buildings
    await prisma.building.createMany({
      data: [
        { villageId: testVillageId, type: 'HQ', level: 3 },
        { villageId: testVillageId, type: 'WOOD', level: 1 },
      ],
    });

    // Create resources and population
    await prisma.resourceStock.create({
      data: {
        villageId: testVillageId,
        wood: 5000,
        stone: 5000,
        iron: 3000,
        maxPerType: 10000,
      },
    });

    await prisma.population.create({
      data: { villageId: testVillageId, max: 100, used: 10 },
    });
  });

  afterAll(async () => {
    if (testWorldId) {
      await prisma.village.deleteMany({ where: { worldId: testWorldId } });
      await prisma.world.delete({ where: { id: testWorldId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await app.close();
  });

  describe('Queue Management', () => {
    afterEach(async () => {
      // Clear queue after each test
      await prisma.building.updateMany({
        where: { villageId: testVillageId },
        data: { startTime: null, endTime: null },
      });
    });

    it('should reject upgrade when queue is full', async () => {
      // Fill the queue (max = 2)
      await villageService.upgradeBuilding(testVillageId, 'WOOD');
      await villageService.upgradeBuilding(testVillageId, 'STONE');

      // Try to add a third
      await expect(
        villageService.upgradeBuilding(testVillageId, 'IRON'),
      ).rejects.toThrow(/queue full/i);
    });

    it('should reject upgrade when already under construction', async () => {
      await villageService.upgradeBuilding(testVillageId, 'WOOD');

      await expect(
        villageService.upgradeBuilding(testVillageId, 'WOOD'),
      ).rejects.toThrow(/already under construction/i);
    });
  });

  describe('Building Constraints', () => {
    it('should reject upgrade at max level', async () => {
      // Set WOOD to max level (3)
      await prisma.building.updateMany({
        where: { villageId: testVillageId, type: 'WOOD' },
        data: { level: 3, startTime: null, endTime: null },
      });

      await expect(
        villageService.upgradeBuilding(testVillageId, 'WOOD'),
      ).rejects.toThrow(/max level/i);
    });

    it('should reject new building without castle requirement', async () => {
      // BARRACKS requires Castle level 2, but we only have HQ level 3
      await expect(
        villageService.upgradeBuilding(testVillageId, 'BARRACKS'),
      ).rejects.toThrow(/Castle level 2 required/i);
    });

    it('should reject disabled building', async () => {
      const worldConfig = await prisma.world.findUnique({
        where: { id: testWorldId },
      });
      if (!worldConfig) {
        throw new Error('World not found');
      }
      // Update world config to disable IRON
      await prisma.world.update({
        where: { id: testWorldId },
        data: {
          // The config field is usually JSON; we must parse, patch and stringify safely.
          config: (() => {
            // Defensive parse (worldConfig.config may be an object or string depending on Prisma config/serialization)
            const configObj =
              (typeof worldConfig.config === 'string'
                ? JSON.parse(worldConfig.config)
                : worldConfig.config) || {};

            const buildings =
              (configObj.buildings as BuildingsConfig | undefined) || {};
            buildings.enabled = buildings.enabled ?? {};
            buildings.enabled.WOOD = true;
            buildings.enabled.STONE = true;
            buildings.enabled.IRON = false;
            configObj.buildings = buildings;
            return configObj as unknown as InputJsonValue;
          })(),
        },
      });
      await expect(
        villageService.upgradeBuilding(testVillageId, 'IRON'),
      ).rejects.toThrow(/temporarily disabled/i);
    });
  });

  describe('Construction Cancellation', () => {
    beforeAll(async () => {
      // Clear queue for cancellation tests
      await prisma.building.updateMany({
        where: { villageId: testVillageId },
        data: { startTime: null, endTime: null },
      });
    });

    it('should cancel construction and refund resources', async () => {
      const stockBefore = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popBefore = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      // Start construction
      const result = await villageService.upgradeBuilding(
        testVillageId,
        'STONE',
      );

      const stockAfter = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popAfter = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      // Verify resources deducted
      expect(stockAfter!.wood).toBe(stockBefore!.wood - result.cost.wood);
      expect(popAfter!.used).toBe(popBefore!.used + result.cost.population);

      // Cancel construction
      const cancelResult = await villageService.cancelConstruction(
        testVillageId,
        result.id,
      );

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.refunded.wood).toBe(result.cost.wood);

      const stockRefunded = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popRefunded = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      // Verify refund
      expect(stockRefunded!.wood).toBe(stockBefore!.wood);
      expect(popRefunded!.used).toBe(popBefore!.used);
    });

    it('should reject cancel on non-construction building', async () => {
      const building = await prisma.building.findFirst({
        where: { villageId: testVillageId, type: 'WOOD' },
      });

      await expect(
        villageService.cancelConstruction(testVillageId, building!.id),
      ).rejects.toThrow(/not under construction/i);
    });
  });

  describe('Cost Calculation', () => {
    it('should apply castle bonus to construction time', async () => {
      // Reset WOOD to level 1
      await prisma.building.updateMany({
        where: { villageId: testVillageId, type: 'WOOD' },
        data: { level: 1, startTime: null, endTime: null },
      });

      // Add Castle for bonus
      await prisma.building.create({
        data: { villageId: testVillageId, type: 'CASTLE', level: 2 },
      });

      const result = await villageService.upgradeBuilding(
        testVillageId,
        'WOOD',
      );

      // Base time = 120s, castle bonus = 0.95, speed multiplier = 1
      // Expected time = 120 * 0.95 = 114s = 114000ms
      expect(result.cost.time).toBe(114000);
    });
  });
});
