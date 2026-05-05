import { Badge, ProgressBar } from '@/ui';
import { formatRemaining } from '../constructionProgress';

interface ConstructionProgressProps {
  progress: number;
  remainingMs: number;
}

export function ConstructionProgress({ progress, remainingMs }: ConstructionProgressProps) {
  return (
    <div className="p-4 bg-game-gold-light/10 border-2 border-game-gold-border rounded-lg space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">Construction en cours</span>
        <Badge variant="warning" size="md">
          {progress.toFixed(0)}%
        </Badge>
      </div>
      <ProgressBar
        value={progress}
        showPercentage={false}
        variant="warning"
        size="md"
        animated
      />
      <p className="text-xs text-center font-medium text-game-gold-dark mt-2">
        {formatRemaining(remainingMs)}
      </p>
    </div>
  );
}
