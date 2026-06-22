import { describe, expect, it } from 'vitest';
import {
  INTEL_FRESHNESS_THRESHOLDS_MS,
  STALE_THRESHOLD_MS,
  THREAT_LEVELS,
} from './constants';
import { computeThreatLabel, formatIntelFreshness } from './formula';

// ---------------------------------------------------------------------------
// Fixtures numériques calibrées sur UNIT_STATS réels
// MILITIA : def = (5+5+5)/3 = 5 par unité
// TEMPLAR : def = (15+15+15)/3 = 15 par unité
// wallLevel=0 → wallMult = 1
// ---------------------------------------------------------------------------
const NO_BUILDING = 0; // publicBuildingPower = 0 pour isoler l'effet troupes/tier

// ===========================================================================
// computeThreatLabel — barbares
// ===========================================================================
describe('computeThreatLabel — barbare', () => {
  it('tier 1, grosse armée ⇒ Faible', () => {
    // tier=1: defensePower = 1*150 = 150. ratio=500/150 ≈ 3.3 >= 1.5
    expect(
      computeThreatLabel({
        intel: null,
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 500,
        intelAgeMs: null,
        isBarbarian: true,
        targetTier: 1,
      }),
    ).toBe('Faible');
  });

  it('tier 5, petite armée ⇒ Élevée', () => {
    // tier=5: defensePower = 5*150 = 750. ratio=100/750 ≈ 0.13 < 0.75
    expect(
      computeThreatLabel({
        intel: null,
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 100,
        intelAgeMs: null,
        isBarbarian: true,
        targetTier: 5,
      }),
    ).toBe('Élevée');
  });

  it('tier 3, armée équilibrée ⇒ Moyenne', () => {
    // tier=3: defensePower = 3*150 = 450. ratio=400/450 ≈ 0.89 — entre 0.75 et 1.5
    expect(
      computeThreatLabel({
        intel: null,
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 400,
        intelAgeMs: null,
        isBarbarian: true,
        targetTier: 3,
      }),
    ).toBe('Moyenne');
  });

  it('intel=null ⇒ jamais Inconnue pour un barbare', () => {
    const label = computeThreatLabel({
      intel: null,
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 1,
      intelAgeMs: null,
      isBarbarian: true,
      targetTier: 2,
    });
    expect(label).not.toBe('Inconnue');
  });

  it('intelAgeMs=null ⇒ jamais Inconnue pour un barbare', () => {
    const label = computeThreatLabel({
      intel: null,
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 1,
      intelAgeMs: null,
      isBarbarian: true,
      targetTier: 1,
    });
    expect(label).not.toBe('Inconnue');
  });

  it('targetTier=null ⇒ tier=1 par défaut (pas Inconnue)', () => {
    // tier ?? 1 → tier=1
    const label = computeThreatLabel({
      intel: null,
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 1,
      intelAgeMs: null,
      isBarbarian: true,
      targetTier: null,
    });
    expect(label).not.toBe('Inconnue');
  });
});

// ===========================================================================
// computeThreatLabel — joueur, cas Inconnue
// ===========================================================================
describe('computeThreatLabel — joueur, invariant non-révélation', () => {
  it('intel=null ⇒ Inconnue même si armée ≫ publicBuildingPower', () => {
    // Invariant non-révélation : sans intel, pas d'estimation, même avec grosse armée
    expect(
      computeThreatLabel({
        intel: null,
        publicBuildingPower: 1,
        armyAttackPower: 999_999,
        intelAgeMs: 0,
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Inconnue');
  });

  it('intel.units=null ⇒ Inconnue', () => {
    expect(
      computeThreatLabel({
        intel: { units: null, wallLevel: 0 },
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 500,
        intelAgeMs: 100,
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Inconnue');
  });

  it('intelAgeMs >= STALE_THRESHOLD_MS ⇒ Inconnue', () => {
    expect(
      computeThreatLabel({
        intel: { units: { MILITIA: 10 }, wallLevel: 0 },
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 500,
        intelAgeMs: STALE_THRESHOLD_MS, // exactement la borne ⇒ périmé
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Inconnue');
  });

  it('intelAgeMs = STALE_THRESHOLD_MS - 1 (frais) ⇒ label calculé ≠ Inconnue', () => {
    // Intel d'une milliseconde avant la péremption ⇒ encore valide
    const label = computeThreatLabel({
      intel: { units: { MILITIA: 10 }, wallLevel: 0 },
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 500,
      intelAgeMs: STALE_THRESHOLD_MS - 1,
      isBarbarian: false,
      targetTier: null,
    });
    expect(label).not.toBe('Inconnue');
  });

  it('intelAgeMs=null ⇒ Inconnue', () => {
    expect(
      computeThreatLabel({
        intel: { units: { MILITIA: 10 }, wallLevel: 0 },
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 500,
        intelAgeMs: null,
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Inconnue');
  });
});

// ===========================================================================
// computeThreatLabel — joueur, labels calculés
// ===========================================================================
describe('computeThreatLabel — joueur, intel fraîche', () => {
  const FRESH_AGE = 0; // 0 ms < STALE_THRESHOLD_MS

  it('défense faible vs grosse armée ⇒ Faible', () => {
    // 10 MILITIA : troopDef = 10 * 5 = 50. wallMult=1. defensePower=50.
    // ratio = 500/50 = 10 >= 1.5 ⇒ Faible
    expect(
      computeThreatLabel({
        intel: { units: { MILITIA: 10 }, wallLevel: 0 },
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 500,
        intelAgeMs: FRESH_AGE,
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Faible');
  });

  it('équilibre armée/défense ⇒ Moyenne', () => {
    // 10 TEMPLAR : troopDef = 10 * 15 = 150. ratio = 130/150 ≈ 0.87 — entre 0.75 et 1.5
    expect(
      computeThreatLabel({
        intel: { units: { TEMPLAR: 10 }, wallLevel: 0 },
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 130,
        intelAgeMs: FRESH_AGE,
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Moyenne');
  });

  it('défenseur nettement supérieur ⇒ Élevée', () => {
    // 100 TEMPLAR : troopDef = 100 * 15 = 1500. ratio = 500/1500 ≈ 0.33 < 0.75
    expect(
      computeThreatLabel({
        intel: { units: { TEMPLAR: 100 }, wallLevel: 0 },
        publicBuildingPower: NO_BUILDING,
        armyAttackPower: 500,
        intelAgeMs: FRESH_AGE,
        isBarbarian: false,
        targetTier: null,
      }),
    ).toBe('Élevée');
  });

  it('garnison vide (units={}) ⇒ N\'est PAS Inconnue (défense bâtiments seule)', () => {
    // units={} présent mais vide ⇒ troopDef=0. defensePower = 0 + publicBuildingPower*0.5
    // armyAttackPower=100, ratio=100/max(1,0)=100 >= 1.5 ⇒ Faible (pas Inconnue)
    const label = computeThreatLabel({
      intel: { units: {}, wallLevel: 0 },
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 100,
      intelAgeMs: FRESH_AGE,
      isBarbarian: false,
      targetTier: null,
    });
    expect(label).not.toBe('Inconnue');
  });

  it('wallLevel élevé fait monter la menace d\'un cran (Faible → Moyenne)', () => {
    // 10 MILITIA, wallLevel=0 : troopDef=50, def=50, ratio=100/50=2 ⇒ Faible
    const labelNoWall = computeThreatLabel({
      intel: { units: { MILITIA: 10 }, wallLevel: 0 },
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 100,
      intelAgeMs: FRESH_AGE,
      isBarbarian: false,
      targetTier: null,
    });
    // wallLevel=20 : wallMult=1+20*0.05=2, def=50*2=100, ratio=100/100=1 ⇒ Moyenne
    const labelHighWall = computeThreatLabel({
      intel: { units: { MILITIA: 10 }, wallLevel: 20 },
      publicBuildingPower: NO_BUILDING,
      armyAttackPower: 100,
      intelAgeMs: FRESH_AGE,
      isBarbarian: false,
      targetTier: null,
    });
    expect(labelNoWall).toBe('Faible');
    expect(labelHighWall).toBe('Moyenne');
  });
});

// ===========================================================================
// formatIntelFreshness — bornes
// ===========================================================================
describe('formatIntelFreshness', () => {
  const { fresh: FRESH_MS, recent: RECENT_MS, stale: STALE_MS } = INTEL_FRESHNESS_THRESHOLDS_MS;

  it('0 ms ⇒ fresh', () => {
    expect(formatIntelFreshness(0)).toBe('fresh');
  });

  it('FRESH_MS - 1 ⇒ fresh', () => {
    expect(formatIntelFreshness(FRESH_MS - 1)).toBe('fresh');
  });

  it('FRESH_MS (exactement 1h) ⇒ recent', () => {
    expect(formatIntelFreshness(FRESH_MS)).toBe('recent');
  });

  it('RECENT_MS - 1 ⇒ recent', () => {
    expect(formatIntelFreshness(RECENT_MS - 1)).toBe('recent');
  });

  it('RECENT_MS (exactement 24h) ⇒ stale', () => {
    expect(formatIntelFreshness(RECENT_MS)).toBe('stale');
  });

  it('STALE_MS - 1 ⇒ stale', () => {
    expect(formatIntelFreshness(STALE_MS - 1)).toBe('stale');
  });

  it('STALE_MS (exactement 7j) ⇒ outdated', () => {
    expect(formatIntelFreshness(STALE_MS)).toBe('outdated');
  });

  it('STALE_MS + 1 ⇒ outdated', () => {
    expect(formatIntelFreshness(STALE_MS + 1)).toBe('outdated');
  });
});

// ===========================================================================
// Table libellés — acceptance grep snapshot
// ===========================================================================
describe('THREAT_LEVELS', () => {
  it('contient exactement [Inconnue, Faible, Moyenne, Élevée]', () => {
    expect(THREAT_LEVELS).toEqual(['Inconnue', 'Faible', 'Moyenne', 'Élevée']);
  });

  it('aucun libellé ne contient de caractère interdit (%, Certaine, Garantie, 100)', () => {
    for (const level of THREAT_LEVELS) {
      expect(level).not.toMatch(/%|Certaine|Garantie|100/);
    }
  });
});
