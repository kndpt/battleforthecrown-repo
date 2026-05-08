import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { VillageStrategyService } from '../src/modules/strategy/village-strategy.service';
import { PopulationService } from '../src/modules/population/population.service';
import { ResourcesService } from '../src/modules/resources/resources.service';
import { ArmyService } from '../src/modules/army/army.service';

/**
 * Intégration: Changement de stratégie de village
 *
 * Vérifie:
 * - Débits de couronnes et cooldown
 * - Blocage pendant le cooldown
 * - Erreur sur fond de couronnes insuffisant
 */
describe('Village Strategy Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let strategyService: VillageStrategyService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let populationService: PopulationService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let resourcesService: ResourcesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let armyService: ArmyService;

  let worldId: string;
  let userId: string;
  let villageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    strategyService = app.get(VillageStrategyService);
    populationService = app.get(PopulationService);
    resourcesService = app.get(ResourcesService);
    armyService = app.get(ArmyService);

    // Crée un monde minimal (la WorldConfigService appliquera les valeurs par défaut
    // dont villageStrategy: baseChangeCost=100, cooldownDuration=24h, stratégies...)
    const world = await prisma.world.create({
      data: {
        id: `test-village-strategy-${Date.now()}`,
        name: 'Test Village Strategy World',
        status: 'OPEN',
        config: {},
        speedMultipliers: { construction: 1, production: 1, training: 1 },
      },
    });
    worldId = world.id;

    // Crée un utilisateur
    const user = await prisma.user.create({
      data: {
        email: `test-village-strategy-${Date.now()}@test.com`,
        password: 'test123',
      },
    });
    userId = user.id;

    // Crée un village joueur
    const village = await prisma.village.create({
      data: {
        worldId,
        userId,
        name: 'Village Strategy',
        x: 200,
        y: 200,
        isBarbarian: false,
      },
    });
    villageId = village.id;

    // Crée les bâtiments pour les tests
    await prisma.building.create({
      data: { villageId, type: 'BARRACKS', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'WOOD', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'STONE', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'IRON', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'FARM', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'WAREHOUSE', level: 1 },
    });

    // Crée les ressources
    await prisma.resourceStock.create({
      data: {
        villageId,
        wood: 5000,
        stone: 5000,
        iron: 3000,
        maxPerType: 10000,
      },
    });

    // Crée la population
    await prisma.population.create({
      data: { villageId, max: 250, used: 68 },
    });

    // Approvisionne le solde de couronnes pour permettre le changement
    await prisma.crownBalance.create({
      data: {
        userId,
        worldId,
        balance: 500,
      },
    });

    // Initialise une config de stratégie existante pour que le premier changement ne soit pas gratuit
    // et pour éviter la pénalité (+50%) en le datant à >24h
    await prisma.villageStrategyConfig.create({
      data: {
        villageId,
        strategy: 'BALANCED',
        lastChangedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48h
        changeCost: 100,
        cooldownEndsAt: null,
      },
    });
  });

  afterAll(async () => {
    if (worldId) {
      await prisma.village.deleteMany({ where: { worldId } });
      await prisma.world.delete({ where: { id: worldId } });
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('devrait changer la stratégie et débiter les couronnes', async () => {
    const beforeBalance = await prisma.crownBalance.findUnique({
      where: { userId_worldId: { userId, worldId } },
    });
    expect(beforeBalance).toBeDefined();

    const now = Date.now();
    const res = await strategyService.changeStrategy(
      villageId,
      'ECONOMIC',
      userId,
    );

    // Résultat
    expect(res.success).toBe(true);
    expect(res.newStrategy).toBe('ECONOMIC');
    expect(res.cost).toBe(100); // base cost sans pénalité
    expect(new Date(res.cooldownEndsAt).getTime()).toBeGreaterThan(now);

    // Solde de couronnes débité
    const afterBalance = await prisma.crownBalance.findUnique({
      where: { userId_worldId: { userId, worldId } },
    });
    expect(afterBalance!.balance).toBe(beforeBalance!.balance - 100);

    // Config de stratégie mise à jour
    const cfg = await prisma.villageStrategyConfig.findUnique({
      where: { villageId },
    });
    expect(cfg!.strategy).toBe('ECONOMIC');
    expect(cfg!.cooldownEndsAt).toBeTruthy();
    expect(cfg!.changeCost).toBe(100);
  });

  it('devrait refuser un changement pendant le cooldown', async () => {
    await expect(
      strategyService.changeStrategy(villageId, 'RAIDERS', userId),
    ).rejects.toThrow(/cooldown/i);
  });

  it('devrait refuser le changement sur couronnes insuffisantes quand cooldown terminé', async () => {
    // Fin de cooldown
    await prisma.villageStrategyConfig.update({
      where: { villageId },
      data: { cooldownEndsAt: new Date(Date.now() - 1000) },
    });
    // Met solde à 0
    await prisma.crownBalance.update({
      where: { userId_worldId: { userId, worldId } },
      data: { balance: 0 },
    });

    await expect(
      strategyService.changeStrategy(villageId, 'FORTRESS', userId),
    ).rejects.toThrow(/insufficient crowns/i);
  });
});

describe('Village Strategy - Bonus Application', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let strategyService: VillageStrategyService;
  let populationService: PopulationService;
  let resourcesService: ResourcesService;
  let armyService: ArmyService;

  let worldId: string;
  let userId: string;
  let villageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    strategyService = app.get(VillageStrategyService);
    populationService = app.get(PopulationService);
    resourcesService = app.get(ResourcesService);
    armyService = app.get(ArmyService);

    // Crée un monde avec config complète
    const world = await prisma.world.create({
      data: {
        id: `test-bonus-strategy-${Date.now()}`,
        name: 'Test Bonus Strategy World',
        status: 'OPEN',
        config: {
          units: {
            costs: {
              MILITIA: {
                wood: 50,
                stone: 30,
                iron: 10,
                population: 1,
                time: 30,
                requiredBarracksLevel: 1,
              },
            },
            stats: {},
          },
          resources: {
            productionRates: {
              WOOD: { 1: 50 },
              STONE: { 1: 40 },
              IRON: { 1: 30 },
            },
            storageLimits: {
              1: { wood: 10000, stone: 10000, iron: 10000 },
            },
          },
          multipliers: {
            construction: 1,
            production: 1,
            training: 10,
          },
          villageStrategy: {
            baseChangeCost: 100,
            cooldownDuration: 24,
            strategies: {
              FORTRESS: {
                strategy: 'FORTRESS',
                displayName: 'Forteresse',
                description: 'Village défensif',
                bonuses: {
                  armySpeedBonus: 0.8,
                  defenseBonus: 1.25,
                  storageBonus: 1.1,
                },
              },
              RAIDERS: {
                strategy: 'RAIDERS',
                displayName: 'Raiders',
                description: 'Village offensif',
                bonuses: {
                  defenseBonus: 0.9,
                  lootBonus: 1.1,
                  armySpeedBonus: 1.15,
                  unitCostReduction: 0.8,
                },
              },
              ECONOMIC: {
                strategy: 'ECONOMIC',
                displayName: 'Économique',
                description: 'Village axé production',
                bonuses: {
                  defenseBonus: 0.9,
                  attackBonus: 0.9,
                  productionBonus: { WOOD: 1.2, STONE: 1.2, IRON: 1.2 },
                  populationBonus: 1.1,
                },
              },
              BALANCED: {
                strategy: 'BALANCED',
                displayName: 'Équilibré',
                description: 'Sans bonus',
                bonuses: {},
              },
            },
          },
        },
        speedMultipliers: { construction: 1, production: 1, training: 10 },
      },
    });
    worldId = world.id;

    // Crée un utilisateur
    const user = await prisma.user.create({
      data: {
        email: `test-bonus-strategy-${Date.now()}@test.com`,
        password: 'test123',
      },
    });
    userId = user.id;

    // Crée un village joueur
    const village = await prisma.village.create({
      data: {
        worldId,
        userId,
        name: 'Bonus Strategy Village',
        x: 300,
        y: 300,
        isBarbarian: false,
      },
    });
    villageId = village.id;

    // Crée les bâtiments
    await prisma.building.create({
      data: { villageId, type: 'BARRACKS', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'WOOD', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'STONE', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'IRON', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'FARM', level: 1 },
    });
    await prisma.building.create({
      data: { villageId, type: 'WAREHOUSE', level: 1 },
    });

    // Crée les ressources
    await prisma.resourceStock.create({
      data: {
        villageId,
        wood: 5000,
        stone: 5000,
        iron: 3000,
        maxPerType: 10000,
      },
    });

    // Crée la population
    await prisma.population.create({
      data: { villageId, max: 250, used: 68 },
    });
  });

  afterAll(async () => {
    if (worldId) {
      await prisma.village.deleteMany({ where: { worldId } });
      await prisma.world.delete({ where: { id: worldId } });
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('Population Bonus', () => {
    beforeEach(async () => {
      // ECONOMIC strategy: +10% population bonus
      await prisma.villageStrategyConfig.create({
        data: {
          villageId,
          strategy: 'ECONOMIC',
          lastChangedAt: new Date(),
          changeCost: 0,
        },
      });
    });

    afterEach(async () => {
      await prisma.villageStrategyConfig.deleteMany({
        where: { villageId },
      });
    });

    it('devrait appliquer le bonus de population ECONOMIC (+10%)', async () => {
      const population = await populationService.getPopulation(villageId);
      // Base: 250 * 1.1 = 275
      expect(population.max).toBe(275);
      expect(population.available).toBe(275 - 68); // 207
    });

    it('devrait retirer le bonus quand la stratégie devient BALANCED', async () => {
      await prisma.villageStrategyConfig.update({
        where: { villageId },
        data: { strategy: 'BALANCED' },
      });

      const population = await populationService.getPopulation(villageId);
      expect(population.max).toBe(250);
    });
  });

  describe('Production Bonus', () => {
    beforeEach(async () => {
      // ECONOMIC strategy: +20% production bonus
      await prisma.villageStrategyConfig.create({
        data: {
          villageId,
          strategy: 'ECONOMIC',
          lastChangedAt: new Date(),
          changeCost: 0,
        },
      });
    });

    afterEach(async () => {
      await prisma.villageStrategyConfig.deleteMany({
        where: { villageId },
      });
    });

    it('devrait appliquer le bonus de production ECONOMIC (+20%)', async () => {
      const rates = await resourcesService.getProductionRates(villageId);
      // ECONOMIC: +25% on all resources
      expect(rates.wood).toBeGreaterThan(0);
      expect(rates.stone).toBeGreaterThan(0);
      expect(rates.iron).toBeGreaterThan(0);
      // Rates should be base * 1.2
      expect(rates.wood).toBe(50 * 60 * 1.2);
      expect(rates.stone).toBe(40 * 60 * 1.2);
      expect(rates.iron).toBe(30 * 60 * 1.2);
    });
  });

  describe('Storage Bonus', () => {
    beforeEach(async () => {
      await prisma.villageStrategyConfig.create({
        data: {
          villageId,
          strategy: 'FORTRESS',
          lastChangedAt: new Date(),
          changeCost: 0,
        },
      });
      await prisma.resourceStock.update({
        where: { villageId },
        data: {
          maxPerType: 10000,
          lastUpdateTs: new Date(Date.now() - 60 * 1000),
        },
      });
    });

    afterEach(async () => {
      await prisma.villageStrategyConfig.deleteMany({
        where: { villageId },
      });
    });

    it("devrait appliquer le bonus de stockage FORTERESSE (+10 %) lors de l'update", async () => {
      const updated = await resourcesService.updateProduction(villageId, false);
      expect(updated.maxPerType).toBe(Math.floor(10000 * 1.1));
    });
  });

  describe('Training Speed Bonus', () => {
    beforeEach(async () => {
      // RAIDERS strategy: training speed neutral
      await prisma.villageStrategyConfig.create({
        data: {
          villageId,
          strategy: 'RAIDERS',
          lastChangedAt: new Date(),
          changeCost: 0,
        },
      });
    });

    afterEach(async () => {
      await prisma.villageStrategyConfig.deleteMany({
        where: { villageId },
      });
      await prisma.unitTraining.deleteMany({
        where: { villageId },
      });
    });

    it("devrait appliquer la vitesse d'entraînement RAIDERS (neutre)", async () => {
      const training = await armyService.trainUnits(villageId, 'MILITIA', 1);
      // Base: 30s / (world_multiplier * strategy_multiplier)
      // 30 / (10 * 1.0) = 3 seconds = 3000ms
      expect(training.timePerUnitMs).toBe(3000);
    });
  });

  describe('Training Cost Bonus', () => {
    beforeEach(async () => {
      await prisma.villageStrategyConfig.create({
        data: {
          villageId,
          strategy: 'RAIDERS',
          lastChangedAt: new Date(),
          changeCost: 0,
        },
      });
      await prisma.resourceStock.update({
        where: { villageId },
        data: { wood: 5000, stone: 5000, iron: 5000 },
      });
      await prisma.unitTraining.deleteMany({ where: { villageId } });
    });

    afterEach(async () => {
      await prisma.villageStrategyConfig.deleteMany({
        where: { villageId },
      });
      await prisma.unitTraining.deleteMany({ where: { villageId } });
    });

    it('devrait réduire les coûts de ressources selon unitCostReduction', async () => {
      const quantity = 4;
      await armyService.trainUnits(villageId, 'MILITIA', quantity);

      const stock = await prisma.resourceStock.findUnique({
        where: { villageId },
      });

      const reducedWoodCost = Math.floor(50 * 0.8);
      const reducedStoneCost = Math.floor(30 * 0.8);
      const reducedIronCost = Math.floor(10 * 0.8);

      expect(stock?.wood).toBe(5000 - reducedWoodCost * quantity);
      expect(stock?.stone).toBe(5000 - reducedStoneCost * quantity);
      expect(stock?.iron).toBe(5000 - reducedIronCost * quantity);
    });
  });

  describe('Strategy Recommendations', () => {
    it('devrait retourner les recommandations pour les 4 stratégies', async () => {
      const recommendations =
        await strategyService.getStrategyRecommendations(villageId);

      expect(Object.keys(recommendations)).toHaveLength(4);
      expect(recommendations).toHaveProperty('FORTRESS');
      expect(recommendations).toHaveProperty('RAIDERS');
      expect(recommendations).toHaveProperty('ECONOMIC');
      expect(recommendations).toHaveProperty('BALANCED');
    });

    it('devrait inclure les bonus clés de stratégie FORTRESS', async () => {
      const recommendations =
        await strategyService.getStrategyRecommendations(villageId);
      // Selon la vérité du doc: -20% vitesse d'armée pour FORTRESS
      expect(recommendations.FORTRESS.keyBonuses["Vitesse d'armée"]).toBe(
        '-20%',
      );
    });
  });
});
