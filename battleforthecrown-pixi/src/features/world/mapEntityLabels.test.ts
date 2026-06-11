import { describe, expect, it } from 'vitest';
import type { MapEntity } from '@/api/world-types';
import { mapEntityCalloutSubtitle, mapEntityCanvasLabel } from './mapEntityLabels';

function foreignPlayerVillage(overrides: Partial<MapEntity> = {}): MapEntity {
  return {
    id: 'v1',
    kind: 'PLAYER_VILLAGE',
    isMine: false,
    name: 'Royaume de Kelvin',
    ownerDisplayName: 'Sire Kelvin',
    ownerId: 'u-foreign',
    tier: null,
    x: 10,
    y: 20,
    ...overrides,
  };
}

describe('mapEntityCalloutSubtitle', () => {
  it('includes owner display name for a foreign player village', () => {
    expect(mapEntityCalloutSubtitle(foreignPlayerVillage())).toBe(
      'Sire Kelvin · Village joueur',
    );
  });

  it('keeps owned village subtitle unchanged', () => {
    expect(
      mapEntityCalloutSubtitle(foreignPlayerVillage({ isMine: true })),
    ).toBe('Mon village');
  });
});

describe('mapEntityCanvasLabel', () => {
  it('appends owner display name on a foreign player village label', () => {
    expect(mapEntityCanvasLabel(foreignPlayerVillage())).toBe(
      'Royaume de Kelvin\nSire Kelvin',
    );
  });

  it('keeps village name only when owner display name is missing', () => {
    expect(
      mapEntityCanvasLabel(foreignPlayerVillage({ ownerDisplayName: undefined })),
    ).toBe('Royaume de Kelvin');
  });
});
