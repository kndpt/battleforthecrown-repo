import { describe, expect, it, vi } from 'vitest';
import type {
  OpenConquestDto,
  OpenExpeditionDto,
} from '@battleforthecrown/shared/combat';
import {
  computeProgress,
  formatTime,
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

    const card = mapOpenConquestToCaptureCard(conquest, now);
    expect(card).toMatchObject({
      coordinates: '259|242',
      endTime: formatTime(Date.parse('2026-05-13T13:00:00.000Z')),
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

  it('maps a resource caravan as a recallable caravan activity', () => {
    const now = Date.parse('2026-05-13T12:01:00.000Z');
    const onRecall = vi.fn();
    const expedition: OpenExpeditionDto = {
      arrivalAt: '2026-05-13T12:05:00.000Z',
      attackerVillageId: 'origin-1',
      attackerVillageName: 'Royaume du Nord',
      departAt: '2026-05-13T12:00:00.000Z',
      expeditionId: 'caravan-1',
      isConquest: false,
      kind: 'CARAVAN',
      recalled: false,
      resources: { wood: 300, stone: 150, iron: 0 },
      returnAt: null,
      status: 'EN_ROUTE',
      targetKind: 'PLAYER_VILLAGE',
      targetName: 'Royaume du Sud',
      targetVillageId: 'target-1',
      targetX: 210,
      targetY: 244,
    };

    const card = mapOpenExpeditionToActivityCard(expedition, now, onRecall);

    expect(card).toMatchObject({
      icon: '/assets/resources/resources.png',
      kind: 'caravan',
      movementId: 'caravan-1',
      phase: 'en_route',
      progress: 20,
      recallLabel: 'Rappeler',
      statusLabel: 'CARAVANE',
      subtitle: '210|244 · Arrivée dans 4m 00s',
      time: '4m 00s',
      title: 'Royaume du Sud',
    });

    card.onRecall?.('caravan-1');
    expect(onRecall).toHaveBeenCalledWith('caravan-1', 'origin-1');
  });
});

describe('formatTime', () => {
  it('formats a finite UTC timestamp as HH:MM in fr-FR locale', () => {
    const ts = Date.parse('2026-05-13T14:05:00.000Z');
    const result = formatTime(ts);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns --:-- for NaN / non-finite input', () => {
    expect(formatTime(NaN)).toBe('--:--');
    expect(formatTime(Infinity)).toBe('--:--');
  });

  it('is used by mapOpenConquestToCaptureCard to populate endTime', () => {
    const captureUntil = Date.parse('2026-05-13T13:00:00.000Z');
    const conquest: OpenConquestDto = {
      attackerVillageId: 'v1',
      attackerVillageName: 'Nord',
      captureStartedAt: '2026-05-13T12:00:00.000Z',
      captureUntil: new Date(captureUntil).toISOString(),
      pendingConquestId: 'pc1',
      status: 'OPEN',
      targetCastleLevel: null,
      targetKind: 'BARBARIAN_VILLAGE',
      targetName: 'Village barbare',
      targetTier: 'T1',
      targetVillageId: 'target-1',
      targetX: 10,
      targetY: 20,
    };
    const card = mapOpenConquestToCaptureCard(conquest, captureUntil - 1_000);
    expect(card.endTime).toBe(formatTime(captureUntil));
  });
});

describe('computeProgress', () => {
  it('returns 100 when past the end', () => {
    expect(computeProgress(0, 1_000, 2_000)).toBe(100);
  });

  it('returns 0 when at the start', () => {
    expect(computeProgress(0, 1_000, 0)).toBe(0);
  });

  it('returns 50 at the midpoint', () => {
    expect(computeProgress(0, 1_000, 500)).toBe(50);
  });

  it('clamps to 100 for endAt <= startAt (degenerate range)', () => {
    expect(computeProgress(500, 500, 500)).toBe(100);
    expect(computeProgress(500, 400, 500)).toBe(100);
  });

  it('returns 100 for non-finite inputs', () => {
    expect(computeProgress(NaN, 1_000, 500)).toBe(100);
    expect(computeProgress(0, NaN, 500)).toBe(100);
  });
});
