import { describe, expect, it } from 'vitest';
import { STALE_THRESHOLD_MS } from '@battleforthecrown/shared';
import { buildThreatEstimateView } from './threatEstimateView';

// ---------------------------------------------------------------------------
// now fixe pour déterminisme (2026-06-22T00:00:00.000Z)
// ---------------------------------------------------------------------------
const NOW = Date.parse('2026-06-22T00:00:00.000Z');

function isoOffset(offsetMs: number): string {
  return new Date(NOW - offsetMs).toISOString();
}

// Minimal intel fraîche avec garnison légère (10 MILITIA = def 50, facilement écrasable)
function freshIntel(seenAt: string) {
  return {
    targetVillageId: 'v-target',
    worldId: 'world-1',
    sourceKind: 'SCOUT' as const,
    sourceReportId: 'report-1',
    units: { MILITIA: 10 },
    resources: { wood: 0, stone: 0, iron: 0 },
    wallLevel: 0,
    strategy: null,
    targetName: 'Hauterive',
    targetX: 12,
    targetY: 34,
    targetTier: null,
    seenAt,
  };
}

// ===========================================================================
// Régression tier-string (critique)
// ===========================================================================
describe('buildThreatEstimateView — régression tier-string barbare', () => {
  it('tier T1 vs T5 avec même armée modérée ⇒ labels différents et T5 plus sévère', () => {
    const base = {
      intel: null,
      publicBuildingPower: 0,
      armyAttackPower: 200, // moderate army
      now: NOW,
    };

    const viewT1 = buildThreatEstimateView({
      ...base,
      target: { kind: 'BARBARIAN_VILLAGE', tier: 'T1' },
    });
    const viewT5 = buildThreatEstimateView({
      ...base,
      target: { kind: 'BARBARIAN_VILLAGE', tier: 'T5' },
    });

    // Labels doivent différer
    expect(viewT1.label).not.toBe(viewT5.label);

    // T5 doit être plus sévère : tone order = low < medium < high
    const toneSeverity: Record<string, number> = { unknown: 0, low: 1, medium: 2, high: 3 };
    expect(toneSeverity[viewT5.tone]).toBeGreaterThan(toneSeverity[viewT1.tone]);
  });

  it('barbare tier T1 ⇒ tone jamais unknown', () => {
    const view = buildThreatEstimateView({
      target: { kind: 'BARBARIAN_VILLAGE', tier: 'T1' },
      intel: null,
      publicBuildingPower: 0,
      armyAttackPower: 100,
      now: NOW,
    });
    expect(view.tone).not.toBe('unknown');
  });

  it('barbare tier T5 ⇒ tone jamais unknown', () => {
    const view = buildThreatEstimateView({
      target: { kind: 'BARBARIAN_VILLAGE', tier: 'T5' },
      intel: null,
      publicBuildingPower: 0,
      armyAttackPower: 100,
      now: NOW,
    });
    expect(view.tone).not.toBe('unknown');
  });
});

// ===========================================================================
// Joueur, intel absente
// ===========================================================================
describe('buildThreatEstimateView — joueur intel=null', () => {
  it('renvoie label Inconnue, tone unknown, tooltip ESPION, freshnessNote null', () => {
    const view = buildThreatEstimateView({
      target: { kind: 'PLAYER_VILLAGE' },
      intel: null,
      publicBuildingPower: 0,
      armyAttackPower: 999,
      now: NOW,
    });

    expect(view.label).toBe('Inconnue');
    expect(view.tone).toBe('unknown');
    expect(view.tooltip).toContain('ESPION');
    expect(view.freshnessNote).toBeNull();
  });
});

// ===========================================================================
// Joueur, intel périmée
// ===========================================================================
describe('buildThreatEstimateView — joueur intel stale', () => {
  it('seenAt il y a 8 jours ⇒ Inconnue, tooltip "Intel trop ancienne", freshnessNote null', () => {
    const EIGHT_DAYS_MS = 8 * 24 * 3_600_000;
    const view = buildThreatEstimateView({
      target: { kind: 'PLAYER_VILLAGE' },
      intel: freshIntel(isoOffset(EIGHT_DAYS_MS)),
      publicBuildingPower: 0,
      armyAttackPower: 999,
      now: NOW,
    });

    expect(view.label).toBe('Inconnue');
    expect(view.tone).toBe('unknown');
    expect(view.tooltip).toContain('Intel trop ancienne');
    expect(view.freshnessNote).toBeNull();
  });

  it('seenAt exactement STALE_THRESHOLD_MS ⇒ Inconnue', () => {
    const view = buildThreatEstimateView({
      target: { kind: 'PLAYER_VILLAGE' },
      intel: freshIntel(isoOffset(STALE_THRESHOLD_MS)),
      publicBuildingPower: 0,
      armyAttackPower: 999,
      now: NOW,
    });
    expect(view.label).toBe('Inconnue');
  });
});

// ===========================================================================
// Joueur, intel fraîche avec garnison faible et grosse armée
// ===========================================================================
describe('buildThreatEstimateView — joueur intel fraîche', () => {
  it('renvoie label ≠ Inconnue, freshnessNote non-null contenant la date JJ/MM', () => {
    // seenAt = 1h avant now
    const ONE_HOUR_MS = 3_600_000;
    const seenAt = isoOffset(ONE_HOUR_MS - 1); // tout juste frais
    const view = buildThreatEstimateView({
      target: { kind: 'PLAYER_VILLAGE' },
      intel: freshIntel(seenAt),
      publicBuildingPower: 0,
      armyAttackPower: 500, // grosse armée vs 10 MILITIA (def=50) ⇒ Faible
      now: NOW,
    });

    expect(view.label).not.toBe('Inconnue');
    expect(view.freshnessNote).not.toBeNull();
    // La note doit contenir une date au format JJ/MM (ex: "22/06")
    expect(view.freshnessNote).toMatch(/\d{2}\/\d{2}/);
    expect(view.freshnessNote).toContain('scout du');
  });
});
