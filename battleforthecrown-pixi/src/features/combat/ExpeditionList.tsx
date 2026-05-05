import { Badge, Panel, PanelBody, PanelHeader } from '@/ui';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useTickingNow } from '@/lib/useTickingNow';
import { formatRemaining } from '@/features/village/constructionProgress';

const PHASE_LABEL: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  EN_ROUTE: { label: 'En route', variant: 'success' },
  RESOLVED: { label: 'Combat', variant: 'warning' },
  RETURNING: { label: 'Retour', variant: 'info' },
  RETURNED: { label: 'Terminée', variant: 'neutral' },
};

export function ExpeditionList() {
  const expeditions = useExpeditionsStore((state) => state.byId);
  const now = useTickingNow(1_000);
  const list = Object.values(expeditions);

  if (list.length === 0) {
    return (
      <div className="pointer-events-auto w-full max-w-xs">
        <Panel variant="stone" padding="md" className="opacity-80">
          <p className="text-xs text-white/80 font-game">Aucune expédition active.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto w-full max-w-xs">
      <Panel variant="stone" padding="none" className="shadow-lg">
        <PanelHeader variant="default" className="!py-2">
          <div className="flex items-center justify-between w-full text-game-gold-light">
            <span className="font-cinzel text-xs uppercase tracking-widest">Expéditions</span>
            <span className="font-cinzel font-bold tabular-nums">{list.length}</span>
          </div>
        </PanelHeader>

        <PanelBody className="p-2 space-y-2">
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {list.map((exp) => {
              const phase = PHASE_LABEL[exp.phase] ?? PHASE_LABEL.EN_ROUTE;
              const remainingMs =
                exp.phase === 'EN_ROUTE'
                  ? exp.arrivalAt - now
                  : exp.phase === 'RETURNING' && exp.returnAt
                    ? exp.returnAt - now
                    : 0;
              return (
                <li
                  key={exp.expeditionId}
                  className="rounded border border-[#3d2f1f] bg-black/30 p-2 text-xs text-white"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant={phase.variant} size="sm">
                      {phase.label}
                    </Badge>
                    <span className="tabular-nums text-[10px] text-white/70">
                      {remainingMs > 0 ? formatRemaining(remainingMs) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-game">
                    ({exp.origin.x},{exp.origin.y}) → ({exp.target.x},{exp.target.y})
                  </p>
                  {exp.phase === 'RESOLVED' && exp.isVictory != null && (
                    <p className="mt-1">
                      <Badge variant={exp.isVictory ? 'success' : 'error'} size="sm">
                        {exp.isVictory ? 'Victoire' : 'Défaite'}
                      </Badge>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </PanelBody>
      </Panel>
    </div>
  );
}
