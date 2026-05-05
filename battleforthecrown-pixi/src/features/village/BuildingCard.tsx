import { Hammer, XCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardTitle,
  IconButton,
  ProgressBar,
  Tooltip,
} from '@/ui';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import { useCancelConstructionMutation } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import type { BuildingDto } from '@/api';

export interface BuildingCardProps {
  building: BuildingDto & { lockReason?: string };
  onClick?: (building: BuildingDto) => void;
}

export function BuildingCard({ building, onClick }: BuildingCardProps) {
  const villageId = useGameStore((state) => state.villageId);
  const meta = metaFor(building.type);
  const now = useTickingNow(1_000);
  const progress = computeConstructionProgress(
    { startTime: building.startTime, endTime: building.endTime },
    now,
  );
  const cancel = useCancelConstructionMutation();

  const isMaxLevel = building.level >= building.maxLevel;
  const isUnderConstruction = progress.inProgress;
  const isUnbuilt = building.level === 0;
  const isLockedByCastle = isUnbuilt && Boolean(building.lockReason);

  const handleCardClick = () => {
    onClick?.(building);
  };

  const handleCancelConstruction = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!villageId) return;
    cancel.mutate({ villageId, buildingId: building.id });
  };

  const upgradeButton = () => (
    <div className="flex items-center justify-center gap-1">
      <Hammer size={16} />
      <span>{isUnbuilt ? 'Construire' : `→ Niv. ${building.level + 1}`}</span>
    </div>
  );

  return (
    <div onClick={handleCardClick} className="cursor-pointer h-full">
      <Card
        variant={isUnbuilt ? 'stone' : meta.cardVariant}
        innerLight={false}
        innerShadow={false}
        size="fluid"
        fill
        className={`relative overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0.5 shadow-clay-md hover:shadow-clay-lg ${
          isUnbuilt ? 'ring-2 ring-game-stone-border/70' : ''
        }`}
      >
        {isUnderConstruction && (
          <div className="absolute top-2 left-2 z-10">
            <Tooltip content="Annuler la construction" variant="error" position="bottom">
              <IconButton
                icon={XCircle}
                variant="danger"
                size="sm"
                label="Annuler la construction"
                className="shadow-lg"
                onClick={handleCancelConstruction}
                disabled={cancel.isPending}
              />
            </Tooltip>
          </div>
        )}

        {/* Niveau Badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={
              isLockedByCastle
                ? 'error'
                : isUnbuilt
                  ? 'neutral'
                  : isMaxLevel
                    ? 'success'
                    : 'warning'
            }
            size="md"
            className="font-bold shadow-lg"
          >
            Niv. {building.level}
          </Badge>
        </div>

        {/* Image (hauteur fixe) */}
        <div className="h-24 flex items-center justify-center bg-gradient-to-br from-white/10 to-black/10 border-b-2 border-black/20 relative overflow-hidden">
          {meta.iconPath ? (
            <img
              src={meta.iconPath}
              alt={meta.label}
              width={80}
              height={80}
              loading="lazy"
              className={`object-contain drop-shadow-lg ${
                isUnbuilt || isLockedByCastle ? 'grayscale opacity-80' : ''
              }`}
            />
          ) : (
            <span aria-hidden className="text-6xl">
              {meta.emoji}
            </span>
          )}
        </div>

        {/* Titre */}
        <CardTitle className="px-1 text-center leading-none min-h-10 flex items-center justify-center">
          <span className="font-cinzel text-xs font-bold text-shadow line-clamp-2">
            {meta.label}
          </span>
        </CardTitle>

        {/* Footer */}
        <CardFooter className="!pb-2 !px-2 mt-auto flex flex-col !gap-2">
          <div className="flex items-center justify-center w-full">
            {isUnderConstruction ? (
              <div className="space-y-1 w-full">
                <ProgressBar
                  value={progress.percent}
                  showPercentage
                  variant="warning"
                  size="sm"
                  animated
                />
                <p className="text-xs text-center font-medium text-game-gold-dark">
                  {formatRemaining(progress.remainingMs)}
                </p>
              </div>
            ) : isMaxLevel ? null : isLockedByCastle ? (
              <Button
                variant="neutral"
                size="sm"
                className="w-full font-bold"
                disabled
              >
                <span className="flex items-center justify-center gap-1 text-xs w-full">
                  {building.lockReason}
                </span>
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                className="w-full font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(building);
                }}
              >
                <span className="flex items-center justify-center gap-1 text-xs w-full">
                  {upgradeButton()}
                </span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
