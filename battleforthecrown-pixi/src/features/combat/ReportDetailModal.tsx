import { useEffect, useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { ModalBackdrop, Spinner } from '@/ui';
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
  caravanReportOriginVillage,
  caravanReportStateLabel,
  caravanReportSummary,
  caravanReportTargetVillage,
  caravanReportVillageLabel,
  caravanReportWhen,
  type CaravanReportSummary,
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
    <ModalBackdrop onClose={onClose}>
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
    </ModalBackdrop>
  );
}

export function ReportDetailModal({ reportId, reportKind, onClose }: ReportDetailModalProps) {
  if (reportKind === 'scout') return <ScoutReportDetail reportId={reportId} onClose={onClose} />;
  if (reportKind === 'reinforcement') return <ReinforcementReportDetail reportId={reportId} onClose={onClose} />;
  if (reportKind === 'caravan') return <CaravanReportDetail reportId={reportId} onClose={onClose} />;
  return <CombatReportDetail reportId={reportId} onClose={onClose} />;
}

function CaravanResourceManifest({ summary }: { summary: CaravanReportSummary }) {
  return (
    <section className="mx-3.5 flex flex-col gap-2 rounded-[14px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 py-2.5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(0,0,0,.05)]">
      <div className="min-w-0">
        <div className="font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-[#6d5838]">
          Bilan des ressources
        </div>
        <h3 className="mt-1 font-game text-lg font-black leading-none text-[#3d2f1f]">
          {summary.title}
        </h3>
      </div>

      <p className="rounded-[10px] border border-[rgba(60,38,25,.14)] bg-[rgba(255,250,238,.48)] px-3 py-2 font-game text-[11px] font-semibold leading-[1.35] text-[#6d5838]">
        {summary.body}
      </p>

      <div className="grid gap-1.5">
        {summary.resources.map((resource) => (
          <div
            className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[10px] border border-[rgba(60,38,25,.16)] bg-[rgba(255,250,238,.55)] px-2.5 py-2"
            key={resource.key}
          >
            <img
              alt=""
              className="size-7 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]"
              src={publicAsset(resource.icon)}
            />
            <div className="min-w-0">
              <div className="font-game text-[12px] font-extrabold text-[#3d2f1f]">
                {resource.label}
              </div>
              <div className="font-game text-[9.5px] font-semibold text-[#6d5838]">
                {resource.primaryAmount > 0 ? `${resource.primaryLabel} sur ` : ''}{resource.sentValue} envoyées
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 font-game tabular-nums">
              {resource.primaryAmount > 0 ? (
                <span className="text-sm font-black text-[#2d6b16]">
                  {resource.primaryValue}
                </span>
              ) : null}
              {resource.lostValue ? (
                <span className="rounded-full border border-[#a93226] bg-[rgba(231,76,60,.12)] px-1.5 py-px text-[9.5px] font-extrabold text-[#a93226]">
                  {resource.lostValue} perdues
                </span>
              ) : null}
            </div>
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
  const summary = data ? caravanReportSummary(data) : null;
  const tone = data?.type === 'RETURNED' ? 'gray' : summary && summary.lostTotal > 0 ? 'gold' : 'green';
  const routeOrigin = data?.type === 'RETURNED' ? targetVillage : originVillage;
  const routeDestination = data?.type === 'RETURNED' ? originVillage : targetVillage;

  return (
    <ModalBackdrop onClose={onClose}>
      <BaseModal
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
        className="relative"
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
          maxHeight="min(90dvh, 760px)"
          tone={tone}
          width={360}
        >
          {report.isLoading || !data || !summary ? (
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex min-h-full flex-col bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] py-3">
              <button
                aria-label="Fermer"
                className="absolute right-3 top-3 z-10 size-8 cursor-pointer rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#b6a78a,#8b7355)] font-game text-sm font-extrabold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
              <div className="flex items-center gap-3 px-3.5 pb-2">
                <div className="relative flex h-[86px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-[2.5px] border-[#3c2619] bg-[linear-gradient(160deg,#7d612c_0%,#251a0b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_4px_0_rgba(0,0,0,.18)]">
                  <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(241,196,15,.5)_0%,rgba(241,196,15,0)_70%)]" />
                  <img alt="" className="relative z-[1] w-[76%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,.55)]" src={publicAsset('/assets/resources/resources.png')} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="font-game text-[9px] font-bold uppercase tracking-[.24em] text-[#6d5838]">
                    {caravanReportWhen(data)}
                  </div>
                  <div className="font-game text-2xl font-black leading-none text-[#7d612c] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
                    {caravanReportStateLabel(data)}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border-[1.5px] border-[#8b7355] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] px-[7px] py-[2.5px] font-game text-[9.5px] font-extrabold uppercase tracking-[.12em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]">
                      {NUMBER_FORMATTER.format(data.porters)} porteurs
                    </span>
                  </div>
                </div>
              </div>

              <div className="mx-3.5 mt-0.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[14px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.55)_0%,rgba(244,228,193,.5)_100%)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-10px_18px_rgba(0,0,0,.05)]">
                <div className="min-w-0 text-left">
                  <div className="mb-1 flex items-center gap-1.5 font-game text-[9.5px] font-extrabold uppercase text-[#6d5838]">
                    <img alt="" className="size-4 object-contain" src={publicAsset('/assets/position.png')} />
                    Départ
                  </div>
                  <div className="truncate font-game text-[12px] font-extrabold text-[#3d2f1f]">
                    {routeOrigin ? caravanReportVillageLabel(routeOrigin) : ''}
                  </div>
                  <div className="font-game text-[10px] font-semibold text-[#6d5838]">
                    {routeOrigin ? `${routeOrigin.x}|${routeOrigin.y}` : ''}
                  </div>
                </div>
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(0,0,0,.2)]">
                  <ArrowRight size={17} strokeWidth={3} />
                </div>
                <div className="min-w-0 text-right">
                  <div className="mb-1 flex items-center justify-end gap-1.5 font-game text-[9.5px] font-extrabold uppercase text-[#6d5838]">
                    Arrivée
                    <img alt="" className="size-4 object-contain" src={publicAsset('/assets/position.png')} />
                  </div>
                  <div className="truncate font-game text-[12px] font-extrabold text-[#3d2f1f]">
                    {routeDestination ? caravanReportVillageLabel(routeDestination) : ''}
                  </div>
                  <div className="font-game text-[10px] font-semibold text-[#6d5838]">
                    {routeDestination ? `${routeDestination.x}|${routeDestination.y}` : ''}
                  </div>
                </div>
              </div>

              <div className="h-2.5 shrink-0" />
              <CaravanResourceManifest summary={summary} />
              <div className="h-3 shrink-0" />
            </div>
          )}

          {report.error && (
            <div className="p-4 text-center font-game text-sm text-game-red-dark">
              Impossible de charger le rapport de caravane.
            </div>
          )}
      </BaseModal>
    </ModalBackdrop>
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
    <ModalBackdrop onClose={onClose}>
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
    </ModalBackdrop>
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
    <ModalBackdrop onClose={onClose}>
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
    </ModalBackdrop>
  );
}
