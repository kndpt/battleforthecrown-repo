import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { ArmyService } from '../src/modules/army/army.service';
import { TrainingWorker } from '../src/workers/training.worker';
import PgBoss from 'pg-boss';

/**
 * Full Integration Tests for Unit Training System
 *
 * Tests cover:
 * 1. Training initiation (resource/population deduction)
 * 2. Training validation (barracks level, existing training)
 * 3. Worker completion (unit added to inventory)
 * 4. Training cancellation (full refund)
 * 5. Multi-unit training (incremental completion)
 */
describe('Training System Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let armyService: ArmyService;
  let trainingWorker: TrainingWorker;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let pgBoss: PgBoss;

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
    armyService = app.get(ArmyService);
    trainingWorker = app.get(TrainingWorker);
    pgBoss = app.get<PgBoss>('PG_BOSS');

    // Create test world with unit config
    const world = await prisma.world.create({
      data: {
        id: `test-training-${Date.now()}`,
        name: 'Test Training World',
        status: 'OPEN',
        config: {
          units: {
            costs: {
              SPEAR: {
                wood: 50,
                stone: 30,
                iron: 10,
                population: 1,
                time: 30, // 30 seconds
                requiredBarracksLevel: 1,
              },
              SWORD: {
                wood: 80,
                stone: 50,
                iron: 20,
                population: 1,
                time: 60,
                requiredBarracksLevel: 2,
              },
            },
          },
          multipliers: {
            training: 10, // 10x faster for tests
          },
        },
        speedMultipliers: { construction: 1, production: 1, training: 10 },
      },
    });
    testWorldId = world.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-training-${Date.now()}@test.com`,
        password: 'test123',
      },
    });
    testUserId = user.id;

    // Create test village
    const village = await prisma.village.create({
      data: {
        worldId: testWorldId,
        userId: testUserId,
        name: 'Training Village',
        x: 100,
        y: 100,
        isBarbarian: false,
      },
    });
    testVillageId = village.id;

    // Create barracks
    await prisma.building.create({
      data: { villageId: testVillageId, type: 'BARRACKS', level: 2 },
    });

    // Create resources
    await prisma.resourceStock.create({
      data: {
        villageId: testVillageId,
        wood: 5000,
        stone: 5000,
        iron: 3000,
        maxPerType: 10000,
      },
    });

    // Create population
    await prisma.population.create({
      data: { villageId: testVillageId, max: 100, used: 0 },
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

  describe('Training Initiation', () => {
    afterEach(async () => {
      // Cleanup training records
      await prisma.unitTraining.deleteMany({
        where: { villageId: testVillageId },
      });
    });

    it('should initiate training and deduct resources', async () => {
      const stockBefore = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popBefore = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 5);

      expect(training.unitType).toBe('SPEAR');
      expect(training.totalQty).toBe(5);
      expect(training.completedQty).toBe(0);
      expect(training.timePerUnitMs).toBe(3000); // 30s / 10x = 3s

      const stockAfter = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popAfter = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      // Verify resource deduction (5 units * costs)
      expect(stockAfter!.wood).toBe(stockBefore!.wood - 250); // 5 * 50
      expect(stockAfter!.stone).toBe(stockBefore!.stone - 150); // 5 * 30
      expect(stockAfter!.iron).toBe(stockBefore!.iron - 50); // 5 * 10

      // Verify population consumption
      expect(popAfter!.used).toBe(popBefore!.used + 5); // 5 * 1
    });

    it('should create training record and schedule worker', async () => {
      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 3);

      const trainingRecord = await prisma.unitTraining.findUnique({
        where: { id: training.id },
      });

      expect(trainingRecord).toBeDefined();
      expect(trainingRecord!.villageId).toBe(testVillageId);
      expect(trainingRecord!.unitType).toBe('SPEAR');
      expect(trainingRecord!.totalQty).toBe(3);
      expect(trainingRecord!.completedQty).toBe(0);
    });
  });

  describe('Training Validation', () => {
    afterEach(async () => {
      await prisma.unitTraining.deleteMany({
        where: { villageId: testVillageId },
      });
    });

    it('should reject training without barracks', async () => {
      await prisma.building.deleteMany({
        where: { villageId: testVillageId, type: 'BARRACKS' },
      });

      await expect(
        armyService.trainUnits(testVillageId, 'SPEAR', 5),
      ).rejects.toThrow(/Barracks not found/i);

      // Restore barracks
      await prisma.building.create({
        data: { villageId: testVillageId, type: 'BARRACKS', level: 2 },
      });
    });

    it('should reject training with insufficient barracks level', async () => {
      await prisma.building.updateMany({
        where: { villageId: testVillageId, type: 'BARRACKS' },
        data: { level: 1 },
      });

      await expect(
        armyService.trainUnits(testVillageId, 'SWORD', 5),
      ).rejects.toThrow(/Barracks level 2 required/i);

      // Restore barracks level
      await prisma.building.updateMany({
        where: { villageId: testVillageId, type: 'BARRACKS' },
        data: { level: 2 },
      });
    });

    it('should reject training with insufficient resources', async () => {
      await prisma.resourceStock.update({
        where: { villageId: testVillageId },
        data: { wood: 10, stone: 10, iron: 1 },
      });

      await expect(
        armyService.trainUnits(testVillageId, 'SPEAR', 5),
      ).rejects.toThrow(/Insufficient resources/i);

      // Restore resources
      await prisma.resourceStock.update({
        where: { villageId: testVillageId },
        data: { wood: 5000, stone: 5000, iron: 3000 },
      });
    });

    it('should reject training with insufficient population', async () => {
      await prisma.population.update({
        where: { villageId: testVillageId },
        data: { used: 98 }, // Only 2 available
      });

      await expect(
        armyService.trainUnits(testVillageId, 'SPEAR', 5),
      ).rejects.toThrow(/Insufficient population/i);

      // Restore population
      await prisma.population.update({
        where: { villageId: testVillageId },
        data: { used: 0 },
      });
    });

    it('should reject concurrent training', async () => {
      await armyService.trainUnits(testVillageId, 'SPEAR', 3);

      await expect(
        armyService.trainUnits(testVillageId, 'SWORD', 2),
      ).rejects.toThrow(/Training already in progress/i);
    });
  });

  describe('Training Cancellation', () => {
    it('should cancel training and refund full resources', async () => {
      const stockBefore = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popBefore = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 10);

      const stockAfter = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popAfter = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      // Verify deduction
      expect(stockAfter!.wood).toBe(stockBefore!.wood - 500);
      expect(popAfter!.used).toBe(popBefore!.used + 10);

      // Cancel training
      const cancelResult = await armyService.cancelTraining(
        testVillageId,
        training.id,
      );

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.refunded).toBe(10); // All 10 units refunded

      const stockRefunded = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });
      const popRefunded = await prisma.population.findUnique({
        where: { villageId: testVillageId },
      });

      // Verify full refund
      expect(stockRefunded!.wood).toBe(stockBefore!.wood);
      expect(stockRefunded!.stone).toBe(stockBefore!.stone);
      expect(stockRefunded!.iron).toBe(stockBefore!.iron);
      expect(popRefunded!.used).toBe(popBefore!.used);

      // Verify training record deleted
      const deletedTraining = await prisma.unitTraining.findUnique({
        where: { id: training.id },
      });
      expect(deletedTraining).toBeNull();
    });

    it('should cancel partially completed training with partial refund', async () => {
      const stockBefore = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });

      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 10);

      // Simulate partial completion (3 units done)
      await prisma.unitTraining.update({
        where: { id: training.id },
        data: { completedQty: 3 },
      });

      const cancelResult = await armyService.cancelTraining(
        testVillageId,
        training.id,
      );

      expect(cancelResult.refunded).toBe(7); // 10 - 3 = 7 remaining

      const stockRefunded = await prisma.resourceStock.findUnique({
        where: { villageId: testVillageId },
      });

      // Verify partial refund (7 units refunded, 3 kept)
      const expectedWood = stockBefore!.wood - 150; // 3 * 50 (kept)
      expect(stockRefunded!.wood).toBe(expectedWood);
    });
  });

  describe('Worker Completion Flow', () => {
    afterEach(async () => {
      // Cleanup training and inventory
      await prisma.unitTraining.deleteMany({
        where: { villageId: testVillageId },
      });
      await prisma.unitInventory.deleteMany({
        where: { villageId: testVillageId },
      });
    });

    it('should complete single unit training', async () => {
      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 1);

      const inventoryBefore = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });

      // Manually trigger worker (simulate pg-boss job execution)
      await trainingWorker['handleTrainingTick']({
        trainingId: training.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      const inventoryAfter = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });

      // Verify unit added
      const expectedQty = (inventoryBefore?.quantity || 0) + 1;
      expect(inventoryAfter!.quantity).toBe(expectedQty);

      // Verify training deleted (completed)
      const completedTraining = await prisma.unitTraining.findUnique({
        where: { id: training.id },
      });
      expect(completedTraining).toBeNull();

      // Verify completion event
      const completionEvent = await prisma.eventOutbox.findFirst({
        where: {
          kind: 'unit.training.completed',
          aggregateId: testVillageId,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(completionEvent).toBeDefined();
    });

    it('should complete multi-unit training incrementally', async () => {
      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 3);

      // Complete first unit
      await trainingWorker['handleTrainingTick']({
        trainingId: training.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      let trainingState = await prisma.unitTraining.findUnique({
        where: { id: training.id },
      });
      expect(trainingState!.completedQty).toBe(1);

      let inventory = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });
      expect(inventory!.quantity).toBe(1);

      // Complete second unit
      await trainingWorker['handleTrainingTick']({
        trainingId: training.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      trainingState = await prisma.unitTraining.findUnique({
        where: { id: training.id },
      });
      expect(trainingState!.completedQty).toBe(2);

      inventory = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });
      expect(inventory!.quantity).toBe(2);

      // Complete third unit (final)
      await trainingWorker['handleTrainingTick']({
        trainingId: training.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      // Verify training deleted
      trainingState = await prisma.unitTraining.findUnique({
        where: { id: training.id },
      });
      expect(trainingState).toBeNull();

      // Verify all units added
      inventory = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });
      expect(inventory!.quantity).toBe(3);
    });

    it('should handle worker idempotency (duplicate job execution)', async () => {
      const training = await armyService.trainUnits(testVillageId, 'SPEAR', 1);

      // Execute worker twice (simulate duplicate job)
      await trainingWorker['handleTrainingTick']({
        trainingId: training.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      await trainingWorker['handleTrainingTick']({
        trainingId: training.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      // Verify only 1 unit added (not 2)
      const inventory = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });
      expect(inventory!.quantity).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    afterEach(async () => {
      await prisma.unitTraining.deleteMany({
        where: { villageId: testVillageId },
      });
      await prisma.unitInventory.deleteMany({
        where: { villageId: testVillageId },
      });
    });

    it('should accumulate units across multiple trainings', async () => {
      // First training batch
      const training1 = await armyService.trainUnits(testVillageId, 'SPEAR', 2);

      await trainingWorker['handleTrainingTick']({
        trainingId: training1.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });
      await trainingWorker['handleTrainingTick']({
        trainingId: training1.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      let inventory = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });
      expect(inventory!.quantity).toBe(2);

      // Second training batch
      const training2 = await armyService.trainUnits(testVillageId, 'SPEAR', 3);

      await trainingWorker['handleTrainingTick']({
        trainingId: training2.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });
      await trainingWorker['handleTrainingTick']({
        trainingId: training2.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });
      await trainingWorker['handleTrainingTick']({
        trainingId: training2.id,
        villageId: testVillageId,
        unitType: 'SPEAR',
      });

      inventory = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: {
            villageId: testVillageId,
            unitType: 'SPEAR',
          },
        },
      });
      expect(inventory!.quantity).toBe(5); // 2 + 3
    });

    it('should reject training with invalid unit type', async () => {
      await expect(
        armyService.trainUnits(testVillageId, 'INVALID_UNIT', 5),
      ).rejects.toThrow(/Invalid unit type/i);
    });

    it('should reject training with zero or negative quantity', async () => {
      await expect(
        armyService.trainUnits(testVillageId, 'SPEAR', 0),
      ).rejects.toThrow(/Quantity must be positive/i);

      await expect(
        armyService.trainUnits(testVillageId, 'SPEAR', -5),
      ).rejects.toThrow(/Quantity must be positive/i);
    });
  });
});
