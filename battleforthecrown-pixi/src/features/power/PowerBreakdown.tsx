import { ProgressBar, Tooltip } from '@/ui';

interface PowerBreakdownProps {
  buildings: number;
  army: number;
  className?: string;
}

const SECTIONS = [
  {
    key: 'kingdom' as const,
    label: '🏰 Puissance Bâtiments',
    tooltip: 'Somme des niveaux de bâtiments × poids',
  },
  {
    key: 'army' as const,
    label: '⚔️ Puissance Armée',
    tooltip: "Quantité d'unités × population × 10",
  },
];

export function PowerBreakdown({ buildings, army, className = '' }: PowerBreakdownProps) {
  const values = { kingdom: buildings, army };
  const maxValue = Math.max(buildings, army);

  return (
    <div className={`space-y-4 ${className}`}>
      {SECTIONS.map((section) => {
        const value = values[section.key];
        return (
          <div key={section.key}>
            <div className="flex justify-between items-center mb-1">
              <Tooltip content={section.tooltip}>
                <span className="text-sm font-medium font-game text-kingdom-800">
                  {section.label}
                </span>
              </Tooltip>
              <span className="text-sm font-bold font-game text-kingdom-900">
                {value.toLocaleString()}
              </span>
            </div>
            <ProgressBar
              value={maxValue > 0 ? (value / maxValue) * 100 : 0}
              size="sm"
              variant={section.key === 'kingdom' ? 'info' : 'danger'}
            />
          </div>
        );
      })}
    </div>
  );
}
