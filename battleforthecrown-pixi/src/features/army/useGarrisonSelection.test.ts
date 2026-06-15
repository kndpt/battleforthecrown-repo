import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { UnitType } from '@battleforthecrown/shared/army';
import type { ArmySupportRow, ArmyTroop, ArmyVillageRow } from '@/features/design-system/components';
import type { GarrisonLine } from '@/lib/types';
import { useGarrisonSelection } from './useGarrisonSelection';

const ARCHER: UnitType = 'ARCHER';
const VILLAGE_A = 'village-a';
const VILLAGE_B = 'village-b';

const makeOutgoing = (unitType: UnitType, villageId: string): GarrisonLine => ({
  direction: 'OUTGOING',
  hostPlayerName: 'Alice',
  hostVillageName: 'Fort Alice',
  originVillageId: 'home',
  originVillageName: 'Home',
  originPlayerName: 'Me',
  quantity: 10,
  unitType,
  villageId,
});

const makeIncoming = (unitType: UnitType, originVillageId: string): GarrisonLine => ({
  direction: 'INCOMING',
  hostPlayerName: 'Me',
  hostVillageName: 'Home',
  originVillageId,
  originVillageName: 'Fort Ally',
  originPlayerName: 'Bob',
  quantity: 5,
  unitType,
  villageId: 'home',
});

const makeTroop = (id: string, name: string): ArmyTroop => ({
  attack: 0,
  category: 'Infanterie',
  cost: { iron: 0, stone: 0, wood: 0 },
  defense: 0,
  id,
  inVillage: 0,
  name,
  pop: 1,
  power: 0,
  short: id,
  trainingTime: '0s',
  unlocked: true,
});

const makeSupportRow = (id: string): ArmySupportRow => ({
  id,
  power: 0,
  title: 'Support Village',
  totalQuantity: 5,
  units: [],
});

const makeVillageRow = (id: string, alliedQuantity: number): ArmyVillageRow => ({
  id,
  alliedQuantity,
  ownQuantity: 0,
  power: 0,
  title: 'Village',
  totalQuantity: alliedQuantity,
});

describe('useGarrisonSelection', () => {
  const lines: GarrisonLine[] = [
    makeOutgoing(ARCHER, VILLAGE_A),
    makeIncoming(ARCHER, VILLAGE_B),
  ];
  const troops: ArmyTroop[] = [makeTroop(ARCHER, 'Archers')];

  it('starts closed with empty selection', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    expect(result.current.isGarrisonOpen).toBe(false);
    expect(result.current.selectedGarrisonLines).toHaveLength(0);
    expect(result.current.selectedGarrisonTitle).toBeUndefined();
    expect(result.current.selectedGarrisonSubtitle).toBeNull();
  });

  it('selectTroop (no direction) shows outgoing + incoming lines for that unit', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    act(() => result.current.selectTroop(ARCHER));
    expect(result.current.isGarrisonOpen).toBe(true);
    expect(result.current.selectedGarrisonLines).toHaveLength(2);
    expect(result.current.selectedGarrisonTitle).toBe('Archers');
  });

  it('selectTroop with INCOMING direction filters to incoming only', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    act(() => result.current.selectTroop(ARCHER, 'INCOMING'));
    expect(result.current.selectedGarrisonLines).toHaveLength(1);
    expect(result.current.selectedGarrisonLines[0].direction).toBe('INCOMING');
    expect(result.current.selectedGarrisonTitle).toBe('Archers alliés');
    expect(result.current.selectedGarrisonSubtitle).toBe('Fort Ally · Bob');
  });

  it('onSupportRowSelect selects outgoing lines for that village', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    act(() => result.current.onSupportRowSelect(makeSupportRow(VILLAGE_A)));
    expect(result.current.selectedGarrisonLines).toHaveLength(1);
    expect(result.current.selectedGarrisonLines[0].direction).toBe('OUTGOING');
    expect(result.current.selectedGarrisonTitle).toBe('Fort Alice');
    expect(result.current.selectedGarrisonSubtitle).toBe('Alice');
  });

  it('onVillageRowSelect with allies selects incoming for that troop', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    act(() => result.current.onVillageRowSelect(makeVillageRow(ARCHER, 3)));
    expect(result.current.selectedGarrisonLines).toHaveLength(1);
    expect(result.current.selectedGarrisonLines[0].direction).toBe('INCOMING');
  });

  it('onVillageRowSelect with 0 allies clears village but preserves troop selection', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    act(() => result.current.selectTroop(ARCHER));
    act(() => result.current.onVillageRowSelect(makeVillageRow(VILLAGE_A, 0)));
    // troop stays selected (village cleared, but troop remains from selectTroop call)
    expect(result.current.isGarrisonOpen).toBe(true);
    expect(result.current.selectedGarrisonLines).toHaveLength(2);
  });

  it('clear closes the garrison sheet', () => {
    const { result } = renderHook(() => useGarrisonSelection(lines, troops));
    act(() => result.current.selectTroop(ARCHER));
    act(() => result.current.clear());
    expect(result.current.isGarrisonOpen).toBe(false);
    expect(result.current.selectedGarrisonLines).toHaveLength(0);
  });

  it('subtitle with multiple allied villages shows count', () => {
    const multiLines: GarrisonLine[] = [
      makeIncoming(ARCHER, 'v1'),
      { ...makeIncoming(ARCHER, 'v2'), originVillageName: 'Fort Ally 2', originPlayerName: 'Carol' },
    ];
    const { result } = renderHook(() => useGarrisonSelection(multiLines, troops));
    act(() => result.current.selectTroop(ARCHER, 'INCOMING'));
    expect(result.current.selectedGarrisonSubtitle).toBe('2 villages alliés');
  });
});
