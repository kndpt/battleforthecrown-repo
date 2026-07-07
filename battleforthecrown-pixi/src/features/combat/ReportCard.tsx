import { Badge, Card } from '@/ui';
import type { CombatReportDto } from '@/api/queries';
import { NUMBER_FMT, formatReportTimestamp } from '@/lib/formatters';
import { combatReportOutcome, combatReportTypeLabel } from './combatReportView';

interface ReportCardProps {
  report: CombatReportDto;
  onClick: () => void;
}

const NUMBER_FORMATTER = NUMBER_FMT;

function formatDate(value: string): string {
  return formatReportTimestamp(value, true);
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const attackerLosses = Object.values(report.lossesAttacker || {}).reduce(
    (s, v) => s + v,
    0,
  );
  const defenderLosses = Object.values(report.lossesDefender || {}).reduce(
    (s, v) => s + v,
    0,
  );
  const totalLoot =
    (report.loot?.resources?.wood ?? 0) +
    (report.loot?.resources?.stone ?? 0) +
    (report.loot?.resources?.iron ?? 0);

  const { isVictory } = combatReportOutcome(report);
  const lossesForPlayer = report.isAttacker ? attackerLosses : defenderLosses;
  const { icon: typeIcon, label: typeLabel } = combatReportTypeLabel(report);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full focus:outline-none"
      aria-label={`Ouvrir le rapport ${typeLabel.toLowerCase()} du ${formatDate(report.timestamp)}`}
    >
      <Card
        variant="parchment"
        size="fluid"
        innerLight={false}
        innerShadow={false}
        className="w-full transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        contentClassName="px-3 py-3 sm:px-4 sm:py-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="info"
                size="md"
                className="p-0 w-7 h-7 flex items-center justify-center text-sm"
              >
                <span className="w-full h-full flex items-center justify-center">
                  {typeIcon}
                </span>
              </Badge>
              <span className="text-sm font-game text-kingdom-900">
                ({report.targetX}, {report.targetY})
              </span>
              <Badge variant="neutral" size="md" className="px-2">
                {typeLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={totalLoot > 0 ? 'success' : 'neutral'} size="md" className="px-2">
                📦 {totalLoot > 0 ? `+${NUMBER_FORMATTER.format(totalLoot)}` : '0'}
              </Badge>
              <Badge
                variant={lossesForPlayer > 0 ? 'error' : 'neutral'}
                size="md"
                className="px-2"
              >
                ⚔️{' '}
                {lossesForPlayer > 0
                  ? `-${NUMBER_FORMATTER.format(lossesForPlayer)}`
                  : '0'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 items-end">
            <div className="flex items-center gap-2 text-xs font-game text-kingdom-700">
              <span>{formatDate(report.timestamp)}</span>
              {!report.isRead && <Badge variant="error">!</Badge>}
            </div>
            <Badge variant={isVictory ? 'success' : 'error'} size="md" className="px-2">
              {report.details?.captureFinalized ? typeLabel : isVictory ? 'Victoire' : 'Défaite'}
            </Badge>
          </div>
        </div>
      </Card>
    </button>
  );
}
