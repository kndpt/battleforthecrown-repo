import { describe, expect, it } from 'vitest';
import type {
  OpenConquestDto,
  OpenExpeditionDto,
} from '@battleforthecrown/shared/combat';
import {
  mapOpenConquestToCaptureCard,
  mapOpenExpeditionToActivityCard,
} from './kingdomActivitiesViewModel';

describe('kingdom activities view model', () => {
  it('maps an open conquest to a capture card with progress and soon state', () => {
    const now = Date.parse('2026-05-13T12:50:00.000Z');
    const conquest: OpenConquestDto = {
      attackerVillageId: 'v1',
      attackerVillageName: 'Royaume du Nord',
      captureStartedAt: '2026-05-13T12:00:00.000Z',
      captureUntil: '2026-05-13T13:00:00.000Z',
      pendingConquestId: 'pc1',
      targetCastleLevel: null,
      targetKind: 'BARBARIAN_VILLAGE',
      status: 'OPEN',
      targetName: 'Village barbare',
      targetTier: 'T3',
      targetVillageId: 'target-1',
      targetX: 259,
      targetY: 242,
    };

    expect(mapOpenConquestToCaptureCard(conquest, now)).toMatchObject({
      coordinates: '259|242',
      originName: 'Royaume du Nord',
      progress: 83.33333333333334,
      state: 'soon',
      statusLabel: 'Bientôt terminée',
      targetName: 'Village barbare',
      tier: 'T3',
      tierSubLabel: 'Tier',
      timeRemaining: '10m 00s',
    });
  });

  it('maps a player capture with a PvP badge and castle level', () => {
    const now = Date.parse('2026-05-13T12:30:00.000Z');
    const conquest: OpenConquestDto = {
      attackerVillageId: 'v1',
      attackerVillageName: 'Royaume du Nord',
      captureStartedAt: '2026-05-13T12:00:00.000Z',
      captureUntil: '2026-05-13T16:30:00.000Z',
      pendingConquestId: 'pc1',
      status: 'OPEN',
      targetCastleLevel: 10,
      targetKind: 'PLAYER_VILLAGE',
      targetName: 'Royaume rival',
      targetTier: null,
      targetVillageId: 'target-1',
      targetX: 265,
      targetY: 241,
    };

    expect(mapOpenConquestToCaptureCard(conquest, now)).toMatchObject({
      progress: 11.11111111111111,
      tier: 'PVP',
      tierSubLabel: 'Ch. 10',
      timeRemaining: '4h 00m',
    });
  });

  it('maps a noble attack expedition as a conquest movement', () => {
    const now = Date.parse('2026-05-13T12:00:30.000Z');
    const expedition: OpenExpeditionDto = {
      arrivalAt: '2026-05-13T12:02:00.000Z',
      attackerVillageId: 'origin-1',
      attackerVillageName: 'Royaume du Nord',
      departAt: '2026-05-13T12:00:00.000Z',
      expeditionId: 'exp-1',
      isConquest: true,
      kind: 'ATTACK',
      recalled: false,
      returnAt: null,
      status: 'EN_ROUTE',
      targetKind: 'BARBARIAN_VILLAGE',
      targetName: 'Camp T4',
      targetVillageId: 'target-1',
      targetX: 241,
      targetY: 261,
    };

    expect(mapOpenExpeditionToActivityCard(expedition, now)).toMatchObject({
      icon: '/assets/casual-icons/crown.png',
      kind: 'conquest',
      movementId: 'exp-1',
      phase: 'en_route',
      progress: 25,
      recallLabel: 'Rappeler',
      statusLabel: 'CONQUÊTE',
      time: '1m 30s',
      title: 'Camp T4',
    });
  });

  it('maps a returning scout against returnAt for progress and remaining time', () => {
    const now = Date.parse('2026-05-13T12:03:00.000Z');
    const expedition: OpenExpeditionDto = {
      arrivalAt: '2026-05-13T12:02:00.000Z',
      attackerVillageId: 'origin-1',
      attackerVillageName: 'Royaume du Nord',
      departAt: '2026-05-13T12:00:00.000Z',
      expeditionId: 'scout-1',
      isConquest: false,
      kind: 'SCOUT',
      recalled: false,
      returnAt: '2026-05-13T12:04:00.000Z',
      status: 'RETURNING',
      targetKind: 'BARBARIAN_VILLAGE',
      targetName: 'Camp T2',
      targetVillageId: 'target-1',
      targetX: 208,
      targetY: 245,
    };

    expect(mapOpenExpeditionToActivityCard(expedition, now)).toMatchObject({
      kind: 'scout',
      phase: 'returning',
      progress: 50,
      recallLabel: undefined,
      statusLabel: 'SCOUT',
      time: '1m 00s',
    });
  });
});
