import { useDisplayResources } from './useDisplayResources';
import { useGameStore } from '@/stores/game';

const formatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function ResourceBar() {
  const villageId = useGameStore((state) => state.villageId);
  const { display, productionRates, hasSnapshot } = useDisplayResources(villageId);

  if (!villageId) {
    return null;
  }

  const items: Array<{ label: string; value: number; rate: number; color: string }> = display
    ? [
        { label: 'Bois', value: display.wood, rate: productionRates?.wood ?? 0, color: 'text-amber-200' },
        { label: 'Pierre', value: display.stone, rate: productionRates?.stone ?? 0, color: 'text-stone-300' },
        { label: 'Fer', value: display.iron, rate: productionRates?.iron ?? 0, color: 'text-slate-300' },
      ]
    : [];

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-md border-2 border-game-gold-border bg-black/60 px-4 py-2 text-sm text-white shadow-game-inset">
      {hasSnapshot ? (
        items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <span className={`font-game text-xs uppercase tracking-widest ${item.color}`}>{item.label}</span>
            <span className="font-bold tabular-nums">{formatter.format(item.value)}</span>
            <span className="text-[10px] text-parchment/70">+{item.rate}/h</span>
          </div>
        ))
      ) : (
        <span className="text-parchment/70">Chargement des ressources…</span>
      )}
      {display && (
        <span className="ml-auto text-[10px] text-parchment/60">
          plafond {formatter.format(display.maxPerType)}
        </span>
      )}
    </div>
  );
}
