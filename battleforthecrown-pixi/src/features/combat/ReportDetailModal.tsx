import { useEffect, useState } from 'react';
import { Sword, Trash2, X } from 'lucide-react';
import {
  Modal,
  ModalBody,
  Panel,
  PanelBody,
  PanelHeader,
  ResourceIcon,
  Spinner,
  Tooltip,
} from '@/ui';
import {
  useCombatReportQuery,
  useDeleteReportMutation,
  useMarkReportReadMutation,
  type CombatReportDto,
} from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { unitMetaFor } from '@/features/army/unitConfig';
import { formatResourceAmount } from '@/lib/resourceConfig';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function totalQty(map: Record<string, number>): number {
  return Object.values(map ?? {}).reduce((s, v) => s + v, 0);
}

function reportOutcome(report: CombatReportDto): { label: string; isVictory: boolean } {
  const attackerLosses = totalQty(report.lossesAttacker);
  const defenderLosses = totalQty(report.lossesDefender);
  const isVictory = report.isAttacker
    ? defenderLosses >= attackerLosses
    : attackerLosses >= defenderLosses;
  return { label: isVictory ? 'VICTOIRE !' : 'DÉFAITE', isVictory };
}

function UnitsTable({ report }: { report: CombatReportDto }) {
  const allTypes = Array.from(
    new Set([
      ...Object.keys(report.totalUnitsAttacker ?? {}),
      ...Object.keys(report.totalUnitsDefender ?? {}),
    ]),
  ).sort();

  if (allTypes.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic text-center py-4">Aucune unité</div>
    );
  }

  return (
    <div className="space-y-3">
      {allTypes.map((unitType) => {
        const meta = unitMetaFor(unitType);
        const attackerTotal = report.totalUnitsAttacker[unitType] ?? 0;
        const defenderTotal = report.totalUnitsDefender?.[unitType] ?? 0;
        const attackerLosses = report.lossesAttacker[unitType] ?? 0;
        const defenderLosses = report.lossesDefender?.[unitType] ?? 0;

        if (attackerTotal === 0 && defenderTotal === 0) return null;

        return (
          <Tooltip key={unitType} content={meta.name} variant="dark" display="block">
            <div className="bg-white/30 rounded-md border border-gray-300 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex flex-col items-center">
                  {attackerTotal > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-game-red-dark">
                        {attackerTotal}
                      </span>
                      {attackerLosses > 0 && (
                        <span className="text-[10px] font-bold text-game-red-dark">
                          (-{attackerLosses})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>

                <div className="flex flex-col items-center flex-shrink-0">
                  {meta.iconPath ? (
                    <img
                      src={meta.iconPath}
                      alt={meta.name}
                      width={24}
                      height={24}
                      className="rounded object-contain"
                    />
                  ) : (
                    <span className="text-xl" aria-hidden>
                      {meta.emoji}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center">
                  {defenderTotal > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-game-blue-dark">
                        {defenderTotal}
                      </span>
                      {defenderLosses > 0 && (
                        <span className="text-[10px] font-bold text-game-blue-dark">
                          (-{defenderLosses})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function ReportDetailModal({ reportId, onClose }: ReportDetailModalProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const report = useCombatReportQuery(reportId, userId);
  const { mutate: markRead } = useMarkReportReadMutation();
  const { mutateAsync: deleteReport } = useDeleteReportMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userId || !report.data || report.data.isRead) return;
    markRead({ reportId, userId });
  }, [userId, report.data, reportId, markRead]);

  const handleDelete = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      await deleteReport({ reportId, userId });
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md" variant="default">
      <ModalBody className="!p-0 relative flex flex-col overflow-hidden h-[90vh] max-h-[90vh]">
        {report.isLoading || !report.data ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          (() => {
            const data = report.data;
            const outcome = reportOutcome(data);
            const loot = data.loot?.resources ?? {};
            const remaining = data.loot?.remainingResources ?? {};
            const targetLabel =
              data.targetKind === 'BARBARIAN_VILLAGE' ? 'Village barbare' : 'Village joueur';
            const formattedDate = DATE_FORMATTER.format(new Date(data.timestamp));
            const hasAnyResource = (['wood', 'stone', 'iron'] as const).some(
              (t) => (loot[t] ?? 0) + (remaining[t] ?? 0) > 0,
            );

            return (
              <>
                <header className="px-4 py-3 bg-gradient-to-r from-[#8b6f47] via-[#6f5139] to-[#5d4a32] border-b-2 border-[#3d2f1f] flex items-center gap-2 flex-shrink-0">
                  <div className="w-9" aria-hidden />
                  <div className="flex-1 text-center">
                    <h1 className="font-cinzel font-bold text-white text-shadow-game">
                      Rapport de Combat
                    </h1>
                    <p className="text-[10px] text-gray-200">{formattedDate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                  <Panel variant="parchment" padding="none">
                    <PanelHeader variant="parchment">
                      <span>Informations de combat</span>
                    </PanelHeader>
                    <PanelBody>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Cible</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {targetLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Position</span>
                          <span className="text-sm font-semibold text-gray-800">
                            ({data.targetX}, {data.targetY})
                          </span>
                        </div>
                      </div>
                    </PanelBody>
                  </Panel>

                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-400 to-gray-400" />
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 shadow-lg ${
                        outcome.isVictory
                          ? 'bg-gradient-to-br from-[#f1c40f] to-[#d4a017] border-[#9e7b0d]'
                          : 'bg-gradient-to-br from-game-red-light to-game-red-dark border-game-red-border'
                      }`}
                    >
                      <Sword className="w-5 h-5 text-white" />
                      <span className="font-cinzel text-sm font-bold text-white text-shadow-game">
                        {outcome.label}
                      </span>
                      <Sword className="w-5 h-5 text-white transform rotate-180" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-400 to-gray-400" />
                  </div>

                  <Panel variant="default" padding="none">
                    <PanelHeader variant="parchment">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-game-red-light border border-game-red-border" />
                          <span className="text-sm">Attaquant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Défenseur</span>
                          <div className="w-3 h-3 rounded-full bg-game-blue-light border border-game-blue-border" />
                        </div>
                      </div>
                    </PanelHeader>
                    <PanelBody>
                      <UnitsTable report={data} />
                    </PanelBody>
                  </Panel>

                  {hasAnyResource && (
                    <Panel variant="default" padding="none">
                      <PanelHeader variant="parchment">
                        <span>Ressources pillées</span>
                      </PanelHeader>
                      <PanelBody>
                        <div className="grid grid-cols-3 gap-2">
                          {(['wood', 'stone', 'iron'] as const).map((type) => {
                            const pillaged = loot[type] ?? 0;
                            const left = remaining[type] ?? 0;
                            const total = pillaged + left;
                            const isZero = total === 0;
                            return (
                              <div
                                key={type}
                                className="flex flex-col items-center gap-1 min-w-0"
                              >
                                <ResourceIcon resource={type} size={28} showTooltip />
                                <div
                                  className={`flex items-baseline gap-0.5 font-bold ${
                                    isZero ? 'text-gray-400' : 'text-gray-900'
                                  }`}
                                >
                                  <span className="text-xs text-game-green-light">
                                    {formatResourceAmount(pillaged)}
                                  </span>
                                  <span className="text-[10px] text-gray-500">/</span>
                                  <span className="text-xs">
                                    {formatResourceAmount(total)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </PanelBody>
                    </Panel>
                  )}
                </div>

                <footer className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-[#8b6f47] via-[#6f5139] to-[#5d4a32] border-t-2 border-[#3d2f1f] shadow-[0_-2px_8px_rgba(0,0,0,0.3)] px-4 flex items-center justify-center z-20">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label="Supprimer le rapport"
                    title="Supprimer le rapport"
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-b from-game-red-light to-game-red-dark border-2 border-game-red-border text-white shadow-game-inset-red hover:brightness-110 active:translate-y-0.5 active:shadow-game-pressed transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={22} strokeWidth={2.5} />
                  </button>
                </footer>
              </>
            );
          })()
        )}

        {report.error && (
          <div className="p-4 text-sm text-game-red-dark font-game text-center">
            Impossible de charger le rapport.
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
