import type { ArmyUnitDto } from '@/api/queries';
import type { GarrisonLine, UnitType } from '@/lib/types';
import { unitMetaFor } from '@/features/army/unitConfig';
import type { MapEntityCalloutSection } from '@/features/design-system/components';

export interface TroopSummaryRow {
  icon?: string;
  label: string;
  quantity: number;
  unitType: UnitType;
}

export function summarizePresentTroops(
  inventory: ArmyUnitDto[],
  garrison: GarrisonLine[],
): TroopSummaryRow[] {
  const quantities = new Map<UnitType, number>();

  for (const unit of inventory) {
    addQuantity(quantities, unit.type as UnitType, unit.quantity);
  }

  for (const line of garrison) {
    if (line.direction === 'INCOMING') {
      addQuantity(quantities, line.unitType, line.quantity);
    }
  }

  return [...quantities.entries()]
    .filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([unitType, quantity]) => {
      const meta = unitMetaFor(unitType);
      return {
        icon: meta.iconPath ?? meta.emoji,
        label: meta.name,
        quantity,
        unitType,
      };
    });
}

export function buildTroopsSection(rows: TroopSummaryRow[]): MapEntityCalloutSection {
  return {
    title: 'Troupes présentes',
    rows: rows.length > 0
      ? rows.map((row) => ({
          icon: row.icon,
          label: row.label,
          value: row.quantity.toLocaleString('fr-FR'),
        }))
      : [{ label: 'Aucune troupe', value: '' }],
  };
}

function addQuantity(
  quantities: Map<UnitType, number>,
  unitType: UnitType,
  quantity: number,
) {
  if (quantity <= 0) return;
  quantities.set(unitType, (quantities.get(unitType) ?? 0) + quantity);
}
