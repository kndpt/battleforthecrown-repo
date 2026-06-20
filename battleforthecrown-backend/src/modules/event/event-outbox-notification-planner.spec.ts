import {
  planNotifications,
  type NotificationPlannerDeps,
} from './event-outbox-notification-planner';

function makeDeps(overrides?: {
  villageOwners?: Record<string, string | null>;
  conquestAttackers?: Record<string, string | null>;
}): NotificationPlannerDeps {
  const villageOwners = overrides?.villageOwners ?? {};
  const conquestAttackers = overrides?.conquestAttackers ?? {};
  return {
    villageUserIdCache: new Map(),
    getUserIdByVillage: (villageId) =>
      Promise.resolve(
        Object.prototype.hasOwnProperty.call(villageOwners, villageId)
          ? villageOwners[villageId]
          : null,
      ),
    getAttackerUserIdByConquest: (pendingConquestId) =>
      Promise.resolve(conquestAttackers[pendingConquestId] ?? null),
  };
}

describe('planNotifications', () => {
  describe('userByVillage', () => {
    it('routes building.completed to the village owner', async () => {
      const deps = makeDeps({ villageOwners: { v1: 'u1' } });
      const plans = await planNotifications(
        'building.completed',
        {
          buildingId: 'b1',
          villageId: 'v1',
          buildingType: 'CASTLE',
          level: 2,
        },
        deps,
      );
      expect(plans).toEqual([
        {
          recipient: { kind: 'user', id: 'u1' },
          payload: {
            buildingId: 'b1',
            villageId: 'v1',
            buildingType: 'CASTLE',
            level: 2,
          },
        },
      ]);
    });

    it('emits nothing when the village has no owner', async () => {
      const deps = makeDeps({ villageOwners: { v1: null } });
      const plans = await planNotifications(
        'resources.changed',
        {
          villageId: 'v1',
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: 0,
          lastUpdateTs: '2026-06-17T00:00:00Z',
          productionRates: { wood: 0, stone: 0, iron: 0 },
        },
        deps,
      );
      expect(plans).toEqual([]);
    });
  });

  describe('usersByVillages', () => {
    it('deduplicates recipients when both villages share an owner', async () => {
      const deps = makeDeps({
        villageOwners: { v1: 'u1', v2: 'u1' },
      });
      const plans = await planNotifications(
        'caravan.arrived',
        {
          expeditionId: 'e1',
          villageId: 'v1',
          targetVillageId: 'v2',
          credited: { wood: 1, stone: 0, iron: 0 },
          lost: { wood: 0, stone: 0, iron: 0 },
          returnAt: '2026-06-17T00:00:00Z',
        },
        deps,
      );
      expect(plans).toHaveLength(1);
      expect(plans[0].recipient).toEqual({ kind: 'user', id: 'u1' });
    });

    it('emits to two distinct owners', async () => {
      const deps = makeDeps({
        villageOwners: { v1: 'u1', v2: 'u2' },
      });
      const plans = await planNotifications(
        'reinforcement.returned',
        {
          expeditionId: 'e1',
          villageId: 'v1',
          originVillageId: 'v3',
          hostVillageId: 'v2',
          units: { MILITIA: 1 },
        },
        deps,
      );
      const ids = plans.map((plan) =>
        plan.recipient.kind === 'user' ? plan.recipient.id : null,
      );
      expect(ids).toEqual(expect.arrayContaining(['u1', 'u2']));
      expect(ids).toHaveLength(2);
    });
  });

  describe('directUser / directWorld', () => {
    it('routes crowns.changed to payload.userId', async () => {
      const deps = makeDeps();
      const plans = await planNotifications(
        'crowns.changed',
        {
          userId: 'u9',
          worldId: 'w1',
          balance: 0,
          productionRate: 0,
          lastUpdateTs: '2026-06-17T00:00:00Z',
        },
        deps,
      );
      expect(plans).toEqual([
        {
          recipient: { kind: 'user', id: 'u9' },
          payload: expect.objectContaining({ userId: 'u9' }),
        },
      ]);
    });

    it('routes rankings.changed to a world room', async () => {
      const deps = makeDeps();
      const plans = await planNotifications(
        'rankings.changed',
        {
          worldId: 'w1',
          signal: 'ASSAULT_GLORY',
          scorerUserId: 'u1',
          opponentUserId: 'u2',
          points: 10,
          combatReportId: 'r1',
          occurredAt: '2026-06-17T00:00:00Z',
        },
        deps,
      );
      expect(plans).toEqual([
        {
          recipient: { kind: 'world', id: 'w1' },
          payload: expect.objectContaining({ worldId: 'w1' }),
        },
      ]);
    });

    it('routes world.status.changed as a world broadcast', async () => {
      const plans = await planNotifications(
        'world.status.changed',
        {
          worldId: 'w1',
          from: 'PLANNED',
          to: 'OPEN',
          at: '2026-06-17T00:00:00Z',
        },
        makeDeps(),
      );
      expect(plans[0].recipient).toEqual({ kind: 'world', id: 'w1' });
    });

    it('routes noble.killed to attackerUserId directly', async () => {
      const plans = await planNotifications(
        'noble.killed',
        { attackerVillageId: 'v1', attackerUserId: 'u1', combatId: 'c1' },
        makeDeps(),
      );
      expect(plans[0].recipient).toEqual({ kind: 'user', id: 'u1' });
    });
  });

  describe('village.attacked', () => {
    it('hides observerUserId from the defender payload', async () => {
      const plans = await planNotifications(
        'village.attacked',
        {
          defenderVillageId: 'vDef',
          defenderUserId: 'uDef',
          observerUserId: 'uObs',
          attackerVillageId: 'vAtk',
          attackerVillageName: 'Atk',
          attackerX: 1,
          attackerY: 1,
          defenderVillageName: 'Def',
          isDefenseSuccessful: false,
          losses: {},
          casualtyRate: 0,
          resourcesLost: { wood: 0, stone: 0, iron: 0 },
          timestamp: '2026-06-17T00:00:00Z',
        },
        makeDeps(),
      );
      expect(plans).toHaveLength(2);
      const defender = plans[0];
      const observer = plans[1];
      expect(defender.recipient).toEqual({ kind: 'user', id: 'uDef' });
      expect(defender.payload).not.toHaveProperty('observerUserId');
      expect(observer.recipient).toEqual({ kind: 'user', id: 'uObs' });
      expect(observer.payload).toMatchObject({ observerUserId: 'uObs' });
    });

    it('falls back to getUserIdByVillage when defenderUserId missing', async () => {
      const deps = makeDeps({ villageOwners: { vDef: 'uDef' } });
      const plans = await planNotifications(
        'village.attacked',
        {
          defenderVillageId: 'vDef',
          attackerVillageId: 'vAtk',
          attackerVillageName: 'Atk',
          attackerX: 0,
          attackerY: 0,
          defenderVillageName: 'Def',
          isDefenseSuccessful: true,
          losses: {},
          casualtyRate: 0,
          resourcesLost: { wood: 0, stone: 0, iron: 0 },
          timestamp: '2026-06-17T00:00:00Z',
        },
        deps,
      );
      expect(plans).toHaveLength(1);
      expect(plans[0].recipient).toEqual({ kind: 'user', id: 'uDef' });
    });

    it('skips observer when it equals the defender', async () => {
      const plans = await planNotifications(
        'village.attacked',
        {
          defenderVillageId: 'vDef',
          defenderUserId: 'uDef',
          observerUserId: 'uDef',
          attackerVillageId: 'vAtk',
          attackerVillageName: 'Atk',
          attackerX: 0,
          attackerY: 0,
          defenderVillageName: 'Def',
          isDefenseSuccessful: false,
          losses: {},
          casualtyRate: 0,
          resourcesLost: { wood: 0, stone: 0, iron: 0 },
          timestamp: '2026-06-17T00:00:00Z',
        },
        makeDeps(),
      );
      expect(plans).toHaveLength(1);
    });
  });

  describe('village.conquered', () => {
    it('emits to new owner and previous owner when both differ', async () => {
      const plans = await planNotifications(
        'village.conquered',
        {
          villageId: 'v1',
          villageName: 'A',
          newOwnerId: 'uNew',
          previousOwnerId: 'uOld',
          previousTier: 'T1',
          x: 0,
          y: 0,
          buildingsKept: 3,
          newOwnerName: 'Conqueror',
          lostVillageVisualTier: 3,
        },
        makeDeps(),
      );
      const ids = plans.map((plan) =>
        plan.recipient.kind === 'user' ? plan.recipient.id : null,
      );
      expect(ids).toEqual(['uNew', 'uOld']);
    });

    it('only emits to new owner when previous is the same', async () => {
      const plans = await planNotifications(
        'village.conquered',
        {
          villageId: 'v1',
          villageName: 'A',
          newOwnerId: 'uNew',
          previousOwnerId: 'uNew',
          previousTier: null,
          x: 0,
          y: 0,
          buildingsKept: 3,
          newOwnerName: 'Conqueror',
          lostVillageVisualTier: 3,
        },
        makeDeps(),
      );
      expect(plans).toHaveLength(1);
    });

    it('only emits to new owner when previous is null (barbarian conquest)', async () => {
      const plans = await planNotifications(
        'village.conquered',
        {
          villageId: 'v1',
          villageName: 'A',
          newOwnerId: 'uNew',
          previousOwnerId: null,
          previousTier: 'T2',
          x: 0,
          y: 0,
          buildingsKept: 1,
          newOwnerName: 'Conqueror',
          lostVillageVisualTier: 1,
        },
        makeDeps(),
      );
      expect(plans).toHaveLength(1);
    });
  });

  describe('capture window events', () => {
    it('falls back to PendingConquest when attackerUserId missing on opened', async () => {
      const deps = makeDeps({ conquestAttackers: { c1: 'uAtk' } });
      const plans = await planNotifications(
        'village.capture-window-opened',
        {
          pendingConquestId: 'c1',
          targetVillageId: 'vT',
          attackerVillageId: 'vA',
          captureUntil: '2026-06-17T00:00:00Z',
        },
        deps,
      );
      expect(plans[0].recipient).toEqual({ kind: 'user', id: 'uAtk' });
    });

    it('falls back to PendingConquest when attackerUserId missing on interrupted', async () => {
      const deps = makeDeps({ conquestAttackers: { c2: 'uAtk' } });
      const plans = await planNotifications(
        'village.capture-window-interrupted',
        {
          pendingConquestId: 'c2',
          targetVillageId: 'vT',
          reason: 'noble-killed',
        },
        deps,
      );
      expect(plans[0].recipient).toEqual({ kind: 'user', id: 'uAtk' });
    });

    it('village.capture-window-completed routes to newOwnerUserId', async () => {
      const plans = await planNotifications(
        'village.capture-window-completed',
        {
          pendingConquestId: 'c3',
          targetVillageId: 'vT',
          newOwnerUserId: 'uNew',
        },
        makeDeps(),
      );
      expect(plans).toEqual([
        {
          recipient: { kind: 'user', id: 'uNew' },
          payload: expect.objectContaining({ newOwnerUserId: 'uNew' }),
        },
      ]);
    });
  });
});
