import { useState } from 'react';
import { Panel, PanelBody, PanelHeader, Spinner } from '@/ui';
import {
  useCombatReportsQuery,
  useScoutReportsQuery,
  type CombatReportDto,
  type ScoutReportDto,
} from '@/api/queries';
import { InboxTabs, MailInboxItem } from '@/features/design-system/components/MailInboxItem';
import {
  scoutReportResourceTotal,
  scoutReportTargetLabel,
  scoutReportTitle,
  scoutReportUnitTotal,
} from './scoutReportView';
import { combatReportOutcome } from './combatReportView';

export type InboxReportSummary =
  | { kind: 'combat'; report: CombatReportDto }
  | { kind: 'scout'; report: ScoutReportDto };

interface ReportsListProps {
  onReportClick: (report: InboxReportSummary) => void;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

function formatDate(value: string): string {
  const parsed = new Date(value);
  const today = new Date();
  const isSameDay = parsed.toDateString() === today.toDateString();
  if (isSameDay) {
    return parsed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function combatInboxItem(report: CombatReportDto) {
  const totalLoot =
    (report.loot?.resources?.wood ?? 0) +
    (report.loot?.resources?.stone ?? 0) +
    (report.loot?.resources?.iron ?? 0);
  const { isVictory } = combatReportOutcome(report);
  const tagTone: 'report' | 'attack' = isVictory ? 'report' : 'attack';
  const subjectPrefix = report.isAttacker ? 'Attaque sur' : 'Défense à';

  return {
    icon: '/assets/rapport.png',
    preview: totalLoot > 0
      ? `Butin ramené : ${NUMBER_FORMATTER.format(totalLoot)} ressources.`
      : 'Aucun butin ramené.',
    sender: '',
    subject: `${subjectPrefix} (${report.targetX}, ${report.targetY})`,
    tag: { label: isVictory ? 'VICTOIRE' : 'DÉFAITE', tone: tagTone },
    tone: tagTone,
  };
}

function scoutInboxItem(report: ScoutReportDto) {
  return {
    icon: '/assets/lupa.png',
    preview: `${NUMBER_FORMATTER.format(scoutReportUnitTotal(report))} unités · ${NUMBER_FORMATTER.format(scoutReportResourceTotal(report))} ressources visibles.`,
    sender: scoutReportTargetLabel(report),
    subject: `Reconnaissance · ${scoutReportTitle(report)}`,
    tag: { label: 'ESPION', tone: 'scout' as const },
    tone: 'scout' as const,
  };
}

export function ReportsList({ onReportClick }: ReportsListProps) {
  const [tab, setTab] = useState('all');
  const combatReports = useCombatReportsQuery();
  const scoutReports = useScoutReportsQuery();
  const allReports: InboxReportSummary[] = [
    ...(combatReports.data ?? []).map((report) => ({ kind: 'combat' as const, report })),
    ...(scoutReports.data ?? []).map((report) => ({ kind: 'scout' as const, report })),
  ].sort((a, b) => Date.parse(b.report.timestamp) - Date.parse(a.report.timestamp));
  const reports = tab === 'scout'
    ? allReports.filter((report) => report.kind === 'scout')
    : tab === 'combat'
      ? allReports.filter((report) => report.kind === 'combat')
      : allReports;
  const unreadCount = allReports.filter((report) => !report.report.isRead).length;
  const unreadCombatCount = (combatReports.data ?? []).filter((report) => !report.isRead).length;
  const unreadScoutCount = (scoutReports.data ?? []).filter((report) => !report.isRead).length;

  if (combatReports.isLoading || scoutReports.isLoading) {
    return (
      <Panel variant="parchment" padding="none">
        <PanelHeader variant="parchment" size="sm">
          <span className="text-sm uppercase tracking-wide">Rapports récents</span>
        </PanelHeader>
        <PanelBody className="flex items-center justify-center py-10">
          <Spinner variant="default" size="lg" />
        </PanelBody>
      </Panel>
    );
  }

  if (allReports.length === 0) {
    return (
      <Panel variant="parchment" padding="none">
        <PanelHeader variant="parchment" size="sm">
          <span className="text-sm uppercase tracking-wide">Rapports récents</span>
        </PanelHeader>
        <PanelBody>
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <div className="text-5xl" aria-hidden>
              📜
            </div>
            <div className="text-kingdom-700 font-game">Aucun rapport</div>
          </div>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="space-y-2">
      <InboxTabs
        onChange={setTab}
        options={[
          { count: unreadCount > 0 ? String(unreadCount) : undefined, label: 'Tous', value: 'all' },
          { count: unreadCombatCount > 0 ? String(unreadCombatCount) : undefined, label: 'Combats', value: 'combat' },
          { count: unreadScoutCount > 0 ? String(unreadScoutCount) : undefined, label: 'Scouts', value: 'scout' },
        ]}
        value={tab}
      />
      {reports.length === 0 && (
        <div className="rounded-[10px] border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-3 py-4 text-center font-game text-sm text-[#6d5838]">
          Aucun rapport dans ce filtre.
        </div>
      )}
      {reports.map((report) => (
        <MailInboxItem
          key={`${report.kind}-${report.report.id}`}
          {...(report.kind === 'combat'
            ? combatInboxItem(report.report)
            : scoutInboxItem(report.report))}
          alertLabel={report.report.isRead ? undefined : '!'}
          onClick={() => onReportClick(report)}
          time={formatDate(report.report.timestamp)}
          unread={!report.report.isRead}
        />
      ))}
    </div>
  );
}
