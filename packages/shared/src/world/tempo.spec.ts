import { describe, expect, it } from 'vitest';
import type { WorldTempo } from './schemas';
import { TempoService } from './tempo';

describe('TempoService', () => {
  const standard: WorldTempo = { global: 1 };
  const globalOnly: WorldTempo = { global: 2 };
  const withOverrides: WorldTempo = {
    global: 2,
    overrides: { constructionSpeed: 3, resourceProduction: 4 },
  };

  describe('resolve', () => {
    it('sans overrides → renvoie global', () => {
      expect(TempoService.resolve(globalOnly, 'constructionSpeed')).toBe(2);
    });

    it('axe couvert par un override → renvoie l’override', () => {
      expect(TempoService.resolve(withOverrides, 'constructionSpeed')).toBe(3);
    });

    it('axe absent des overrides → fallback sur global', () => {
      expect(TempoService.resolve(withOverrides, 'travelSpeed')).toBe(2);
    });
  });

  describe('applyDuration', () => {
    it('multiplie la durée absolue par le facteur global', () => {
      expect(TempoService.applyDuration(100, globalOnly, 'travelSpeed')).toBe(
        200,
      );
    });

    it('utilise l’override de l’axe quand présent', () => {
      expect(
        TempoService.applyDuration(100, withOverrides, 'constructionSpeed'),
      ).toBe(300);
    });
  });

  describe('applyRate', () => {
    it('divise le montant absolu par le facteur global', () => {
      expect(TempoService.applyRate(100, globalOnly, 'barbarianRegen')).toBe(50);
    });

    it('utilise l’override de l’axe quand présent', () => {
      expect(
        TempoService.applyRate(100, withOverrides, 'resourceProduction'),
      ).toBe(25);
    });
  });

  describe('deriveProfile', () => {
    it('global === 1 → standard', () => {
      expect(TempoService.deriveProfile(standard)).toBe('standard');
    });

    it('global !== 1 → custom', () => {
      expect(TempoService.deriveProfile(globalOnly)).toBe('custom');
    });

    it('des overrides mais global === 1 → toujours standard', () => {
      expect(
        TempoService.deriveProfile({ global: 1, overrides: { travelSpeed: 2 } }),
      ).toBe('standard');
    });
  });
});
