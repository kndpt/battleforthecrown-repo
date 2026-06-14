import { useCallback, useMemo, useState } from 'react';
import type { ArmySupportRow, ArmyTroop, ArmyVillageRow } from '@/features/design-system/components';
import type { GarrisonLine } from '@/lib/types';

function formatGarrisonOriginsSubtitle(lines: GarrisonLine[]): string | null {
  const origins = new Map<string, { playerName: string | null; villageName: string }>();

  for (const line of lines) {
    origins.set(line.originVillageId, {
      playerName: line.originPlayerName ?? null,
      villageName: line.originVillageName ?? `Village ${line.originVillageId}`,
    });
  }

  if (origins.size === 0) return null;
  if (origins.size > 1) return `${origins.size} villages alliés`;

  const origin = Array.from(origins.values())[0];
  return origin.playerName
    ? `${origin.villageName} · ${origin.playerName}`
    : origin.villageName;
}

export interface GarrisonSelectionState {
  selectedGarrisonLines: GarrisonLine[];
  selectedGarrisonTitle: string | undefined;
  selectedGarrisonSubtitle: string | null;
  isGarrisonOpen: boolean;
  clear: () => void;
  selectTroop: (troopId: string, direction?: GarrisonLine['direction']) => void;
  onSupportRowSelect: (row: ArmySupportRow) => void;
  onVillageRowSelect: (row: ArmyVillageRow) => void;
}

export function useGarrisonSelection(
  garrisonLines: GarrisonLine[],
  troops: ArmyTroop[],
): GarrisonSelectionState {
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<GarrisonLine['direction'] | null>(null);
  const [selectedTroopId, setSelectedTroopId] = useState<string | null>(null);

  const selectedLines = useMemo(() => {
    if (selectedVillageId) {
      return garrisonLines.filter(
        (line) => line.direction === 'OUTGOING' && line.villageId === selectedVillageId,
      );
    }
    if (selectedTroopId) {
      return garrisonLines.filter(
        (line) =>
          line.unitType === selectedTroopId &&
          (!selectedDirection || line.direction === selectedDirection),
      );
    }
    return [];
  }, [garrisonLines, selectedDirection, selectedTroopId, selectedVillageId]);

  const selectedTroop = useMemo(
    () => (selectedTroopId ? (troops.find((t) => t.id === selectedTroopId) ?? null) : null),
    [selectedTroopId, troops],
  );

  const title = useMemo(() => {
    if (selectedVillageId) return selectedLines[0]?.hostVillageName ?? 'Stationnées ailleurs';
    if (selectedDirection === 'INCOMING' && selectedTroop) return `${selectedTroop.name} alliés`;
    return selectedTroop?.name;
  }, [selectedDirection, selectedLines, selectedTroop, selectedVillageId]);

  const subtitle = useMemo(() => {
    if (selectedVillageId) return selectedLines[0]?.hostPlayerName ?? null;
    if (selectedDirection === 'INCOMING') return formatGarrisonOriginsSubtitle(selectedLines);
    return null;
  }, [selectedDirection, selectedLines, selectedVillageId]);

  const clear = useCallback(() => {
    setSelectedVillageId(null);
    setSelectedDirection(null);
    setSelectedTroopId(null);
  }, []);

  const selectTroop = useCallback((troopId: string, direction?: GarrisonLine['direction']) => {
    setSelectedVillageId(null);
    setSelectedDirection(direction ?? null);
    setSelectedTroopId(troopId);
  }, []);

  const onSupportRowSelect = useCallback((row: ArmySupportRow) => {
    setSelectedDirection(null);
    setSelectedTroopId(null);
    setSelectedVillageId(row.id);
  }, []);

  const onVillageRowSelect = useCallback((row: ArmyVillageRow) => {
    setSelectedVillageId(null);
    if (row.alliedQuantity > 0) {
      setSelectedDirection('INCOMING');
      setSelectedTroopId(row.id);
    }
  }, []);

  return {
    selectedGarrisonLines: selectedLines,
    selectedGarrisonTitle: title,
    selectedGarrisonSubtitle: subtitle,
    isGarrisonOpen: Boolean(title && selectedLines.length > 0),
    clear,
    selectTroop,
    onSupportRowSelect,
    onVillageRowSelect,
  };
}
