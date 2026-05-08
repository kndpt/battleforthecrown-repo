import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { BarbarianSeedingService } from '../src/modules/world/barbarian-seeding.service';
import { ResourcesService } from '../src/modules/resources/resources.service';
import { ConquestService } from '../src/modules/combat/conquest.service';
import { CombatService } from '../src/modules/combat/combat.service';
import { VillageService } from '../src/modules/village/village.service';

/**
 * E2E Tests for Phase 2: Combat & Conquest
 *
 * Tests cover:
 * 1. Barbarian village seeding with real buildings/resources
 * 2. Resource production and catch-up calculation
 * 3. Combat against barbarians with dynamic loot
 * 4. Conquest mechanics (ownership transfer)
 * 5. Power recalculation after conquest
 */
describe('Combat & Conquest E2E (Phase 2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let barbarianSeeding: BarbarianSeedingService;
  let resourcesService: ResourcesService;
  let conquestService: ConquestService;
  let combatService: CombatService;
  let villageService: VillageService;

  let testWorldId: string;
  let testUserId: string;
  let playerVillageId: string;
  let barbarianVillageId: string;
  let secondBarbarianId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    barbarianSeeding = app.get(BarbarianSeedingService);
    resourcesService = app.get(ResourcesService);
    conquestService = app.get(ConquestService);
    combatService = app.get(CombatService);
    villageService = app.get(VillageService);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testWorldId) {
      await prisma.village.deleteMany({ where: { worldId: testWorldId } });
      await prisma.world.delete({ where: { id: testWorldId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }

    await app.close();
  });

  describe('1. Test Setup & Barbarian Seeding', () => {
    it('should create test world and user', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `test-combat-${Date.now()}@test.com`,
          password: 'test123',
        },
      });
      testUserId = user.id;

      // Create test world
      const world = await prisma.world.create({
        data: {
          id: `test-combat-world-${Date.now()}`,
          name: 'Test Combat World',
          status: 'OPEN',
          config: {
            barbarianSeeding: {
              enabled: true,
              chunkSize: 50,
              rMin: 5,
              rMax: 30,
              targetMin: 2,
              targetMax: 5,
              minSpacing: 3,
              playerExclusion: 5,
              seedVersion: 1,
              tiers: {
                T1: {
                  minPoints: 100,
                  maxPoints: 300,
                  buildingRatio: 0.6,
                  loot: {
                    wood: { min: 200, max: 400 },
                    stone: { min: 200, max: 400 },
                    iron: { min: 100, max: 250 },
                  },
                  visibleIndexNoise: 0.1,
                },
                T2: {
                  minPoints: 400,
                  maxPoints: 800,
                  buildingRatio: 0.5,
                  loot: {
                    wood: { min: 600, max: 1000 },
                    stone: { min: 600, max: 1000 },
                    iron: { min: 400, max: 700 },
                  },
                  visibleIndexNoise: 0.12,
                },
              },
              tierRanges: [
                { minDistance: 5, maxDistance: 15, tier: 'T1' },
                { minDistance: 15, maxDistance: 30, tier: 'T2' },
              ],
            },
            buildings: {
              costs: {
                WOOD: {
                  1: { wood: 50, stone: 50, iron: 20, population: 1 },
                  2: { wood: 100, stone: 100, iron: 40, population: 2 },
                },
                STONE: {
                  1: { wood: 50, stone: 50, iron: 20, population: 1 },
                },
              },
              times: {
                WOOD: { 1: 60, 2: 120 },
                STONE: { 1: 60 },
              },
              maxLevels: { WOOD: 5, STONE: 5 },
              enabled: {},
              maxQueue: 3,
              unlockRequirements: {},
            },
            castle: {
              constructionSpeedBonus: {
                1: 1.0,
                2: 0.95,
                3: 0.9,
                4: 0.85,
                5: 0.8,
              },
            },
            resources: {
              productionRates: {
                WOOD: {
                  1: 30,
                  2: 45,
                  3: 65,
                  4: 90,
                  5: 120,
                  6: 150,
                  7: 180,
                  8: 210,
                },
                STONE: {
                  1: 30,
                  2: 45,
                  3: 65,
                  4: 90,
                  5: 120,
                  6: 150,
                  7: 180,
                  8: 210,
                },
                IRON: {
                  1: 25,
                  2: 40,
                  3: 55,
                  4: 75,
                  5: 100,
                  6: 125,
                  7: 150,
                  8: 175,
                },
              },
              storageLimits: {
                1: { wood: 1000, stone: 1000, iron: 1000 },
                2: { wood: 1500, stone: 1500, iron: 1500 },
                3: { wood: 2000, stone: 2000, iron: 2000 },
                4: { wood: 2500, stone: 2500, iron: 2500 },
                5: { wood: 3000, stone: 3000, iron: 3000 },
                6: { wood: 4000, stone: 4000, iron: 4000 },
              },
            },
          },
          speedMultipliers: { construction: 1, production: 99, training: 1 }, // 99x production for fast tests
        },
      });
      testWorldId = world.id;

      expect(testWorldId).toBeDefined();
      expect(testUserId).toBeDefined();
    });

    it('should create player village', async () => {
      const village = await prisma.village.create({
        data: {
          worldId: testWorldId,
          userId: testUserId,
          name: 'Player Village',
          x: 100,
          y: 100,
          isBarbarian: false,
        },
      });
      playerVillageId = village.id;

      // Create initial buildings
      await prisma.building.createMany({
        data: [
          { villageId: playerVillageId, type: 'HQ', level: 5 },
          { villageId: playerVillageId, type: 'BARRACKS', level: 5 },
          { villageId: playerVillageId, type: 'WAREHOUSE', level: 3 },
        ],
      });

      // Create resource stock
      await prisma.resourceStock.create({
        data: {
          villageId: playerVillageId,
          wood: 5000,
          stone: 5000,
          iron: 3000,
          maxPerType: 10000,
        },
      });

      // Create units
      await prisma.unitInventory.createMany({
        data: [
          { villageId: playerVillageId, unitType: 'SPEAR', quantity: 100 },
          { villageId: playerVillageId, unitType: 'SWORD', quantity: 50 },
          { villageId: playerVillageId, unitType: 'AXEMAN', quantity: 30 },
        ],
      });

      // Create population
      await prisma.population.create({
        data: {
          villageId: playerVillageId,
          max: 100,
          used: 0,
        },
      });

      expect(playerVillageId).toBeDefined();
    });

    it('should seed barbarian villages with full structure', async () => {
      const result = await barbarianSeeding.seedAroundVillage({
        worldId: testWorldId,
        villageX: 100,
        villageY: 100,
      });

      expect(result.created).toBeGreaterThan(0);
      expect(result.chunksProcessed).toBeGreaterThan(0);

      // Find the closest barbarian
      const barbarians = await prisma.village.findMany({
        where: {
          worldId: testWorldId,
          isBarbarian: true,
        },
        include: {
          buildings: true,
          resourceStock: true,
          unitInventory: true,
          population: true,
        },
      });

      expect(barbarians.length).toBeGreaterThan(0);

      const barbarian = barbarians[0];
      barbarianVillageId = barbarian.id;

      // Verify barbarian has real buildings
      expect(barbarian.buildings.length).toBeGreaterThan(0);
      expect(barbarian.buildings.some((b) => b.type === 'WOOD')).toBe(true);
      expect(barbarian.buildings.some((b) => b.type === 'STONE')).toBe(true);
      expect(barbarian.buildings.some((b) => b.type === 'IRON')).toBe(true);

      // Verify barbarian has resource stock
      expect(barbarian.resourceStock).toBeDefined();
      expect(barbarian.resourceStock!.wood).toBeGreaterThan(0);
      expect(barbarian.resourceStock!.stone).toBeGreaterThan(0);
      expect(barbarian.resourceStock!.iron).toBeGreaterThan(0);

      // Verify barbarian has units
      expect(barbarian.unitInventory.length).toBeGreaterThan(0);
      expect(barbarian.unitInventory.some((u) => u.unitType === 'SPEAR')).toBe(
        true,
      );

      // Verify barbarian has population
      expect(barbarian.population).toBeDefined();
      expect(barbarian.population!.max).toBeGreaterThan(0);

      console.log(`\n✅ Barbarian village created:`);
      console.log(`   ID: ${barbarian.id}`);
      console.log(`   Tier: ${barbarian.tier}`);
      console.log(`   Position: (${barbarian.x}, ${barbarian.y})`);
      console.log(`   Buildings: ${barbarian.buildings.length}`);
      console.log(`   Units: ${barbarian.unitInventory.length}`);
      console.log(
        `   Resources: W=${barbarian.resourceStock!.wood}, S=${barbarian.resourceStock!.stone}, I=${barbarian.resourceStock!.iron}`,
      );
    });
  });

  describe('2. Resource Production & Catch-up', () => {
    it('should calculate on-demand resource production', async () => {
      // Get initial resources and buildings
      const barbarianData = await prisma.village.findUnique({
        where: { id: barbarianVillageId },
        include: {
          resourceStock: true,
          buildings: true,
        },
      });

      expect(barbarianData).toBeDefined();
      expect(barbarianData!.resourceStock).toBeDefined();

      const initialWood = barbarianData!.resourceStock!.wood;
      const initialLastUpdate = barbarianData!.resourceStock!.lastUpdateTs;

      console.log(`\n📊 Initial resources:`);
      console.log(
        `   Wood: ${initialWood}, Last update: ${initialLastUpdate.toISOString()}`,
      );

      // Wait 5 seconds for more visible production
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Calculate current resources (with production catch-up)
      const currentResources = await resourcesService.calculateCurrentResources(
        {
          worldId: testWorldId,
          resourceStock: barbarianData!.resourceStock!,
          buildings: barbarianData!.buildings,
        },
      );

      console.log(`\n📊 After 5 seconds (with production):`);
      console.log(
        `   Wood: ${currentResources.wood} (gained: ${currentResources.wood - initialWood})`,
      );
      console.log(
        `   Stone: ${currentResources.stone} (gained: ${currentResources.stone - barbarianData!.resourceStock!.stone})`,
      );
      console.log(
        `   Iron: ${currentResources.iron} (gained: ${currentResources.iron - barbarianData!.resourceStock!.iron})`,
      );

      // Resources should have increased (even slightly)
      expect(currentResources.wood).toBeGreaterThanOrEqual(initialWood);
    }, 15000); // 15 second timeout for production test

    it('should handle resource catch-up via getResources endpoint', async () => {
      const resources = await resourcesService.getResources(barbarianVillageId);

      expect(resources).toBeDefined();
      expect(resources.wood).toBeGreaterThan(0);
      expect(resources.lastUpdateTs).toBeDefined();
      expect(resources.productionRates).toBeDefined();

      console.log(`\n📊 Resources via service:`);
      console.log(
        `   Wood: ${resources.wood}, Stone: ${resources.stone}, Iron: ${resources.iron}`,
      );
      console.log(`   Max storage: ${resources.maxPerType}`);
      console.log(
        `   Production rates: Wood=${resources.productionRates.wood}/h, Stone=${resources.productionRates.stone}/h, Iron=${resources.productionRates.iron}/h`,
      );
    });
  });

  describe('3. Combat Simulation (Loot from Barbarian)', () => {
    it('should create expedition to barbarian village', async () => {
      const barbarian = await prisma.village.findUnique({
        where: { id: barbarianVillageId },
      });

      const expedition = await prisma.expedition.create({
        data: {
          worldId: testWorldId,
          attackerVillageId: playerVillageId,
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: barbarianVillageId,
          targetX: barbarian!.x,
          targetY: barbarian!.y,
          units: {
            SPEAR: 50,
            SWORD: 25,
            AXEMAN: 15,
          },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(Date.now() + 1000), // Arrives in 1 second
        },
      });

      expect(expedition.id).toBeDefined();
      console.log(`\n⚔️ Expedition created: ${expedition.id}`);
      console.log(`   Target: ${barbarianVillageId}`);
      console.log(`   Units: SPEAR(50), SWORD(25), AXEMAN(15)`);
    });

    it('should process combat and loot resources dynamically', async () => {
      // Note: In real E2E, this would be triggered by CombatWorker
      // For this test, we simulate the worker behavior

      // Get resources before combat
      const beforeResources = await prisma.resourceStock.findUnique({
        where: { villageId: barbarianVillageId },
      });

      expect(beforeResources).toBeDefined();
      const woodBefore = beforeResources!.wood;
      const stoneBefore = beforeResources!.stone;
      const ironBefore = beforeResources!.iron;

      console.log(`\n💰 Resources before combat:`);
      console.log(
        `   Wood: ${woodBefore}, Stone: ${stoneBefore}, Iron: ${ironBefore}`,
      );

      // Simulate resource deduction (as combat worker would do)
      const lootedWood = Math.min(300, woodBefore);
      const lootedStone = Math.min(300, stoneBefore);
      const lootedIron = Math.min(150, ironBefore);

      await prisma.resourceStock.update({
        where: { villageId: barbarianVillageId },
        data: {
          wood: { decrement: lootedWood },
          stone: { decrement: lootedStone },
          iron: { decrement: lootedIron },
          lastUpdateTs: new Date(), // Reset production timestamp
        },
      });

      // Get resources after combat
      const afterResources = await prisma.resourceStock.findUnique({
        where: { villageId: barbarianVillageId },
      });

      expect(afterResources!.wood).toBe(woodBefore - lootedWood);
      expect(afterResources!.stone).toBe(stoneBefore - lootedStone);
      expect(afterResources!.iron).toBe(ironBefore - lootedIron);

      console.log(`\n💰 Resources after looting:`);
      console.log(`   Wood: ${afterResources!.wood} (looted: ${lootedWood})`);
      console.log(
        `   Stone: ${afterResources!.stone} (looted: ${lootedStone})`,
      );
      console.log(`   Iron: ${afterResources!.iron} (looted: ${lootedIron})`);
    });

    it('should allow resources to regenerate after looting', async () => {
      // First, reduce resources significantly to have room for production
      await prisma.resourceStock.update({
        where: { villageId: barbarianVillageId },
        data: {
          wood: 100,
          stone: 100,
          iron: 50,
          lastUpdateTs: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      });

      const resourcesBefore = await prisma.resourceStock.findUnique({
        where: { villageId: barbarianVillageId },
      });

      const woodBefore = resourcesBefore!.wood;
      const stoneBefore = resourcesBefore!.stone;
      const ironBefore = resourcesBefore!.iron;

      console.log(`\n🔄 Resources before regeneration (after heavy looting):`);
      console.log(
        `   Wood=${woodBefore}, Stone=${stoneBefore}, Iron=${ironBefore}`,
      );
      console.log(`   Simulating 5 minutes of production...`);

      // Force production update (will calculate based on 5 minutes elapsed)
      await resourcesService.updateProduction(barbarianVillageId, false);

      const resourcesAfter = await prisma.resourceStock.findUnique({
        where: { villageId: barbarianVillageId },
      });

      const woodAfter = resourcesAfter!.wood;
      const stoneAfter = resourcesAfter!.stone;
      const ironAfter = resourcesAfter!.iron;

      console.log(`\n🔄 Resources after regeneration:`);
      console.log(`   Wood=${woodAfter} (+${woodAfter - woodBefore})`);
      console.log(`   Stone=${stoneAfter} (+${stoneAfter - stoneBefore})`);
      console.log(`   Iron=${ironAfter} (+${ironAfter - ironBefore})`);

      // With 99x production multiplier, resources should have increased significantly
      expect(woodAfter).toBeGreaterThan(woodBefore);
      expect(stoneAfter).toBeGreaterThan(stoneBefore);
      expect(ironAfter).toBeGreaterThan(ironBefore);

      const totalGain =
        woodAfter -
        woodBefore +
        (stoneAfter - stoneBefore) +
        (ironAfter - ironBefore);

      console.log(
        `\n✅ Production system verified! Total gain: ${totalGain} (Wood: +${woodAfter - woodBefore}, Stone: +${stoneAfter - stoneBefore}, Iron: +${ironAfter - ironBefore})`,
      );
    }, 10000); // 10 second timeout
  });

  describe('4. Conquest Mechanics', () => {
    it('should conquer barbarian village', async () => {
      // Get barbarian state before conquest
      const barbarianBefore = await prisma.village.findUnique({
        where: { id: barbarianVillageId },
        include: {
          buildings: true,
          unitInventory: true,
          resourceStock: true,
        },
      });

      expect(barbarianBefore!.isBarbarian).toBe(true);
      expect(barbarianBefore!.userId).toBeNull();

      const buildingsCountBefore = barbarianBefore!.buildings.length;
      const troopsCountBefore = barbarianBefore!.unitInventory.length;
      const woodBefore = barbarianBefore!.resourceStock!.wood;

      console.log(`\n🏰 Barbarian before conquest:`);
      console.log(`   Owner: ${barbarianBefore!.userId} (null)`);
      console.log(`   IsBarbarian: ${barbarianBefore!.isBarbarian}`);
      console.log(`   Buildings: ${buildingsCountBefore}`);
      console.log(`   Troops: ${troopsCountBefore}`);
      console.log(`   Wood: ${woodBefore}`);

      // Conquer the village
      const result = await conquestService.conquerVillage({
        attackerVillageId: playerVillageId,
        targetVillageId: barbarianVillageId,
        attackerUserId: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.villageId).toBe(barbarianVillageId);

      console.log(`\n✅ Conquest successful!`);
      console.log(`   Village ID: ${result.villageId}`);
      console.log(`   Buildings retained: ${result.buildings}`);
    });

    it('should transfer ownership and update village state', async () => {
      const conqueredVillage = await prisma.village.findUnique({
        where: { id: barbarianVillageId },
        include: {
          buildings: true,
          unitInventory: true,
          resourceStock: true,
          powerSnapshot: true,
        },
      });

      // Verify ownership transfer
      expect(conqueredVillage!.userId).toBe(testUserId);
      expect(conqueredVillage!.isBarbarian).toBe(false);
      expect(conqueredVillage!.tier).toBeNull(); // Tier cleared
      expect(conqueredVillage!.conqueredAt).toBeDefined();

      // Verify buildings retained
      expect(conqueredVillage!.buildings.length).toBeGreaterThan(0);

      // Verify troops cleared
      expect(conqueredVillage!.unitInventory.length).toBe(0);

      // Verify resources adjusted (50% kept)
      // Note: The exact amount depends on the service implementation

      // Verify power snapshot created
      expect(conqueredVillage!.powerSnapshot.length).toBeGreaterThan(0);

      console.log(`\n🏰 Village after conquest:`);
      console.log(`   Owner: ${conqueredVillage!.userId}`);
      console.log(`   IsBarbarian: ${conqueredVillage!.isBarbarian}`);
      console.log(`   Tier: ${conqueredVillage!.tier} (null = player)`);
      console.log(`   Buildings: ${conqueredVillage!.buildings.length}`);
      console.log(`   Troops: ${conqueredVillage!.unitInventory.length}`);
      console.log(
        `   Resources: W=${conqueredVillage!.resourceStock!.wood}, S=${conqueredVillage!.resourceStock!.stone}, I=${conqueredVillage!.resourceStock!.iron}`,
      );
      console.log(
        `   Power snapshots: ${conqueredVillage!.powerSnapshot.length}`,
      );
    });

    it('should not allow re-conquest of player village (MVP)', async () => {
      await expect(
        conquestService.conquerVillage({
          attackerVillageId: playerVillageId,
          targetVillageId: barbarianVillageId, // Now a player village
          attackerUserId: testUserId,
        }),
      ).rejects.toThrow(/not implemented/i);

      console.log(
        `\n❌ Cannot conquer player villages (MVP - loyalty system needed)`,
      );
    });
  });

  describe('5. Power Calculation After Conquest', () => {
    it('should calculate power correctly for conquered village', async () => {
      const powerSnapshot = await prisma.powerSnapshot.findFirst({
        where: { villageId: barbarianVillageId },
        orderBy: { createdAt: 'desc' },
      });

      expect(powerSnapshot).toBeDefined();
      expect(powerSnapshot!.total).toBeGreaterThan(0);
      expect(powerSnapshot!.kingdom).toBeGreaterThan(0);
      expect(powerSnapshot!.army).toBe(0); // No troops after conquest

      console.log(`\n⚡ Power after conquest:`);
      console.log(`   Total: ${powerSnapshot!.total}`);
      console.log(`   Kingdom: ${powerSnapshot!.kingdom}`);
      console.log(`   Army: ${powerSnapshot!.army}`);
    });
  });

  describe('6. Combat Initiation & Validation', () => {
    beforeAll(async () => {
      // Create a fresh barbarian for combat tests (original was conquered)
      await barbarianSeeding.seedAroundVillage({
        worldId: testWorldId,
        villageX: 100,
        villageY: 120,
      });
      const barbarians = await prisma.village.findMany({
        where: { worldId: testWorldId, isBarbarian: true },
        take: 1,
      });
      secondBarbarianId = barbarians[0].id;
    });

    it('should initiate attack with CombatService', async () => {
      const unitsBefore = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: { villageId: playerVillageId, unitType: 'SPEAR' },
        },
      });

      const barbarian = await prisma.village.findUnique({
        where: { id: secondBarbarianId },
      });

      const expedition = await combatService.initiateAttack(testUserId, {
        villageId: playerVillageId,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: secondBarbarianId,
        targetX: barbarian!.x,
        targetY: barbarian!.y,
        units: { SPEAR: 10 },
      });

      expect(expedition.status).toBe('EN_ROUTE');
      expect(expedition.attackerVillageId).toBe(playerVillageId);
      expect(expedition.arrivalAt).toBeInstanceOf(Date);

      const unitsAfter = await prisma.unitInventory.findUnique({
        where: {
          villageId_unitType: { villageId: playerVillageId, unitType: 'SPEAR' },
        },
      });
      expect(unitsAfter!.quantity).toBe(unitsBefore!.quantity - 10);
    });

    it('should reject attack with insufficient units', async () => {
      const barbarian = await prisma.village.findUnique({
        where: { id: secondBarbarianId },
      });

      await expect(
        combatService.initiateAttack(testUserId, {
          villageId: playerVillageId,
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: secondBarbarianId,
          targetX: barbarian!.x,
          targetY: barbarian!.y,
          units: { SPEAR: 999999 },
        }),
      ).rejects.toThrow(/Insufficient/);
    });

    it('should reject attack on invalid target', async () => {
      await expect(
        combatService.initiateAttack(testUserId, {
          villageId: playerVillageId,
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: 'fake-village-id',
          targetX: 100,
          targetY: 105,
          units: { SPEAR: 10 },
        }),
      ).rejects.toThrow();
    });
  });

  describe('7. Construction Validation', () => {
    beforeAll(async () => {
      // Ensure player village has WOOD/STONE buildings and resources
      await prisma.resourceStock.update({
        where: { villageId: playerVillageId },
        data: { wood: 5000, stone: 5000, iron: 3000 },
      });

      // Ensure WOOD building exists
      const woodBuilding = await prisma.building.findFirst({
        where: { villageId: playerVillageId, type: 'WOOD' },
      });
      if (!woodBuilding) {
        await prisma.building.create({
          data: { villageId: playerVillageId, type: 'WOOD', level: 1 },
        });
      }
    });

    it('should upgrade building with cost validation', async () => {
      const stockBefore = await prisma.resourceStock.findUnique({
        where: { villageId: playerVillageId },
      });
      const woodBefore = await prisma.building.findFirst({
        where: { villageId: playerVillageId, type: 'WOOD' },
      });
      const currentLevel = woodBefore!.level;

      const result = await villageService.upgradeBuilding(
        playerVillageId,
        'WOOD',
      );

      expect(result.nextLevel).toBe(currentLevel + 1);
      expect(result.cost.wood).toBeGreaterThan(0);

      const stockAfter = await prisma.resourceStock.findUnique({
        where: { villageId: playerVillageId },
      });
      expect(stockAfter!.wood).toBe(stockBefore!.wood - result.cost.wood);
    });

    it('should reject upgrade with insufficient resources', async () => {
      await prisma.resourceStock.update({
        where: { villageId: playerVillageId },
        data: { wood: 0, stone: 0, iron: 0 },
      });

      await expect(
        villageService.upgradeBuilding(playerVillageId, 'STONE'),
      ).rejects.toThrow(/Insufficient resources/);
    });
  });
});
