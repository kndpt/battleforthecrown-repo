import { useMemo, useState } from "react";
import { Package, X } from "lucide-react";
import {
  Button,
  Input,
  InputHelperText,
  Modal,
  ModalBody,
  Spinner,
} from "@/ui";
import {
  useInitiateCaravanMutation,
  useOpenExpeditionsQuery,
  usePopulationQuery,
  useResourcesQuery,
  useVillageBuildingsQuery,
  useWorldConfigQuery,
} from "@/api/queries";
import { ApiError } from "@/api";
import { useGameStore } from "@/stores/game";
import {
  calculateDistance,
  calculateTravelTime,
  formatTravelTime,
} from "@/lib/combatHelpers";
import {
  CARAVAN_SPEED,
  CARRY_PER_PORTER,
  getCaravanResourceCapacity,
} from "@battleforthecrown/shared/logic";
import { getWarehouseStorageLimit } from "@battleforthecrown/shared/resources";
import { TempoService } from "@battleforthecrown/shared/world";
import type { MapEntity } from "@/api/world-types";
import type { LootResources } from "@battleforthecrown/shared/combat";

type ResourceKey = keyof LootResources;
const RESOURCE_KEYS = ["wood", "stone", "iron"] as const;

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  wood: "Bois",
  stone: "Pierre",
  iron: "Fer",
};

const RESOURCE_ICONS: Record<ResourceKey, string> = {
  wood: "/assets/resources/wood.png",
  stone: "/assets/resources/stone.png",
  iron: "/assets/resources/iron.png",
};

interface CaravanLaunchModalProps {
  origin: { x: number; y: number };
  target: MapEntity;
  onClose: () => void;
}

export function CaravanLaunchModal({
  origin,
  target,
  onClose,
}: CaravanLaunchModalProps) {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const resourcesQuery = useResourcesQuery(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const openExpeditionsQuery = useOpenExpeditionsQuery(worldId);
  const worldConfig = useWorldConfigQuery(worldId);
  const caravan = useInitiateCaravanMutation();
  const [resources, setResources] = useState<LootResources>({
    wood: 0,
    stone: 0,
    iron: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const warehouseLevel =
    buildingsQuery.data?.find((building) => building.type === "WAREHOUSE")
      ?.level ?? 1;
  const caravanCapacity = useMemo(
    () => getCaravanResourceCapacity(getWarehouseStorageLimit(warehouseLevel)),
    [warehouseLevel],
  );
  const activeCaravanResources = useMemo<LootResources>(() => {
    const empty = { wood: 0, stone: 0, iron: 0 };
    if (!villageId) return empty;

    return (openExpeditionsQuery.data ?? [])
      .filter(
        (expedition) =>
          expedition.kind === "CARAVAN" &&
          expedition.status === "EN_ROUTE" &&
          expedition.attackerVillageId === villageId,
      )
      .reduce(
        (total, expedition) => ({
          wood: total.wood + (expedition.resources?.wood ?? 0),
          stone: total.stone + (expedition.resources?.stone ?? 0),
          iron: total.iron + (expedition.resources?.iron ?? 0),
        }),
        empty,
      );
  }, [openExpeditionsQuery.data, villageId]);
  const capacityRemaining: LootResources = {
    wood: Math.max(0, caravanCapacity.wood - activeCaravanResources.wood),
    stone: Math.max(0, caravanCapacity.stone - activeCaravanResources.stone),
    iron: Math.max(0, caravanCapacity.iron - activeCaravanResources.iron),
  };
  const stock = resourcesQuery.data;
  const maxResources: LootResources = {
    wood: Math.max(0, Math.min(stock?.wood ?? 0, capacityRemaining.wood)),
    stone: Math.max(0, Math.min(stock?.stone ?? 0, capacityRemaining.stone)),
    iron: Math.max(0, Math.min(stock?.iron ?? 0, capacityRemaining.iron)),
  };
  const totalVolume = resources.wood + resources.stone + resources.iron;
  const totalMaxVolume =
    maxResources.wood + maxResources.stone + maxResources.iron;
  const porters =
    totalVolume > 0 ? Math.ceil(totalVolume / CARRY_PER_PORTER) : 0;
  const freePopulation = populationQuery.data?.available ?? 0;
  const distance = calculateDistance(origin.x, origin.y, target.x, target.y);
  const travelMs = useMemo(() => {
    const tempo = worldConfig.data?.tempo;
    if (!tempo || totalVolume <= 0) return 0;
    return Math.round(
      TempoService.applyDuration(
        calculateTravelTime(distance, CARAVAN_SPEED, 1),
        tempo,
        "travelSpeed",
      ),
    );
  }, [distance, totalVolume, worldConfig.data]);

  const hasEnoughResources =
    !stock ||
    (resources.wood <= stock.wood &&
      resources.stone <= stock.stone &&
      resources.iron <= stock.iron);
  const hasEnoughPopulation = porters <= freePopulation;
  const hasEnoughCaravanCapacity = RESOURCE_KEYS.every(
    (key) => resources[key] <= capacityRemaining[key],
  );
  const isLoading =
    resourcesQuery.isLoading ||
    populationQuery.isLoading ||
    buildingsQuery.isLoading ||
    openExpeditionsQuery.isLoading;
  const canSubmit =
    Boolean(villageId) &&
    totalVolume > 0 &&
    hasEnoughResources &&
    hasEnoughPopulation &&
    hasEnoughCaravanCapacity &&
    !isLoading &&
    !caravan.isPending;

  const updateResource = (key: ResourceKey, raw: string) => {
    const value = Math.max(0, Math.floor(Number(raw) || 0));
    setResources((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  const fillResourceMax = (key: ResourceKey) => {
    setResources((current) => ({ ...current, [key]: maxResources[key] }));
    setError(null);
  };

  const submit = () => {
    if (!villageId) {
      setError("Session invalide");
      return;
    }
    if (totalVolume <= 0) {
      setError("Sélectionne au moins une ressource");
      return;
    }
    if (!hasEnoughResources) {
      setError("Ressources insuffisantes dans le village de départ");
      return;
    }
    if (!hasEnoughPopulation) {
      setError("Population libre insuffisante pour les porteurs");
      return;
    }
    if (!hasEnoughCaravanCapacity) {
      setError("Charge maximale dépassée");
      return;
    }

    caravan.mutate(
      {
        villageId,
        targetVillageId: target.id,
        resources,
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(
            err instanceof ApiError ? err.message : "Échec de la caravane",
          );
        },
      },
    );
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" variant="default">
      <ModalBody className="!p-0 relative flex max-h-[90vh] flex-col overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70"
          aria-label="Fermer"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="flex h-32 flex-shrink-0 items-center justify-center border-b-4 border-game-gold-border bg-gradient-to-br from-game-gold-light to-game-gold-dark">
          <div className="text-center">
            <Package
              className="mx-auto mb-2 text-white drop-shadow"
              size={34}
            />
            <h2 className="font-cinzel text-xl font-bold text-white text-shadow">
              Préparer une caravane
            </h2>
            <p className="mt-1 text-xs text-white/90">
              {target.name} ({target.x}, {target.y}) — distance{" "}
              {distance.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-3">
              {RESOURCE_KEYS.map((key) => {
                const selected = resources[key];
                const limit = maxResources[key];
                const exceedsCapacity = selected > limit;
                const capacityPercent =
                  limit > 0
                    ? Math.min(100, (selected / limit) * 100)
                    : selected > 0
                      ? 100
                      : 0;

                return (
                  <label
                    key={key}
                    className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded border bg-white/60 p-3 ${
                      exceedsCapacity
                        ? "border-game-red-dark"
                        : "border-kingdom-300"
                    }`}
                  >
                    <img
                      className="size-7 object-contain"
                      src={RESOURCE_ICONS[key]}
                      alt=""
                    />
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-kingdom-800">
                        {RESOURCE_LABELS[key]}
                      </span>
                      <span className="block text-[11px] text-kingdom-700/80">
                        Stock {(stock?.[key] ?? 0).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <Input
                      className="w-24 text-right"
                      min={0}
                      max={limit}
                      type="number"
                      value={resources[key]}
                      onChange={(event) =>
                        updateResource(key, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => fillResourceMax(key)}
                      className="rounded border border-game-gold-border bg-game-gold-light/40 px-2 py-1 text-xs font-bold text-kingdom-900 shadow-sm transition hover:bg-game-gold-light/70"
                    >
                      Max
                    </button>
                    <div className="col-span-4">
                      <div className="mb-1 flex justify-between text-[11px] text-kingdom-700">
                        <span>Charge</span>
                        <span
                          className={
                            exceedsCapacity
                              ? "font-bold text-game-red-dark"
                              : ""
                          }
                        >
                          {selected.toLocaleString("fr-FR")} /{" "}
                          {limit.toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-kingdom-200">
                        <div
                          className={`h-full rounded-full ${
                            exceedsCapacity
                              ? "bg-game-red-dark"
                              : "bg-game-gold-dark"
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="rounded border border-game-stone-border/30 bg-game-stone-light/10 p-3 text-sm text-kingdom-800">
            <div className="flex justify-between gap-3">
              <span>Chargement</span>
              <strong>
                {totalVolume.toLocaleString("fr-FR")} /{" "}
                {totalMaxVolume.toLocaleString("fr-FR")}
              </strong>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span>Villageois</span>
              <strong
                className={hasEnoughPopulation ? "" : "text-game-red-dark"}
              >
                {hasEnoughPopulation
                  ? `${porters.toLocaleString("fr-FR")} mobilisés`
                  : `${porters.toLocaleString("fr-FR")} / ${freePopulation.toLocaleString("fr-FR")}`}
              </strong>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span>Trajet aller</span>
              <strong>{travelMs > 0 ? formatTravelTime(travelMs) : "-"}</strong>
            </div>
          </div>

          {!hasEnoughResources && (
            <InputHelperText variant="error">
              Ressources insuffisantes dans le village de départ.
            </InputHelperText>
          )}
          {!hasEnoughPopulation && (
            <InputHelperText variant="error">
              Cette caravane demande plus de population libre que disponible.
            </InputHelperText>
          )}
          {!hasEnoughCaravanCapacity && (
            <InputHelperText variant="error">
              Charge maximale dépassée.
            </InputHelperText>
          )}
          {error && <InputHelperText variant="error">{error}</InputHelperText>}
        </div>

        <div className="flex flex-shrink-0 gap-2 border-t-2 border-kingdom-200 bg-gradient-to-b from-kingdom-50 to-kingdom-100 p-4">
          <Button className="flex-1" variant="neutral" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            variant="warning"
            onClick={submit}
            disabled={!canSubmit}
          >
            {caravan.isPending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
