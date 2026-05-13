import { useEffect, useState } from 'react';
import { Sword, Trash2 } from 'lucide-react';
import {
  Panel,
  PanelBody,
  PanelHeader,
  ResourceIcon,
  Spinner,
  Tooltip,
} from '@/ui';
import {
  useDeleteScoutReportMutation,
  useCombatReportQuery,
  useDeleteReportMutation,
  useMarkReportReadMutation,
  useMarkScoutReportReadMutation,
  useScoutReportQuery,
  type CombatReportDto,
} from '@/api/queries';
import { unitMetaFor } from '@/features/army/unitConfig';
import { formatResourceAmount } from '@/lib/resourceConfig';
import { publicAsset } from '@/lib/publicAsset';
import { BaseModal } from '@/features/design-system/components';
import { ScoutReportCard } from '@/features/design-system/components/ScoutReportCard';
import { buildScoutReportCardProps } from './scoutReportView';

interface ReportDetailModalProps {
  reportId: string;
  reportKind: 'combat' | 'scout';
  onClose: () => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const REPORT_MODAL_FOOTER_CLASS =
  'border-t border-[rgba(93,74,50,.24)] bg-[linear-gradient(to_bottom,rgba(255,250,238,.96),rgba(232,212,168,.92))] px-3 pb-3 pt-2.5';

function ReportModalFooter({
  deleteLabel,
  disabled,
  onClose,
  onDelete,
}: {
  deleteLabel: string;
  disabled: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        aria-label={deleteLabel}
        className="flex aspect-square h-10 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-2 border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] text-white shadow-[0_2px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={onDelete}
        title="Supprimer"
        type="button"
      >
        <Trash2 size={19} strokeWidth={2.5} />
      </button>
      <button
        className="flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[9px] border-2 border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] px-3 py-2 font-game text-xs font-bold uppercase tracking-[.08em] text-white shadow-[0_2px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]"
        onClick={onClose}
        type="button"
      >
        Fermer
      </button>
    </div>
  );
}

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

function ScoutReportDetail({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const report = useScoutReportQuery(reportId);
  const { mutate: markRead } = useMarkScoutReportReadMutation();
  const { mutateAsync: deleteReport } = useDeleteScoutReportMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!report.data || report.data.isRead) return;
    markRead({ reportId });
  }, [report.data, reportId, markRead]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteReport({ reportId });
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression du rapport scout:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        <BaseModal
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
          footer={
            report.data ? (
              <ReportModalFooter
                deleteLabel="Supprimer le rapport scout"
                disabled={isDeleting}
                onClose={onClose}
                onDelete={handleDelete}
              />
            ) : null
          }
          footerClassName={REPORT_MODAL_FOOTER_CLASS}
          headerClassName="px-4 py-4"
          maxHeight="min(90dvh, 760px)"
          onClose={onClose}
          title={
            <span className="flex items-center gap-3 uppercase tracking-[.08em] text-[#3d2f1f]">
              <img alt="" className="size-[26px]" src={publicAsset('/assets/lupa.png')} />
              Rapport scout
            </span>
          }
          tone="blue"
          width={360}
        >
          {report.isLoading || !report.data ? (
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <ScoutReportCard
              {...buildScoutReportCardProps(report.data, handleDelete, isDeleting)}
              className="min-h-full w-full max-w-none rounded-none border-0 shadow-none"
              hideFooter
              hideHeader
            />
          )}

          {report.error && (
            <div className="p-4 text-sm text-game-red-dark font-game text-center">
              Impossible de charger le rapport scout.
            </div>
          )}
        </BaseModal>
      </div>
    </div>
  );
}

export function ReportDetailModal({ reportId, reportKind, onClose }: ReportDetailModalProps) {
  return reportKind === 'scout'
    ? <ScoutReportDetail reportId={reportId} onClose={onClose} />
    : <CombatReportDetail reportId={reportId} onClose={onClose} />;
}

function CombatReportDetail({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const report = useCombatReportQuery(reportId);
  const { mutate: markRead } = useMarkReportReadMutation();
  const { mutateAsync: deleteReport } = useDeleteReportMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!report.data || report.data.isRead) return;
    markRead({ reportId });
  }, [report.data, reportId, markRead]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteReport({ reportId });
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const data = report.data;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        <BaseModal
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
          footer={
            data ? (
              <ReportModalFooter
                deleteLabel="Supprimer le rapport"
                disabled={isDeleting}
                onClose={onClose}
                onDelete={handleDelete}
              />
            ) : null
          }
          footerClassName={REPORT_MODAL_FOOTER_CLASS}
          headerClassName="px-4 py-4"
          maxHeight="min(90dvh, 760px)"
          onClose={onClose}
          title={
            <span className="flex items-center gap-3 uppercase tracking-[.08em] text-[#3d2f1f]">
              <Sword className="size-5 text-[#a93226]" strokeWidth={2.5} />
              Rapport de combat
            </span>
          }
          tone="red"
          width={360}
        >
          {report.isLoading || !data ? (
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            (() => {
              const outcome = reportOutcome(data);
              const loot = data.loot?.resources ?? {};
              const remaining = data.loot?.remainingResources ?? {};
              const targetLabel =
                data.targetKind === 'BARBARIAN_VILLAGE'
                  ? `Village barbare${data.details?.targetTier ? ` ${data.details.targetTier}` : ''}`
                  : 'Village joueur';
              const formattedDate = DATE_FORMATTER.format(new Date(data.timestamp));
              const hasAnyResource = (['wood', 'stone', 'iron'] as const).some(
                (t) => (loot[t] ?? 0) + (remaining[t] ?? 0) > 0,
              );

              return (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  <Panel variant="parchment" padding="none">
                    <PanelHeader variant="parchment">
                      <span>Informations de combat</span>
                    </PanelHeader>
                    <PanelBody>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-600">Cible</span>
                          <span className="text-right text-sm font-semibold text-gray-800">
                            {targetLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-600">Position</span>
                          <span className="text-sm font-semibold text-gray-800">
                            ({data.targetX}, {data.targetY})
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-600">Date</span>
                          <span className="text-right text-sm font-semibold text-gray-800">
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    </PanelBody>
                  </Panel>

                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-400 to-gray-400" />
                    <div
                      className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 shadow-lg ${
                        outcome.isVictory
                          ? 'border-[#9e7b0d] bg-gradient-to-br from-[#f1c40f] to-[#d4a017]'
                          : 'border-game-red-border bg-gradient-to-br from-game-red-light to-game-red-dark'
                      }`}
                    >
                      <Sword className="h-5 w-5 text-white" />
                      <span className="font-cinzel text-sm font-bold text-white text-shadow-game">
                        {outcome.label}
                      </span>
                      <Sword className="h-5 w-5 rotate-180 transform text-white" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-400 to-gray-400" />
                  </div>

                  <Panel variant="default" padding="none">
                    <PanelHeader variant="parchment">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full border border-game-red-border bg-game-red-light" />
                          <span className="text-sm">Attaquant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Défenseur</span>
                          <div className="h-3 w-3 rounded-full border border-game-blue-border bg-game-blue-light" />
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
                                className="flex min-w-0 flex-col items-center gap-1"
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
              );
            })()
          )}

          {report.error && (
            <div className="p-4 text-center font-game text-sm text-game-red-dark">
              Impossible de charger le rapport.
            </div>
          )}
        </BaseModal>
      </div>
    </div>
  );
}
