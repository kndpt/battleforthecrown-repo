import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Spinner,
} from '@/ui';
import {
  useDeleteScoutReportMutation,
  useCombatReportQuery,
  useDeleteReportMutation,
  useMarkReportReadMutation,
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

interface ReportDetailModalProps {
  reportId: string;
  reportKind: 'combat' | 'scout' | 'reinforcement';
  onClose: () => void;
}

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
  return <CombatReportDetail reportId={reportId} onClose={onClose} />;
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
          />
        )}
      </div>
    </div>
  );
}
