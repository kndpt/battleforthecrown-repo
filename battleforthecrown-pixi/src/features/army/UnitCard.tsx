import { Clock, Lock, Swords, XCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  IconButton,
  ProgressBar,
  ResourceIcon,
  Tooltip,
} from '@/ui';
import { UNIT_COSTS } from '@battleforthecrown/shared/army';
import type { ArmyTrainingDto, ArmyUnitDto } from '@/api/queries';
import { useCancelTrainingMutation } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useTickingNow } from '@/lib/useTickingNow';
import { unitMetaFor } from './unitConfig';

interface UnitCardProps {
  unit: ArmyUnitDto;
  barracksLevel: number;
  training: ArmyTrainingDto | undefined;
  onClick: (unit: ArmyUnitDto) => void;
}

function formatTime(ms: number): string {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function UnitCard({ unit, barracksLevel, training, onClick }: UnitCardProps) {
  const villageId = useGameStore((state) => state.villageId);
  const cancel = useCancelTrainingMutation();
  const now = useTickingNow(1_000);
  const meta = unitMetaFor(unit.type);
  const cost = UNIT_COSTS[unit.type as keyof typeof UNIT_COSTS];
  const requiredLevel = cost?.requiredBarracksLevel ?? 1;
  const isLocked = barracksLevel < requiredLevel;
  const isTraining = Boolean(training);

  const handleCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!villageId || !training) return;
    cancel.mutate({ villageId, trainingId: training.id });
  };

  let progress = 0;
  let totalRemainingMs = 0;
  let perUnitRemainingMs = 0;
  if (training) {
    const startMs = Date.parse(training.startTime);
    const endMs = Date.parse(training.endTime);
    const totalMs = Math.max(1, endMs - startMs);
    const elapsed = Math.max(0, now - startMs);
    progress = Math.min((elapsed / totalMs) * 100, 100);
    totalRemainingMs = Math.max(0, endMs - now);
    perUnitRemainingMs = Math.max(
      0,
      training.perUnitMs - (elapsed % training.perUnitMs),
    );
  }

  return (
    <div
      className="cursor-pointer h-full"
      onClick={() => onClick(unit)}
    >
      <Card
        variant="parchment"
        innerLight={false}
        innerShadow={false}
        size="fluid"
        fill
        className={`relative overflow-hidden shadow-clay-md hover:shadow-clay-lg ${
          isLocked ? 'ring-2 ring-game-stone-border/70' : ''
        }`}
      >
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={unit.quantity > 0 ? 'info' : 'neutral'}
            size="md"
            className="font-bold shadow-lg"
          >
            {unit.quantity}
          </Badge>
        </div>

        {isLocked && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="neutral" size="sm" className="flex items-center gap-1">
              <Lock size={12} />
              <span>Niv. {requiredLevel}</span>
            </Badge>
          </div>
        )}

        {isTraining && (
          <div className="absolute top-2 left-2 z-10">
            <Tooltip content="Annuler l'entraînement" variant="error" position="bottom">
              <IconButton
                icon={XCircle}
                variant="danger"
                size="sm"
                label="Annuler l'entraînement"
                className="shadow-lg"
                onClick={handleCancel}
                disabled={cancel.isPending}
              />
            </Tooltip>
          </div>
        )}

        <div className="h-16 flex items-center justify-center bg-gradient-to-br from-white/10 to-black/10 border-b-2 border-black/20 relative overflow-hidden">
          {meta.iconPath ? (
            <img
              src={meta.iconPath}
              alt={meta.name}
              width={48}
              height={48}
              loading="lazy"
              className={`object-contain drop-shadow-lg ${
                isLocked ? 'grayscale opacity-80' : ''
              }`}
            />
          ) : (
            <span aria-hidden className="text-4xl">
              {meta.emoji}
            </span>
          )}
        </div>

        <CardTitle className="px-1 text-center leading-none min-h-10 flex items-center justify-center">
          <span className="font-cinzel text-xs font-bold text-shadow line-clamp-2">
            {meta.name}
          </span>
        </CardTitle>

        <CardBody className="!p-2 flex-1">
          {isTraining && training ? (
            <div className="p-2 bg-game-gold-light/10 border-2 border-game-gold-border/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-semibold text-game-gold-dark">
                  <Clock size={12} />
                  <span>
                    {training.completedQty}/{training.totalQty}
                  </span>
                </div>
                <span className="text-game-gold-dark font-medium">
                  {formatTime(totalRemainingMs)}
                </span>
              </div>
              <ProgressBar
                value={progress}
                variant="warning"
                size="sm"
                animated
                showPercentage={false}
              />
              <p className="text-[10px] text-center text-game-gold-dark font-medium">
                Prochaine dans {formatTime(perUnitRemainingMs)}
              </p>
            </div>
          ) : !isLocked && cost ? (
            <div className="px-2 py-1.5 bg-gradient-to-br from-kingdom-50 to-kingdom-100 border-2 border-kingdom-300 rounded-lg space-y-1">
              <p className="text-[10px] font-semibold text-kingdom-700 text-center">Coût unitaire</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {(['wood', 'stone', 'iron'] as const).map((res) =>
                  cost[res] ? (
                    <div
                      key={res}
                      className="flex items-center gap-0.5 text-[10px] font-bold text-kingdom-800"
                    >
                      <ResourceIcon resource={res} size={12} />
                      <span>{cost[res]}</span>
                    </div>
                  ) : null,
                )}
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-kingdom-600 pt-1 border-t border-kingdom-300/50">
                <Clock size={10} />
                <span>{formatTime(cost.time * 1000)}</span>
              </div>
            </div>
          ) : isLocked ? (
            <div className="p-2 bg-game-stone-light/10 border border-game-stone-border/30 rounded-lg text-center">
              <p className="text-[10px] font-semibold text-game-stone-dark">
                Caserne niv. {requiredLevel} requis
              </p>
            </div>
          ) : null}
        </CardBody>

        <CardFooter className="!pb-2 !px-2 mt-auto">
          {isTraining ? (
            <Button variant="warning" size="sm" className="w-full font-bold" disabled>
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <Swords size={14} className="animate-pulse" />
                <span>En cours...</span>
              </div>
            </Button>
          ) : isLocked ? (
            <Button variant="neutral" size="sm" className="w-full opacity-60" disabled>
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <Lock size={14} />
                <span>Verrouillé</span>
              </div>
            </Button>
          ) : (
            <Button
              variant="info"
              size="sm"
              className="w-full font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onClick(unit);
              }}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <Swords size={14} />
                <span>Entraîner</span>
              </div>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
