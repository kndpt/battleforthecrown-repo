import { describe, expect, it } from 'vitest';
import type { BuildingDto, JoinedVillage } from '@/api';
import type { KingdomPowerDto, VillageStrategyInfoDto } from '@/api/queries';
import type { CosmeticAwardResponse } from '@battleforthecrown/shared';
import {
  buildPlayerProfileSheetData,
  buildProfileAwards,
  buildProfileVillages,
} from './profileViewModel';

function village(overrides: Partial<JoinedVillage> & Pick<JoinedVillage, 'id'>): JoinedVillage {
  return {
    name: `Village ${overrides.id}`,
    x: 1,
    y: 2,
    worldId: 'world-1',
    ...overrides,
  };
}

const strategy = (currentStrategy: string) =>
  ({ currentStrategy }) as unknown as VillageStrategyInfoDto;

describe('buildProfileVillages', () => {
  it('prefers castleLevel, then CASTLE building level, then em dash', () => {
    const villages = [
      village({ id: 'a', castleLevel: 7 }),
      village({ id: 'b' }),
      village({ id: 'c' }),
    ];
    const buildingsByVillageId = new Map<string, BuildingDto[]>([
      ['b', [{ type: 'CASTLE', level: 3 } as BuildingDto]],
    ]);

    const rows = buildProfileVillages({
      villages,
      buildingsByVillageId,
      powerByVillageId: new Map(),
      strategyByVillageId: new Map(),
    });

    expect(rows.map((row) => row.level)).toEqual([7, 3, '—']);
  });

  it('maps coords, capital, label, power and strategy style', () => {
    const rows = buildProfileVillages({
      villages: [
        village({ id: 'a', x: 12, y: 34, isCapital: true, label: 'OFFENSIVE' }),
      ],
      buildingsByVillageId: new Map(),
      powerByVillageId: new Map([['a', 12345]]),
      strategyByVillageId: new Map([['a', strategy('FORTRESS')]]),
    });

    expect(rows[0]).toMatchObject({
      capital: true,
      coords: '12:34',
      label: 'Offensif',
      power: (12345).toLocaleString('fr-FR'),
      style: { id: 'FORTRESS', label: 'Forteresse' },
    });
  });

  it('falls back to em dash power and undefined style when data is missing', () => {
    const rows = buildProfileVillages({
      villages: [village({ id: 'a' })],
      buildingsByVillageId: new Map(),
      powerByVillageId: new Map(),
      strategyByVillageId: new Map(),
    });

    expect(rows[0].power).toBe('—');
    expect(rows[0].style).toBeUndefined();
    expect(rows[0].label).toBeUndefined();
  });
});

describe('buildProfileAwards', () => {
  const award = (
    overrides: Partial<CosmeticAwardResponse> &
      Pick<CosmeticAwardResponse, 'kind'>,
  ): CosmeticAwardResponse => ({
    worldDisplayName: 'Aubeforge',
    awardedAt: '2026-06-25T10:00:00.000Z',
    ...overrides,
  });

  it('maps id, shared label, description and formatted date, preserving order', () => {
    const rows = buildProfileAwards([
      award({ kind: 'POWER_CHAMPION_TITLE' }),
      award({ kind: 'RAMPART_CHAMPION_TITLE', worldDisplayName: 'Val-Noir' }),
    ]);

    expect(rows).toEqual([
      {
        id: 'POWER_CHAMPION_TITLE-Aubeforge-0',
        title: 'Vainqueur de Aubeforge',
        description: 'Puissance du royaume',
        date: '25 juin 2026',
        kind: 'POWER_CHAMPION_TITLE',
      },
      {
        id: 'RAMPART_CHAMPION_TITLE-Val-Noir-1',
        title: 'Sentinelle de Val-Noir',
        description: 'Gloire du rempart',
        date: '25 juin 2026',
        kind: 'RAMPART_CHAMPION_TITLE',
      },
    ]);
  });

  it('formats the date in UTC (no off-by-one near midnight) and tolerates invalid dates', () => {
    const [late, invalid] = buildProfileAwards([
      // 23:30 UTC → still the 25th in UTC, would roll to the 26th in +01:00 TZ.
      award({ kind: 'POWER_CHAMPION_TITLE', awardedAt: '2026-06-25T23:30:00.000Z' }),
      award({ kind: 'ASSAULT_CHAMPION_TITLE', awardedAt: 'not-a-date' }),
    ]);

    expect(late.date).toBe('25 juin 2026');
    expect(invalid.date).toBe('');
  });

  it('returns an empty list for no awards', () => {
    expect(buildProfileAwards([])).toEqual([]);
  });
});

describe('buildPlayerProfileSheetData', () => {
  const kingdomPower = { kingdomPower: 4200 } as KingdomPowerDto;

  it('formats power and crowns when present', () => {
    const data = buildPlayerProfileSheetData({
      kingdomPower,
      crownBalance: 1234.9,
      user: { displayName: 'Jane Doe' },
      villagesCount: 3,
      activePublicWorld: undefined,
      activeMembership: undefined,
      worldId: 'world-1',
    });

    expect(data.stats.power).toBe((4200).toLocaleString('fr-FR'));
    expect(data.stats.crowns).toBe((1234).toLocaleString('fr-FR'));
    expect(data.stats.villages).toBe(3);
    expect(data.player.online).toBe(true);
    expect(data.player.name).toBe('Jane Doe');
  });

  it('uses em dash power/crowns and offline player when data is absent', () => {
    const data = buildPlayerProfileSheetData({
      kingdomPower: undefined,
      crownBalance: null,
      user: null,
      villagesCount: 0,
      activePublicWorld: undefined,
      activeMembership: undefined,
      worldId: null,
    });

    expect(data.stats.power).toBe('—');
    expect(data.stats.crowns).toBe('—');
    expect(data.player.online).toBe(false);
    expect(data.player.name).toBe('Joueur');
    expect(data.world.name).toBe('À venir');
  });

  it('falls back world name to membership name then worldId', () => {
    const withMembership = buildPlayerProfileSheetData({
      kingdomPower,
      crownBalance: 0,
      user: null,
      villagesCount: 1,
      activePublicWorld: undefined,
      activeMembership: { worldName: 'Royaume Test' } as never,
      worldId: 'world-9',
    });
    expect(withMembership.world.name).toBe('Royaume Test');

    const worldIdOnly = buildPlayerProfileSheetData({
      kingdomPower,
      crownBalance: 0,
      user: null,
      villagesCount: 1,
      activePublicWorld: undefined,
      activeMembership: undefined,
      worldId: 'world-9',
    });
    expect(worldIdOnly.world.name).toBe('world-9');
  });

  it('uses the renown level for the avatar badge, with a placeholder fallback', () => {
    const withRenown = buildPlayerProfileSheetData({
      kingdomPower,
      crownBalance: 0,
      user: { displayName: 'Jane' },
      villagesCount: 1,
      activePublicWorld: undefined,
      activeMembership: undefined,
      worldId: 'world-1',
      renownLevel: 3,
    });
    expect(withRenown.player.level).toBe(3);

    const withoutRenown = buildPlayerProfileSheetData({
      kingdomPower,
      crownBalance: 0,
      user: { displayName: 'Jane' },
      villagesCount: 1,
      activePublicWorld: undefined,
      activeMembership: undefined,
      worldId: 'world-1',
    });
    // Fallback placeholder (PLAYER_PROFILE_LEVEL) tant que la Renommée n'est pas chargée.
    expect(withoutRenown.player.level).toBe(1);
  });
});
