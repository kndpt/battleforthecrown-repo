import { Badge, ProgressBar, ResourceIcon } from '@/ui';
import type { BuildingLevelDefinition } from '@battleforthecrown/shared/village/buildings';

interface CostSectionProps {
  cost: BuildingLevelDefinition;
  resources: { wood: number; stone: number; iron: number };
  availablePopulation: number;
  nextLevel: number;
}

interface CellProps {
  label: string;
  required: number;
  current: number;
  icon: React.ReactNode;
}

function CostCell({ label, required, current, icon }: CellProps) {
  const canAfford = current >= required;
  return (
    <div
      className={`text-center p-2 rounded-lg border-2 transition-all ${
        canAfford
          ? 'bg-game-green-light/10 border-game-green-border'
          : 'bg-game-red-light/10 border-game-red-border'
      }`}
    >
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[10px] text-kingdom-600 font-game">{label}</p>
        <p
          className={`text-sm font-bold ${
            canAfford ? 'text-game-green-dark' : 'text-game-red-dark'
          }`}
        >
          {required.toLocaleString()}
        </p>
        <p className="text-[10px] text-kingdom-700 tabular-nums">
          / {Math.floor(current).toLocaleString()}
        </p>
        <ProgressBar
          value={Math.min((current / Math.max(1, required)) * 100, 100)}
          variant={canAfford ? 'success' : 'danger'}
          size="sm"
          showPercentage={false}
        />
        <Badge variant={canAfford ? 'success' : 'error'} size="sm">
          {canAfford ? '✓' : `-${Math.ceil(required - current).toLocaleString()}`}
        </Badge>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function CostSection({
  cost,
  resources,
  availablePopulation,
  nextLevel,
}: CostSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-cinzel font-bold text-center text-kingdom-900 text-base">
        Amélioration → Niveau {nextLevel}
      </h3>

      <div className="grid grid-cols-4 gap-2">
        <CostCell
          label="Bois"
          required={cost.wood}
          current={resources.wood}
          icon={<ResourceIcon resource="wood" size={28} />}
        />
        <CostCell
          label="Pierre"
          required={cost.stone}
          current={resources.stone}
          icon={<ResourceIcon resource="stone" size={28} />}
        />
        <CostCell
          label="Fer"
          required={cost.iron}
          current={resources.iron}
          icon={<ResourceIcon resource="iron" size={28} />}
        />
        <CostCell
          label="Pop."
          required={cost.population}
          current={availablePopulation}
          icon={<span className="text-2xl leading-none">👥</span>}
        />
      </div>

      <p className="text-center text-xs text-kingdom-600 font-game">
        ⏱ Temps de construction : <span className="font-bold">{formatTime(cost.timeSeconds)}</span>
      </p>
    </div>
  );
}
