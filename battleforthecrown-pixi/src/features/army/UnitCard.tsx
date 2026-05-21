import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Lock, Swords, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  IconButton,
  NumericKeypadSheet,
  ProgressBar,
  ResourceIcon,
  Slider,
  Tooltip,
} from "@/ui";
import { UNIT_COSTS } from "@battleforthecrown/shared/army";
import { ApiError } from "@/api";
import type { ArmyTrainingDto, ArmyUnitDto } from "@/api/queries";
import {
  queryKeys,
  useCancelTrainingMutation,
  usePopulationQuery,
  useTrainUnitsMutation,
  useWorldConfigQuery,
} from "@/api/queries";
import { useDisplayResources } from "@/features/resources/useDisplayResources";
import { useGameStore } from "@/stores/game";
import { useUiStore } from "@/stores/ui";
import { useTickingNow } from "@/lib/useTickingNow";
import { unitMetaFor } from "./unitConfig";
import { computeUnitTrainingProgress } from "./trainingProgress";
import { getEffectiveUnitTrainingDurationSeconds } from "./trainingDuration";

interface UnitCardProps {
  unit: ArmyUnitDto;
  barracksLevel: number;
  training: ArmyTrainingDto | undefined;
  onClick: (unit: ArmyUnitDto) => void;
  onUpgradeBarracks?: () => void;
}

function formatProgressTime(ms: number): string {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

const HARD_MAX = 500;

export function UnitCard({
  unit,
  barracksLevel,
  training,
  onClick,
  onUpgradeBarracks,
}: UnitCardProps) {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const cancel = useCancelTrainingMutation();
  const train = useTrainUnitsMutation();
  const pushToast = useUiStore((state) => state.pushToast);
  const now = useTickingNow(1_000);
  const worldTempo = useWorldConfigQuery(worldId).data?.tempo;
  const queryClient = useQueryClient();

  // Bridge the gap between extrapolated visual completion and the WS event:
  // pg-boss + Outbox poll add 1-4s after the bar fills. Once the local clock
  // says we're past `createdAt + totalDurationMs` but the queue is still here,
  // refetch on every tick until the server catches up and removes it.
  useEffect(() => {
    if (!training || !villageId) return;
    const trainingProgress = computeUnitTrainingProgress(training, now);
    const overdue = trainingProgress.totalRemainingMs === 0;
    if (overdue && training.completedQty < training.totalQty) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyTraining(villageId),
      });
    }
  }, [now, training, villageId, queryClient]);

  const meta = unitMetaFor(unit.type);
  const cost = UNIT_COSTS[unit.type as keyof typeof UNIT_COSTS];
  const requiredLevel = cost?.requiredBarracksLevel ?? 1;
  const isLocked = barracksLevel < requiredLevel;
  const isTraining = Boolean(training);

  const { display } = useDisplayResources(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const availablePopulation = populationQuery.data?.available ?? 0;

  const [quantity, setQuantity] = useState(1);
  const [keypadOpen, setKeypadOpen] = useState(false);

  const maxTrainable = useMemo(() => {
    if (!cost) return 1;
    const wood = Math.floor((display?.wood ?? 0) / Math.max(1, cost.wood));
    const stone = Math.floor((display?.stone ?? 0) / Math.max(1, cost.stone));
    const iron = Math.floor((display?.iron ?? 0) / Math.max(1, cost.iron));
    const pop =
      cost.population > 0
        ? Math.floor(availablePopulation / cost.population)
        : HARD_MAX;
    const limited = Math.min(wood, stone, iron, pop, HARD_MAX);
    return Math.max(1, limited);
  }, [cost, display, availablePopulation]);

  const totalCost = useMemo(() => {
    if (!cost) return null;
    const perUnitSeconds = getEffectiveUnitTrainingDurationSeconds({
      unitTimeSeconds: cost.time,
      worldTempo,
      barracksLevel,
    });
    return {
      wood: cost.wood * quantity,
      stone: cost.stone * quantity,
      iron: cost.iron * quantity,
      population: cost.population * quantity,
      timeSeconds: perUnitSeconds * quantity,
    };
  }, [barracksLevel, cost, quantity, worldTempo]);

  const canAfford = useMemo(() => {
    if (!totalCost || !display) return false;
    return (
      display.wood >= totalCost.wood &&
      display.stone >= totalCost.stone &&
      display.iron >= totalCost.iron &&
      availablePopulation >= totalCost.population
    );
  }, [totalCost, display, availablePopulation]);

  const trainingProgress = training
    ? computeUnitTrainingProgress(training, now)
    : null;

  const stop = (event: React.MouseEvent) => event.stopPropagation();

  const handleCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!villageId || !training) return;
    cancel.mutate({ villageId, trainingId: training.id });
  };

  const handleTrain = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!villageId || !canAfford || train.isPending) return;
    train.mutate(
      { villageId, unitType: unit.type, quantity },
      {
        onSuccess: () => setQuantity(1),
        onError: (err) => {
          pushToast({
            tone: "error",
            title: "Entraînement impossible",
            description:
              err instanceof ApiError ? err.message : "Échec de l'entraînement",
            ttlMs: 4000,
          });
        },
      },
    );
  };

  const clampQty = (n: number) =>
    Math.max(1, Math.min(maxTrainable, Math.floor(n)));

  const openModal = () => onClick(unit);

  return (
    <>
      <Card
        variant="parchment"
        innerLight={false}
        innerShadow={false}
        size="fluid"
        fill
        className={`relative overflow-hidden shadow-clay-md hover:shadow-clay-lg ${
          isLocked ? "ring-2 ring-game-stone-border/70" : ""
        }`}
      >
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={unit.quantity > 0 ? "info" : "neutral"}
            size="md"
            className="font-bold shadow-lg"
          >
            {unit.quantity}
          </Badge>
        </div>

        {isLocked && (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="neutral"
              size="sm"
              className="flex items-center gap-1"
            >
              <Lock size={12} />
              <span>Niv. {requiredLevel}</span>
            </Badge>
          </div>
        )}

        {isTraining && (
          <div className="absolute top-2 left-2 z-10">
            <Tooltip
              content="Annuler l'entraînement"
              variant="error"
              position="bottom"
            >
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

        <button
          type="button"
          onClick={openModal}
          className="w-full h-16 flex items-center justify-center bg-gradient-to-br from-white/10 to-black/10 border-b-2 border-black/20 relative overflow-hidden cursor-pointer hover:bg-white/20 transition-colors"
          aria-label={`Détails ${meta.name}`}
        >
          {meta.iconPath ? (
            <img
              src={meta.iconPath}
              alt={meta.name}
              width={48}
              height={48}
              loading="lazy"
              className={`object-contain drop-shadow-lg ${
                isLocked ? "grayscale opacity-80" : ""
              }`}
            />
          ) : (
            <span aria-hidden className="text-4xl">
              {meta.emoji}
            </span>
          )}
        </button>

        <CardTitle
          className="px-1 !pb-0 text-center leading-none flex items-center justify-center cursor-pointer min-h-10"
          onClick={openModal}
        >
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
                    {trainingProgress?.displayedCompletedQty ?? 0}/
                    {training.totalQty}
                  </span>
                </div>
                <span className="text-game-gold-dark font-medium">
                  {formatProgressTime(trainingProgress?.totalRemainingMs ?? 0)}
                </span>
              </div>
              <ProgressBar
                value={trainingProgress?.percent ?? 0}
                variant="warning"
                size="sm"
                animated
                showPercentage={false}
              />
              <p className="text-[10px] text-center text-game-gold-dark font-medium">
                Prochaine dans{" "}
                {formatProgressTime(
                  trainingProgress?.currentUnitRemainingMs ?? 0,
                )}
              </p>
            </div>
          ) : !isLocked && cost && totalCost ? (
            <div className="space-y-3" onClick={stop}>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKeypadOpen(true)}
                  aria-label={`Modifier la quantité (actuellement ${quantity})`}
                  className="flex flex-col items-center px-3 py-1 rounded-md hover:bg-kingdom-50/60 active:bg-kingdom-100/60 transition-colors cursor-pointer"
                >
                  <span className="font-cinzel text-3xl font-bold text-kingdom-900 leading-none text-shadow-game">
                    {quantity}
                  </span>
                  <span className="font-game text-xs text-kingdom-600 mt-0.5">
                    / {maxTrainable.toLocaleString("fr-FR")}
                  </span>
                </button>
                <Slider
                  variant="info"
                  size="md"
                  min={1}
                  max={Math.max(1, maxTrainable)}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(clampQty(Number(e.target.value)))
                  }
                  disabled={maxTrainable <= 1}
                  className="w-full"
                />
              </div>
              <div className="px-2.5 pt-2.5 pb-1 bg-gradient-to-br from-kingdom-50 to-kingdom-100 border-2 border-kingdom-300 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-kingdom-700 text-center">
                  Coût total :
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(["wood", "stone", "iron"] as const).map((res) => {
                    const amount = totalCost[res];
                    if (!amount) return null;
                    const have = display?.[res] ?? 0;
                    const ok = have >= amount;
                    return (
                      <div
                        key={res}
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${
                          ok
                            ? "bg-game-blue-light/20 border-game-blue-border/30 text-game-blue-dark"
                            : "bg-game-red-light/20 border-game-red-border/30 text-game-red-dark"
                        }`}
                      >
                        <ResourceIcon resource={res} size={14} />
                        <span>{amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {totalCost.population > 0 && (
                    <div
                      className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${
                        availablePopulation >= totalCost.population
                          ? "bg-game-stone-light/20 border-game-stone-border/30 text-kingdom-800"
                          : "bg-game-red-light/20 border-game-red-border/30 text-game-red-dark"
                      }`}
                    >
                      <span aria-hidden>👥</span>
                      <span>{totalCost.population}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-kingdom-600 pt-1 border-t border-kingdom-300/50">
                  <Clock size={12} className="text-kingdom-500" />
                  <span className="font-medium">
                    {formatDuration(totalCost.timeSeconds)}
                  </span>
                </div>
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
            <Button
              variant="warning"
              size="sm"
              className="w-full font-bold"
              disabled
            >
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <Swords size={14} className="animate-pulse" />
                <span>En cours...</span>
              </div>
            </Button>
          ) : isLocked ? (
            <Button
              variant="warning"
              size="sm"
              className="w-full font-bold"
              onClick={(event) => {
                event.stopPropagation();
                onUpgradeBarracks?.();
              }}
              disabled={!onUpgradeBarracks}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <Lock size={16} />
                <span>Monter la caserne</span>
              </div>
            </Button>
          ) : (
            <Button
              variant={canAfford ? "info" : "neutral"}
              size="sm"
              className="w-full font-bold"
              onClick={handleTrain}
              disabled={!canAfford || train.isPending}
            >
              {canAfford ? (
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <Swords size={14} />
                  <span>Entraîner {quantity}</span>
                </div>
              ) : (
                <span className="text-xs">Ressources insuffisantes</span>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      {!isTraining && !isLocked && (
        <NumericKeypadSheet
          open={keypadOpen}
          onClose={() => setKeypadOpen(false)}
          onConfirm={(v) => setQuantity(clampQty(v))}
          value={quantity}
          max={maxTrainable}
          variant="info"
          title={meta.name}
        />
      )}
    </>
  );
}
