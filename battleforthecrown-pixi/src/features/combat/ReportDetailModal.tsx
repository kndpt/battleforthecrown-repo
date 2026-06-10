import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Spinner,
} from '@/ui';
import {
  useCaravanReportQuery,
  useDeleteScoutReportMutation,
  useCombatReportQuery,
  useDeleteCaravanReportMutation,
  useDeleteReportMutation,
  useMarkReportReadMutation,
  useMarkCaravanReportReadMutation,
  useMarkScoutReportReadMutation,
  useScoutReportQuery,
  useReinforcementReportQuery,
  useMarkReinforcementReportReadMutation,
  useDeleteReinforcementReportMutation,
} from '@/api/queries';
import { publicAsset } from '@/lib/publicAsset';
import { BaseModal, CombatReportModal, ReinforcementReportModal } from '@/features/design-system/components';
import { ScoutReportCard } from '@/features/design-system/components/ScoutReportCard';
import { buildCombatReportModalProps } from './combatReportView';
import { buildScoutReportCardProps } from './scoutReportView';
import { buildReinforcementReportModalProps } from './reinforcementReportView';
import {
  caravanReportResourceSections,
  caravanReportOriginVillage,
  caravanReportStateLabel,
  caravanReportSubject,
  caravanReportTargetVillage,
  caravanReportVillageLabel,
  caravanReportWhen,
  type CaravanReportResourceSection,
} from './caravanReportView';
import { useWorldMapNavigation } from '@/features/world/worldMapNavigation';

interface ReportDetailModalProps {
  reportId: string;
  reportKind: 'combat' | 'scout' | 'reinforcement' | 'caravan';
  onClose: () => void;
}

const REPORT_MODAL_FOOTER_CLASS =
  'border-t border-[rgba(93,74,50,.24)] bg-[linear-gradient(to_bottom,rgba(255,250,238,.96),rgba(232,212,168,.92))] px-3 pb-3 pt-2.5';
const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

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
  if (reportKind === 'scout') return <ScoutReportDetail reportId={reportId} onClose={onClose} />;
  if (reportKind === 'reinforcement') return <ReinforcementReportDetail reportId={reportId} onClose={onClose} />;
  if (reportKind === 'caravan') return <CaravanReportDetail reportId={reportId} onClose={onClose} />;
  return <CombatReportDetail reportId={reportId} onClose={onClose} />;
}

function CaravanResourceSection({ section }: { section: CaravanReportResourceSection }) {
  return (
    <section className="rounded-[10px] border-2 border-[#8b7355] bg-[rgba(255,250,238,.74)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-game text-xs font-black uppercase tracking-[.08em] text-[#5d4a32]">
          {section.label}
        </h3>
        <span className="rounded-full border border-[#8b7355] bg-[#fef9f0] px-2 py-0.5 font-game text-xs font-bold tabular-nums text-[#3d2f1f]">
          {NUMBER_FORMATTER.format(section.total)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {section.resources.map((resource) => (
          <div
            className="flex min-w-0 flex-col items-center gap-1 rounded-[8px] border border-[rgba(93,74,50,.24)] bg-[rgba(255,255,255,.35)] px-1.5 py-2 text-center"
            key={`${section.id}-${resource.key}`}
          >
            <img alt="" className="size-6 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]" src={publicAsset(resource.icon)} />
            <span className="font-game text-[10px] font-bold uppercase text-[#6d5838]">{resource.label}</span>
            <span className="font-game text-sm font-black tabular-nums text-[#2d2418]">{resource.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CaravanReportDetail({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const report = useCaravanReportQuery(reportId);
  const { mutate: markRead } = useMarkCaravanReportReadMutation();
  const { mutateAsync: deleteReport } = useDeleteCaravanReportMutation();
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
      console.error('Erreur lors de la suppression du rapport de caravane:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const data = report.data;
  const originVillage = data ? caravanReportOriginVillage(data) : null;
  const targetVillage = data ? caravanReportTargetVillage(data) : null;

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
                deleteLabel="Supprimer le rapport de caravane"
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
              <img alt="" className="size-[26px]" src={publicAsset('/assets/loot-rapport.png')} />
              Rapport caravane
            </span>
          }
          tone="gold"
          width={360}
        >
          {report.isLoading || !data ? (
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex min-h-full flex-col gap-3 bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] p-3">
              <div className="flex items-center gap-3 rounded-[12px] border-2 border-[#8b7355] bg-[rgba(255,250,238,.62)] p-3">
                <div className="flex size-[58px] shrink-0 items-center justify-center rounded-[12px] border-2 border-[#3c2619] bg-[linear-gradient(160deg,#7d612c_0%,#251a0b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_3px_0_rgba(0,0,0,.18)]">
                  <img alt="" className="w-[72%] object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,.55)]" src={publicAsset('/assets/resources/resources.png')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-game text-xl font-black leading-none text-[#7d612c] [text-shadow:0_1px_0_rgba(255,255,255,.6)]">
                    {caravanReportStateLabel(data)}
                  </div>
                  <div className="mt-1 font-game text-xs font-bold uppercase tracking-[.08em] text-[#6d5838]">
                    {caravanReportSubject(data)}
                  </div>
                  <div className="mt-1 font-game text-xs text-[#6d5838]">{caravanReportWhen(data)}</div>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[10px] border-2 border-[#8b7355] bg-[rgba(255,250,238,.74)] p-3">
                <div className="min-w-0 text-left">
                  <div className="font-game text-[10px] font-black uppercase tracking-[.08em] text-[#6d5838]">Origine</div>
                  <div className="truncate font-game text-sm font-black text-[#3d2f1f]">
                    {originVillage ? caravanReportVillageLabel(originVillage) : ''}
                  </div>
                  <div className="font-game text-xs text-[#6d5838]">
                    {originVillage ? `${originVillage.x}|${originVillage.y}` : ''}
                  </div>
                </div>
                <div className="rounded-full border-2 border-[#8b7355] bg-[#fef9f0] px-2 py-1 font-game text-xs font-black text-[#5d4a32]">
                  vers
                </div>
                <div className="min-w-0 text-right">
                  <div className="font-game text-[10px] font-black uppercase tracking-[.08em] text-[#6d5838]">Destination</div>
                  <div className="truncate font-game text-sm font-black text-[#3d2f1f]">
                    {targetVillage ? caravanReportVillageLabel(targetVillage) : ''}
                  </div>
                  <div className="font-game text-xs text-[#6d5838]">
                    {targetVillage ? `${targetVillage.x}|${targetVillage.y}` : ''}
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border-2 border-[#8b7355] bg-[rgba(255,250,238,.74)] px-3 py-2 font-game text-sm font-bold text-[#3d2f1f]">
                Porteurs mobilisés : <span className="tabular-nums">{NUMBER_FORMATTER.format(data.porters)}</span>
              </div>

              {caravanReportResourceSections(data).map((section) => (
                <CaravanResourceSection key={section.id} section={section} />
              ))}
            </div>
          )}

          {report.error && (
            <div className="p-4 text-center font-game text-sm text-game-red-dark">
              Impossible de charger le rapport de caravane.
            </div>
          )}
        </BaseModal>
      </div>
    </div>
  );
}

function ReinforcementReportDetail({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const report = useReinforcementReportQuery(reportId);
  const { mutate: markRead } = useMarkReinforcementReportReadMutation();
  const { mutateAsync: deleteReport } = useDeleteReinforcementReportMutation();
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
      console.error('Erreur lors de la suppression du rapport de renfort:', err);
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
        {report.isLoading || !data ? (
          <BaseModal
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
            headerClassName="px-4 py-4"
            maxHeight="min(90dvh, 760px)"
            onClose={onClose}
            title={
              <span className="flex items-center gap-3 uppercase tracking-[.08em] text-[#3d2f1f]">
                <img alt="" className="size-[26px]" src={publicAsset('/assets/defense.png')} />
                Rapport de renfort
              </span>
            }
            tone="green"
            width={360}
          >
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
            {report.error && (
              <div className="p-4 text-center font-game text-sm text-game-red-dark">
                Impossible de charger le rapport de renfort.
              </div>
            )}
          </BaseModal>
        ) : (
          <ReinforcementReportModal
            {...buildReinforcementReportModalProps(
              data,
              [
                {
                  disabled: isDeleting,
                  id: 'delete',
                  label: isDeleting ? 'Suppression...' : 'Supprimer',
                  tone: 'danger',
                },
                { id: 'close', label: 'Fermer', tone: 'neutral' },
              ],
              async (action) => {
                if (action.id === 'delete') {
                  await handleDelete();
                  return;
                }
                if (action.id === 'close') {
                  onClose();
                }
              },
            )}
          />
        )}
      </div>
    </div>
  );
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
  const { navigateToWorldMapFocus } = useWorldMapNavigation();
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
  const handleAction = async (action: { id: string }) => {
    if (action.id === 'delete') {
      await handleDelete();
      return;
    }
    if (action.id === 'view-map' && data) {
      onClose();
      navigateToWorldMapFocus({ x: data.targetX, y: data.targetY });
      return;
    }
    if (action.id === 'close') {
      onClose();
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
        {report.isLoading || !data ? (
          <BaseModal
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
            headerClassName="px-4 py-4"
            maxHeight="min(90dvh, 760px)"
            onClose={onClose}
            title={
              <span className="flex items-center gap-3 uppercase tracking-[.08em] text-[#3d2f1f]">
                <img alt="" className="size-[26px]" src={publicAsset('/assets/army/cavalry.png')} />
                Rapport de combat
              </span>
            }
            tone="red"
            width={360}
          >
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
            {report.error && (
              <div className="p-4 text-center font-game text-sm text-game-red-dark">
                Impossible de charger le rapport.
              </div>
            )}
          </BaseModal>
        ) : (
          <CombatReportModal
            {...buildCombatReportModalProps(
              data,
              [
                {
                  disabled: isDeleting,
                  id: 'delete',
                  label: isDeleting ? 'Suppression...' : 'Supprimer',
                  tone: 'danger',
                },
                { id: 'close', label: 'Fermer', tone: 'neutral' },
              ],
              handleAction,
            )}
            targetAction={{ id: 'view-map', label: 'Position', tone: 'success' }}
          />
        )}
      </div>
    </div>
  );
}
