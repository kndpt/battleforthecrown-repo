import { useEffect } from 'react';
import { Swords, X } from 'lucide-react';
import {
  Badge,
  InputHelperText,
  Modal,
  ModalBody,
  Panel,
  PanelBody,
  PanelHeader,
  ResourceIcon,
  Spinner,
} from '@/ui';
import {
  useCombatReportQuery,
  useMarkReportReadMutation,
  type CombatReportDto,
} from '@/api/queries';
import { useAuthStore } from '@/stores/auth';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

function totalQty(map: Record<string, number>): number {
  return Object.values(map ?? {}).reduce((s, v) => s + v, 0);
}

function UnitsBlock({ title, units, losses }: {
  title: string;
  units: Record<string, number>;
  losses: Record<string, number>;
}) {
  const entries = Object.entries(units ?? {}).filter(([, q]) => q > 0);
  if (entries.length === 0) {
    return (
      <Panel variant="stone" padding="md">
        <PanelHeader variant="default" size="sm">
          <span className="text-xs uppercase tracking-wide font-bold">{title}</span>
        </PanelHeader>
        <PanelBody>
          <p className="text-xs text-white/70 italic">Aucune unité.</p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <Panel variant="stone" padding="none">
      <PanelHeader variant="default" size="sm">
        <span className="text-xs uppercase tracking-wide font-bold">{title}</span>
      </PanelHeader>
      <PanelBody>
        <ul className="space-y-1">
          {entries.map(([type, qty]) => {
            const lost = losses?.[type] ?? 0;
            return (
              <li
                key={type}
                className="flex items-center justify-between text-xs text-white/90 font-game"
              >
                <span>{type}</span>
                <span className="tabular-nums">
                  {qty}
                  {lost > 0 && <span className="text-game-red-light"> (-{lost})</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </PanelBody>
    </Panel>
  );
}

function reportOutcome(report: CombatReportDto): { label: string; isVictory: boolean } {
  const attackerLosses = totalQty(report.lossesAttacker);
  const defenderLosses = totalQty(report.lossesDefender);
  const isVictory = report.isAttacker
    ? defenderLosses >= attackerLosses
    : attackerLosses >= defenderLosses;
  return { label: isVictory ? 'Victoire' : 'Défaite', isVictory };
}

export function ReportDetailModal({ reportId, onClose }: ReportDetailModalProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const report = useCombatReportQuery(reportId, userId);
  const markRead = useMarkReportReadMutation();

  useEffect(() => {
    if (!userId || !report.data || report.data.isRead) return;
    markRead.mutate({ reportId, userId });
  }, [userId, report.data, reportId, markRead]);

  return (
    <Modal isOpen onClose={onClose} size="lg" variant="default">
      <ModalBody className="!p-0 relative flex flex-col overflow-hidden h-[90vh] max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-white" />
        </button>

        {report.isLoading || !report.data ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          (() => {
            const data = report.data;
            const outcome = reportOutcome(data);
            const loot = data.loot?.resources ?? {};
            const totalLoot = (loot.wood ?? 0) + (loot.stone ?? 0) + (loot.iron ?? 0);

            return (
              <>
                <div className="relative h-32 bg-gradient-to-br from-game-blue-light to-game-blue-dark border-b-4 border-game-blue-border flex-shrink-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-1" aria-hidden>
                      {data.isAttacker ? '⚔️' : '🛡️'}
                    </div>
                    <h2 className="font-cinzel text-xl font-bold text-white text-shadow">
                      {data.isAttacker ? 'Attaque' : 'Défense'} — ({data.targetX},{' '}
                      {data.targetY})
                    </h2>
                    <Badge
                      variant={outcome.isVictory ? 'success' : 'error'}
                      size="md"
                      className="mt-2"
                    >
                      {outcome.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-xs text-kingdom-600 font-game text-center">
                    {new Date(data.timestamp).toLocaleString('fr-FR')}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <UnitsBlock
                      title="Attaquant"
                      units={data.totalUnitsAttacker}
                      losses={data.lossesAttacker}
                    />
                    <UnitsBlock
                      title="Défenseur"
                      units={data.totalUnitsDefender}
                      losses={data.lossesDefender}
                    />
                  </div>

                  {totalLoot > 0 && (
                    <Panel variant="parchment" padding="md">
                      <PanelHeader variant="parchment" size="sm">
                        <span className="text-xs uppercase tracking-wide font-bold">
                          Butin rapporté
                        </span>
                      </PanelHeader>
                      <PanelBody>
                        <div className="flex flex-wrap gap-3 justify-center">
                          {(['wood', 'stone', 'iron'] as const).map((res) =>
                            loot[res] ? (
                              <div
                                key={res}
                                className="flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded border bg-game-green-light/20 border-game-green-border/30 text-game-green-dark"
                              >
                                <ResourceIcon resource={res} size={16} />
                                <span>+{NUMBER_FORMATTER.format(loot[res] ?? 0)}</span>
                              </div>
                            ) : null,
                          )}
                        </div>
                      </PanelBody>
                    </Panel>
                  )}

                  {data.loot?.honor !== undefined && data.loot.honor !== 0 && (
                    <Panel variant="warning" padding="md">
                      <div className="flex items-center justify-center gap-2 font-game text-sm">
                        <Swords size={16} />
                        <span>
                          Honneur : <strong>{data.loot.honor > 0 ? '+' : ''}{data.loot.honor}</strong>
                        </span>
                      </div>
                    </Panel>
                  )}
                </div>
              </>
            );
          })()
        )}

        {report.error && (
          <div className="p-4">
            <InputHelperText variant="error">Impossible de charger le rapport.</InputHelperText>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
