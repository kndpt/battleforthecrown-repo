import { useExpeditionsStore } from '@/stores/expeditions';
import { useTickingNow } from '@/lib/useTickingNow';
import { formatRemaining } from '@/features/village/constructionProgress';

const PHASE_LABEL: Record<string, { label: string; color: string }> = {
  EN_ROUTE: { label: 'En route', color: 'text-game-green-light' },
  RESOLVED: { label: 'Combat', color: 'text-game-gold-light' },
  RETURNING: { label: 'Retour', color: 'text-game-blue-light' },
  RETURNED: { label: 'Terminée', color: 'text-parchment/70' },
};

export function ExpeditionList() {
  const expeditions = useExpeditionsStore((state) => state.byId);
  const now = useTickingNow(1_000);
  const list = Object.values(expeditions);

  if (list.length === 0) {
    return (
      <aside className="pointer-events-auto rounded-md border-2 border-game-gold-border/60 bg-black/60 p-3 text-xs text-parchment/80">
        Aucune expédition active.
      </aside>
    );
  }

  return (
    <aside className="pointer-events-auto w-full max-w-xs space-y-2 rounded-md border-2 border-game-gold-border bg-black/70 p-3 text-xs text-white shadow-game-inset">
      <header className="flex items-center justify-between text-[10px] uppercase tracking-widest text-game-gold-light">
        <span>Expéditions</span>
        <span>{list.length}</span>
      </header>
      <ul className="space-y-2">
        {list.map((exp) => {
          const phase = PHASE_LABEL[exp.phase] ?? PHASE_LABEL.EN_ROUTE;
          const remainingMs = exp.phase === 'EN_ROUTE'
            ? exp.arrivalAt - now
            : exp.phase === 'RETURNING' && exp.returnAt
              ? exp.returnAt - now
              : 0;
          return (
            <li key={exp.expeditionId} className="rounded border border-game-gold-border/60 bg-[#1a120b]/80 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] uppercase tracking-widest ${phase.color}`}>{phase.label}</span>
                <span className="tabular-nums text-[10px] text-parchment/70">
                  {remainingMs > 0 ? formatRemaining(remainingMs) : '—'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-parchment">
                ({exp.origin.x},{exp.origin.y}) → ({exp.target.x},{exp.target.y})
              </p>
              {exp.phase === 'RESOLVED' && exp.isVictory != null && (
                <p className={`text-[10px] uppercase tracking-widest ${exp.isVictory ? 'text-game-green-light' : 'text-game-red-light'}`}>
                  {exp.isVictory ? 'Victoire' : 'Défaite'}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
