import { RotateCcw } from 'lucide-react';
import { useRecallExpeditionMutation } from '@/api/queries';
import { Badge, Button, Panel, PanelBody, PanelHeader } from '@/ui';
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

const KIND_LABEL: Record<string, { label: string; variant: 'warning' | 'info' }> = {
  ATTACK: { label: 'Attaque', variant: 'warning' },
  REINFORCE: { label: 'Renfort', variant: 'info' },
};

function formatCoord(value: number): string {
  return String(Math.round(value));
}

export function ExpeditionList() {
  const expeditions = useExpeditionsStore((state) => state.byId);
  const recallExpedition = useRecallExpeditionMutation();
  const now = useTickingNow(1_000);
  const list = Object.values(expeditions);
  const pendingRecallId = recallExpedition.variables?.expeditionId;

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
              const kind = exp.kind === 'REINFORCE' ? KIND_LABEL.REINFORCE : KIND_LABEL.ATTACK;
              const canRecall = exp.phase === 'EN_ROUTE' && exp.kind !== 'REINFORCE';
              const isRecallPending = pendingRecallId === exp.expeditionId;
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
                    <div className="flex items-center gap-1">
                      <Badge variant={kind.variant} size="sm">
                        {kind.label}
                      </Badge>
                      <Badge variant={phase.variant} size="sm">
                        {phase.label}
                      </Badge>
                    </div>
                    <span className="tabular-nums text-[10px] text-white/70">
                      {remainingMs > 0 ? formatRemaining(remainingMs) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-game">
                    {exp.phase === 'RETURNING'
                      ? `Retour vers (${formatCoord(exp.origin.x)},${formatCoord(exp.origin.y)})`
                      : `(${formatCoord(exp.origin.x)},${formatCoord(exp.origin.y)}) → (${formatCoord(exp.target.x)},${formatCoord(exp.target.y)})`}
                  </p>
                  {exp.phase === 'RESOLVED' && exp.isVictory != null && (
                    <p className="mt-1">
                      <Badge variant={exp.isVictory ? 'success' : 'error'} size="sm">
                        {exp.isVictory ? 'Victoire' : 'Défaite'}
                      </Badge>
                    </p>
                  )}
                  {canRecall && (
                    <Button
                      variant="danger"
                      size="xs"
                      className="mt-2 w-full"
                      disabled={recallExpedition.isPending}
                      title="Rappeler l'attaque avant son arrivée"
                      onClick={() =>
                        recallExpedition.mutate({
                          expeditionId: exp.expeditionId,
                          villageId: exp.villageId,
                        })
                      }
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <RotateCcw size={13} aria-hidden />
                        <span>{isRecallPending ? 'Rappel...' : 'Rappeler'}</span>
                      </span>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {recallExpedition.isError && (
            <p className="rounded border border-red-300/40 bg-red-950/50 px-2 py-1 text-[11px] text-red-100">
              Impossible de rappeler cette attaque pour le moment.
            </p>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
