#!/usr/bin/env ts-node
/**
 * E2E Test: Create 100 players with villages and visualize distribution
 * Attention: La config du world n'est pas bonne par defaut. Dans ce cas, il prendre celle d'un world existant.
 *
 * Usage:
 *   npm run test:village-placement
 *   or
 *   ts-node scripts/test-village-placement-100.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { JoinWorldUseCase } from '../src/modules/world/join-world.use-case';
import { VillagePlacementService } from '../src/modules/world/village-placement.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting village placement E2E test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const joinWorldUseCase = app.get(JoinWorldUseCase);
  const villagePlacementService = app.get(VillagePlacementService);
  const prisma = app.get(PrismaService);

  const WORLD_ID = 'test-placement-world';
  const NUM_PLAYERS = 100;

  try {
    // 1. Clean up previous test data
    console.log('🧹 Cleaning up previous test data...');
    await prisma.village.deleteMany({ where: { worldId: WORLD_ID } });
    await prisma.worldEntity.deleteMany({ where: { worldId: WORLD_ID } });
    await prisma.worldMembership.deleteMany({ where: { worldId: WORLD_ID } });
    await prisma.zoneCapacity.deleteMany({ where: { worldId: WORLD_ID } });
    await prisma.chunkSpawnState.deleteMany({ where: { worldId: WORLD_ID } });
    await prisma.world.deleteMany({ where: { id: WORLD_ID } });

    // Delete test users
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test-player-' } },
    });

    // 2. Create test world
    console.log('🌍 Creating test world...');
    await prisma.world.create({
      data: {
        id: WORLD_ID,
        name: 'Test Placement World',
        status: 'OPEN',
        gridWidth: 500,
        gridHeight: 500,
        config: {
          buildings: {
            maxQueue: 3,
            unlockRequirements: {},
            enabled: {},
            maxLevels: {},
            costs: {},
            times: {},
          },
          castle: { constructionSpeedBonus: { 1: 1.0 } },
          units: { costs: {} },
          resources: {
            productionRates: {},
            storageLimits: {
              0: { wood: 1000, stone: 1000, iron: 1000 },
              1: { wood: 1000, stone: 1000, iron: 1000 },
            },
          },
          population: { limits: { 0: 250, 1: 250 } },
          watchtower: { vision: {} },
          power: {
            buildingWeights: {},
            unitSoftCapThreshold: 1000,
            unitSoftCapDecay: 0.5,
            defaultWeights: { kingdom: 1, army: 1 },
          },
          tempo: { global: 1 },
          // Enable centralized placement
          playerVillagePlacement: {
            enabled: true,
            minSpacing: 3,
            zones: [
              { minRadius: 0, maxRadius: 30, maxVillages: 15 },
              { minRadius: 30, maxRadius: 60, maxVillages: 30 },
              { minRadius: 60, maxRadius: 90, maxVillages: 45 },
              { minRadius: 90, maxRadius: 120, maxVillages: 60 },
              { minRadius: 120, maxRadius: 150, maxVillages: 80 },
              { minRadius: 150, maxRadius: 200, maxVillages: 120 },
              { minRadius: 200, maxRadius: 999, maxVillages: 10000 },
            ],
          },
          // Enable barbarian seeding
          barbarianSeeding: {
            enabled: true,
            chunkSize: 50,
            rMin: 8,
            rMax: 40,
            targetMin: 3,
            targetMax: 6,
            minSpacing: 6,
            playerExclusion: 2,
            seedVersion: 1,
            tiers: {
              T1: {
                minPoints: 550,
                maxPoints: 750,
                buildingRatio: 0.7,
                loot: {
                  wood: { min: 200, max: 400 },
                  stone: { min: 200, max: 400 },
                  iron: { min: 100, max: 250 },
                },
                visibleIndexNoise: 0.08,
              },
              T2: {
                minPoints: 1200,
                maxPoints: 1600,
                buildingRatio: 0.6,
                loot: {
                  wood: { min: 600, max: 1000 },
                  stone: { min: 600, max: 1000 },
                  iron: { min: 400, max: 700 },
                },
                visibleIndexNoise: 0.1,
              },
              T3: {
                minPoints: 2500,
                maxPoints: 3200,
                buildingRatio: 0.5,
                loot: {
                  wood: { min: 1500, max: 2500 },
                  stone: { min: 1500, max: 2500 },
                  iron: { min: 1000, max: 1800 },
                },
                visibleIndexNoise: 0.12,
              },
            },
            tierRanges: [
              { minDistance: 8, maxDistance: 20, tier: 'T1' },
              { minDistance: 20, maxDistance: 30, tier: 'T2' },
              { minDistance: 30, maxDistance: 40, tier: 'T3' },
            ],
          },
        },
      },
    });

    // 3. Create users and villages
    console.log(`👥 Creating ${NUM_PLAYERS} players and villages...\n`);
    const hashedPassword = await bcrypt.hash('test123', 10);

    for (let i = 1; i <= NUM_PLAYERS; i++) {
      const email = `test-player-${i}@example.com`;
      const villageName = `Village ${i}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // Join world (creates village with centralized placement)
      try {
        await joinWorldUseCase.execute({
          userId: user.id,
          worldId: WORLD_ID,
          villageName,
        });

        if (i % 10 === 0) {
          console.log(`✅ Created ${i}/${NUM_PLAYERS} players...`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to create village for player ${i}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    // Wait for barbarian seeding to complete (async operations)
    console.log('\n⏳ Waiting for barbarian seeding to complete...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 4. Gather statistics
    console.log('\n📊 Gathering statistics...\n');

    const villages = await prisma.village.findMany({
      where: { worldId: WORLD_ID },
      include: { user: { select: { email: true } } },
    });

    const barbarianVillages = await prisma.worldEntity.findMany({
      where: { worldId: WORLD_ID, kind: 'BARBARIAN_VILLAGE' },
    });

    const zoneStats = await villagePlacementService.getZoneStatistics(WORLD_ID);

    // 5. Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('                    TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Total Players Created: ${villages.length}/${NUM_PLAYERS}`);
    console.log(`Total Barbarian Villages: ${barbarianVillages.length}\n`);

    // Zone distribution
    console.log('Zone Distribution:');
    console.log('─────────────────────────────────────────────────────');
    if (zoneStats.enabled && zoneStats.zones) {
      zoneStats.zones.forEach((zone) => {
        const bar = '█'.repeat(Math.floor(zone.utilization / 2));
        console.log(
          `Zone ${zone.zoneIndex} (r=${zone.minRadius.toString().padStart(3)}-${zone.maxRadius.toString().padEnd(3)}): ${zone.currentCount.toString().padStart(3)}/${zone.maxVillages.toString().padEnd(4)} [${zone.utilization.toFixed(1).padStart(5)}%] ${bar}`,
        );
      });
    }

    // Distance from center statistics
    const centerX = 250;
    const centerY = 250;
    const distances = villages.map((v) =>
      Math.hypot(v.x - centerX, v.y - centerY),
    );
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    console.log('\nDistance from Center (250, 250):');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Average: ${avgDistance.toFixed(2)}`);
    console.log(`Min: ${minDistance.toFixed(2)}`);
    console.log(`Max: ${maxDistance.toFixed(2)}`);

    // Spacing validation
    console.log('\nSpacing Validation:');
    console.log('─────────────────────────────────────────────────────');
    let minSpacing = Infinity;
    let violations = 0;
    const MIN_REQUIRED = 3;

    for (let i = 0; i < villages.length; i++) {
      for (let j = i + 1; j < villages.length; j++) {
        const dist = Math.hypot(
          villages[i].x - villages[j].x,
          villages[i].y - villages[j].y,
        );
        if (dist < minSpacing) minSpacing = dist;
        if (dist < MIN_REQUIRED) violations++;
      }
    }

    console.log(`Minimum spacing found: ${minSpacing.toFixed(2)}`);
    console.log(`Spacing violations (< ${MIN_REQUIRED}): ${violations}`);

    // Barbarian tier distribution
    const tierCounts: Record<string, number> = {};
    barbarianVillages.forEach((bv) => {
      const tier = (bv.data as any)?.tier || 'unknown';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });

    console.log('\nBarbarian Village Tiers:');
    console.log('─────────────────────────────────────────────────────');
    Object.entries(tierCounts)
      .sort()
      .forEach(([tier, count]) => {
        console.log(`${tier}: ${count}`);
      });

    // 6. Generate ASCII map visualization
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                   MAP VISUALIZATION');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(
      'Legend: P = Player Village, B = Barbarian Village, . = Empty\n',
    );

    const SCALE = 10; // 1 char = 10 tiles
    const MAP_SIZE = 500 / SCALE;
    const map: string[][] = Array(MAP_SIZE)
      .fill(null)
      .map(() => Array(MAP_SIZE).fill('.'));

    // Mark center
    map[Math.floor(MAP_SIZE / 2)][Math.floor(MAP_SIZE / 2)] = '+';

    // Add player villages
    villages.forEach((v) => {
      const x = Math.floor(v.x / SCALE);
      const y = Math.floor(v.y / SCALE);
      if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
        map[y][x] = 'P';
      }
    });

    // Add barbarian villages (only if not already occupied)
    barbarianVillages.forEach((bv) => {
      const x = Math.floor(bv.x / SCALE);
      const y = Math.floor(bv.y / SCALE);
      if (
        x >= 0 &&
        x < MAP_SIZE &&
        y >= 0 &&
        y < MAP_SIZE &&
        map[y][x] === '.'
      ) {
        map[y][x] = 'b';
      }
    });

    // Print map
    map.forEach((row) => console.log(row.join(' ')));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Test completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');

    // Export data for further analysis
    const exportData = {
      playerVillages: villages.map((v) => ({
        x: v.x,
        y: v.y,
        name: v.name,
        email: v.user?.email || 'N/A',
        distanceFromCenter: Math.hypot(v.x - centerX, v.y - centerY),
      })),
      barbarianVillages: barbarianVillages.map((bv) => ({
        x: bv.x,
        y: bv.y,
        tier: (bv.data as any)?.tier,
      })),
      statistics: {
        totalPlayers: villages.length,
        totalBarbarians: barbarianVillages.length,
        avgDistanceFromCenter: avgDistance,
        minSpacing,
        spacingViolations: violations,
        zoneStats,
      },
    };

    // Write to file
    const fs = require('fs');
    fs.writeFileSync(
      './test-results-village-placement.json',
      JSON.stringify(exportData, null, 2),
    );
    console.log(
      '📁 Detailed results exported to: test-results-village-placement.json\n',
    );
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    await app.close();
  }
}

main()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
