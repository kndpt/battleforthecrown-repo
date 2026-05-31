import { useState } from 'react';
import { ReportsList, type InboxReportSummary } from './ReportsList';
import { ReportDetailModal } from './ReportDetailModal';

export function MessagesScreen() {
  const [selectedReport, setSelectedReport] = useState<InboxReportSummary | null>(null);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div
        className="flex-1 overflow-y-auto pb-24 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <main className="container mx-auto px-3 py-4 max-w-2xl">
          <ReportsList onReportClick={setSelectedReport} />
        </main>
      </div>

      {selectedReport && (
        <ReportDetailModal
          reportId={selectedReport.report.id}
          reportKind={selectedReport.kind}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
