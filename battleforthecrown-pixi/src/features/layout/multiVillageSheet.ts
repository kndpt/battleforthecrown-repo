import type { JoinedVillage } from '@/api';
import type {
  MultiVillageBottomSheetLabels,
  MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';

export const multiVillageBottomSheetLabels: MultiVillageBottomSheetLabels = {
  activeFilter: 'Actif',
  allFilter: 'Tous',
  alertsFilter: 'Alertes',
  buildActivity: 'Construction',
  close: 'Fermer',
  empty: 'Aucun village à afficher',
  eyebrow: 'Royaume',
  levelPrefix: 'Niv.',
  lordActivity: 'Seigneur',
  noActivity: 'Aucune activité',
  sort: 'Trier',
  title: 'Mes villages',
  troopsActivity: 'Troupes',
};

export function getVillageSelectorLabel(village: JoinedVillage) {
  const prefix = village.isCapital
    ? 'Capitale'
    : village.label
      ? VILLAGE_LABEL_DISPLAY[village.label]
      : 'Village';

  return `${prefix} — ${village.name}`;
}

export function buildMultiVillageSheetItems(
  villages: JoinedVillage[],
  activeVillageId: string | null,
  powerByVillageId: ReadonlyMap<string, number> = new Map(),
): MultiVillageItem[] {
  return villages.map((village) => ({
    active: village.id === activeVillageId,
    badge: village.isCapital
      ? 'Capitale'
      : village.label
        ? VILLAGE_LABEL_DISPLAY[village.label]
        : null,
    capitale: village.isCapital,
    coords: `${village.x}:${village.y}`,
    id: village.id,
    name: village.name,
    power: powerByVillageId.get(village.id)?.toLocaleString('fr-FR'),
  }));
}
