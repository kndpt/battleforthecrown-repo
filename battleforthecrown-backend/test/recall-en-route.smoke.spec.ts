import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  truncateAll,
  waitFor,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

describe('recall en-route smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('full flow: attack → recall en-route → return home', async () => {
    const world = await ctx.prisma.world.create({
      data: {
        id: `recall-smoke-${Date.now()}`,
        name: 'Recall Smoke',
        status: 'OPEN',
        config: { ...SMOKE_WORLD_CONFIG, fogOfWar: { enabled: false } } as any,
      },
    });

    // 1. Setup Player A (Attacker)
    const userA = await registerUser(ctx.server, 'a' + Date.now());
    const joinA = (await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'village-a',
    )) as any;
    const villageAId = joinA.village.id;

    // 2. Give Player A some units
    await ctx.prisma.unitInventory.create({
      data: { villageId: villageAId, unitType: 'MILITIA', quantity: 100 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 100, max: 200 },
    });

    // 3. Setup Target (Barbarian)
    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        name: 'Barbarian',
        x: joinA.village.x + 10, // Far enough to have time to recall
        y: joinA.village.y + 10,
        isBarbarian: true,
      },
    });

    // 4. Player A attacks Barbarian
    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 100 },
      });
    expect(attackRes.status).toBeLessThan(300);
    const expeditionId = (attackRes.body as { id: string }).id;

    // 5. Recall en-route immediately
    const recallRes = await request(ctx.server)
      .post(`/combat/recall/${expeditionId}`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(recallRes.status).toBeLessThan(300);
    const recallBody = recallRes.body as { recalled: boolean; status: string };
    expect(recallBody.recalled).toBe(true);
    expect(recallBody.status).toBe('RETURNING');

    // 6. Verify expedition status in DB
    const expedition = await ctx.prisma.expedition.findUnique({
      where: { id: expeditionId },
    });
    expect(expedition?.recalled).toBe(true);
    expect(expedition?.status).toBe('RETURNING');
    // 7. Wait for return to A
    // Since we recalled immediately, returnAt should be very soon (elapsed time is small)
    await waitFor(
      async () => {
        const inv = await ctx.prisma.unitInventory.findUnique({
          where: {
            villageId_unitType: {
              villageId: villageAId,
              unitType: 'MILITIA',
            },
          },
        });
        return inv?.quantity === 100;
      },
      { timeoutMs: 30_000 },
    );

    // 8. Verify expedition is deleted after return
    const expeditionAfter = await ctx.prisma.expedition.findUnique({
      where: { id: expeditionId },
    });
    expect(expeditionAfter).toBeNull();

    // 9. Verify no combat report was created
    const reports = await ctx.prisma.combatReport.findMany({
      where: { attackerVillageId: villageAId },
    });
    expect(reports.length).toBe(0);
  }, 60_000);
});
