import { Panel, PanelBody, PanelHeader, Spinner } from '@/ui';
import { useCombatReportsQuery } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { ReportCard } from './ReportCard';

interface ReportsListProps {
  onReportClick: (reportId: string) => void;
}

export function ReportsList({ onReportClick }: ReportsListProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const reports = useCombatReportsQuery(userId);

  if (reports.isLoading) {
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

  if (!reports.data || reports.data.length === 0) {
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
            <div className="text-kingdom-700 font-game">Aucun rapport de combat</div>
          </div>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="space-y-3">
      {reports.data.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onClick={() => onReportClick(report.id)}
        />
      ))}
    </div>
  );
}
