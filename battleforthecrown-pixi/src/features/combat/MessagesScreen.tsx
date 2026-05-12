import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { ReportsList, type InboxReportSummary } from './ReportsList';
import { ReportDetailModal } from './ReportDetailModal';
import { useUnreadReportsCount } from './useUnreadReportsCount';

export function MessagesScreen() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<InboxReportSummary | null>(null);
  const [isPowerSheetOpen, setIsPowerSheetOpen] = useState(false);
  const unreadCount = useUnreadReportsCount();

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
      <div className="flex-shrink">
        <GameHeader onPowerClick={() => setIsPowerSheetOpen(true)} />
      </div>

      <div
        className="flex-1 overflow-y-auto pb-24 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <main className="container mx-auto px-3 py-4 max-w-2xl">
          <h1 className="font-cinzel text-xl font-bold text-kingdom-900 mb-4 px-1">
            Rapports
          </h1>
          <ReportsList onReportClick={setSelectedReport} />
        </main>
      </div>

      <BottomNavigationBar
        activeTab="messages"
        onBuildingsClick={() => navigate('/game')}
        onArmyClick={() => navigate('/game/army')}
        onWorldClick={() => navigate('/game/world')}
        onMessagesClick={() => undefined}
        unreadCount={unreadCount}
      />

      {selectedReport && (
        <ReportDetailModal
          reportId={selectedReport.report.id}
          reportKind={selectedReport.kind}
          onClose={() => setSelectedReport(null)}
        />
      )}

      <PowerBottomSheet
        isOpen={isPowerSheetOpen}
        onClose={() => setIsPowerSheetOpen(false)}
      />

      <ToastStack />
    </div>
  );
}
