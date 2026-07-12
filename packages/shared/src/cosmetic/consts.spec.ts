import { describe, expect, it } from "vitest";
import { COSMETIC_AWARD_KINDS } from "./types";
import type { CosmeticAwardKind } from "./types";
import {
  COSMETIC_AWARD_DESCRIPTIONS,
  COSMETIC_AWARD_LABELS,
  SIGNAL_TO_COSMETIC_AWARD_KIND,
  formatCosmeticAwardLabel,
} from "./consts";

describe("formatCosmeticAwardLabel", () => {
  it("(a) rend `${prefix} de ${worldDisplayName}` pour chaque kind", () => {
    expect(formatCosmeticAwardLabel("POWER_CHAMPION_TITLE", "Aubeforge")).toBe(
      "Vainqueur de Aubeforge",
    );
    expect(formatCosmeticAwardLabel("ASSAULT_CHAMPION_TITLE", "Aubeforge")).toBe(
      "Conquérant de Aubeforge",
    );
    expect(formatCosmeticAwardLabel("RAMPART_CHAMPION_TITLE", "Aubeforge")).toBe(
      "Sentinelle de Aubeforge",
    );
  });

  it("(b) interpole le nom de monde tel quel (espaces, accents, casse)", () => {
    expect(formatCosmeticAwardLabel("POWER_CHAMPION_TITLE", "Val d’Été")).toBe(
      "Vainqueur de Val d’Été",
    );
  });

  it("(c) accepte un nom de monde vide sans planter", () => {
    expect(formatCosmeticAwardLabel("POWER_CHAMPION_TITLE", "")).toBe(
      "Vainqueur de ",
    );
  });
});

describe("cosmetic const maps", () => {
  it("(d) SIGNAL_TO_COSMETIC_AWARD_KIND est une bijection 1:1 sur les 3 kinds", () => {
    const kinds = Object.values(SIGNAL_TO_COSMETIC_AWARD_KIND);
    expect(new Set(kinds).size).toBe(kinds.length); // aucun kind dupliqué
    expect([...kinds].sort()).toEqual([...COSMETIC_AWARD_KINDS].sort());
  });

  it("(e) labels et descriptions couvrent exactement les kinds déclarés (anti-drift)", () => {
    const expected = [...COSMETIC_AWARD_KINDS].sort();
    expect((Object.keys(COSMETIC_AWARD_LABELS) as CosmeticAwardKind[]).sort()).toEqual(
      expected,
    );
    expect(
      (Object.keys(COSMETIC_AWARD_DESCRIPTIONS) as CosmeticAwardKind[]).sort(),
    ).toEqual(expected);
  });

  it("(f) aucun label ni description vide", () => {
    for (const kind of COSMETIC_AWARD_KINDS) {
      expect(COSMETIC_AWARD_LABELS[kind].length).toBeGreaterThan(0);
      expect(COSMETIC_AWARD_DESCRIPTIONS[kind].length).toBeGreaterThan(0);
    }
  });
});
