import { ResourceDisplay, type ResourceDisplayItem } from '@/ui';
import { useDisplayResources } from './useDisplayResources';
import { useGameStore } from '@/stores/game';

export function ResourceBar({ compact = false }: { compact?: boolean }) {
  const villageId = useGameStore((state) => state.villageId);
  const { display, productionRates, hasSnapshot } = useDisplayResources(villageId);

  if (!villageId) return null;

  if (!hasSnapshot || !display) {
    return (
      <span className="text-xs text-[#f5e6d3]/70 font-game">Chargement des ressources…</span>
    );
  }

  const items: ResourceDisplayItem[] = [
    {
      type: 'wood',
      current: Math.round(display.wood),
      max: display.maxPerType,
      production: productionRates?.wood,
    },
    {
      type: 'stone',
      current: Math.round(display.stone),
      max: display.maxPerType,
      production: productionRates?.stone,
    },
    {
      type: 'iron',
      current: Math.round(display.iron),
      max: display.maxPerType,
      production: productionRates?.iron,
    },
  ];

  return <ResourceDisplay resources={items} compact={compact} />;
}
