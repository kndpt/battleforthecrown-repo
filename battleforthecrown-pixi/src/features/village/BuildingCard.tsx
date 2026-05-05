import { ProgressBar } from '@/ui';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import type { BuildingDto } from '@/api';

interface BuildingCardProps {
  building: BuildingDto;
  onClick?: () => void;
  selected?: boolean;
}

export function BuildingCard({ building, onClick, selected }: BuildingCardProps) {
  const meta = metaFor(building.type);
  const now = useTickingNow(1_000);
  const progress = computeConstructionProgress(
    { startTime: building.startTime, endTime: building.endTime },
    now,
  );

  const isMaxed = building.level >= building.maxLevel;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full flex-col items-stretch gap-2 rounded-md border-2 px-3 py-3 text-left transition',
        selected
          ? 'border-game-gold-light bg-[#3a2a18]'
          : 'border-game-gold-border bg-[#2a1f12]/80 hover:border-game-gold-light',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        {meta.iconPath ? (
          <img
            src={meta.iconPath}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 object-contain drop-shadow"
          />
        ) : (
          <span aria-hidden className="text-3xl leading-none">
            {meta.emoji}
          </span>
        )}
        <div className="flex-1">
          <p className="font-game text-sm uppercase tracking-widest text-game-gold-light">
            {meta.label}
          </p>
          <p className="text-xs text-parchment/70">{meta.description}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-game-gold-light">Niv. {building.level}</p>
          <p className="text-[10px] text-parchment/60">max {building.maxLevel}</p>
        </div>
      </div>
      {progress.inProgress && (
        <div>
          <ProgressBar
            value={progress.percent}
            variant="success"
            size="sm"
            animated
            label={`${Math.round(progress.percent)}% · ${formatRemaining(progress.remainingMs)}`}
          />
        </div>
      )}
      {!progress.inProgress && isMaxed && (
        <p className="text-[10px] uppercase tracking-widest text-game-gold-light/80">
          Niveau maximal
        </p>
      )}
    </button>
  );
}
