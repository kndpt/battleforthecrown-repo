import { useMemo, useState } from 'react';
import { Swords, X } from 'lucide-react';
import {
  Badge,
  Button,
  InputHelperText,
  Modal,
  ModalBody,
  Slider,
  Spinner,
} from '@/ui';
import { UNIT_STATS } from '@battleforthecrown/shared/army';
import {
  calculateDistance,
  calculateTravelTime,
  findSlowestUnitSpeed,
  formatTravelTime,
} from '@/lib/combatHelpers';
import {
  useArmyInventoryQuery,
  useInitiateAttackMutation,
  useWorldConfigQuery,
} from '@/api/queries';
import { ApiError } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { unitMetaFor } from '@/features/army/unitConfig';
import type { MapEntity } from '@/api/world-types';

interface AttackDetailModalProps {
  target: MapEntity;
  origin: { x: number; y: number };
  onClose: () => void;
}

export function AttackDetailModal({ target, origin, onClose }: AttackDetailModalProps) {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const inventory = useArmyInventoryQuery(villageId);
  const worldConfig = useWorldConfigQuery(worldId);
  const attack = useInitiateAttackMutation();
  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const heldUnits = (inventory.data ?? []).filter((u) => u.quantity > 0);

  const totalSelected = useMemo(
    () => Object.values(selectedUnits).reduce((s, v) => s + v, 0),
    [selectedUnits],
  );

  const distance = calculateDistance(origin.x, origin.y, target.x, target.y);

  const travelMs = useMemo(() => {
    if (totalSelected === 0) return 0;
    const travelSpeed = worldConfig.data?.multipliers.travel;
    if (travelSpeed === undefined) return 0;
    const slowest = findSlowestUnitSpeed(selectedUnits, UNIT_STATS);
    if (slowest === 0) return 0;
    return calculateTravelTime(distance, slowest, travelSpeed);
  }, [selectedUnits, totalSelected, distance, worldConfig.data]);

  const totalCarryCapacity = useMemo(() => {
    return Object.entries(selectedUnits).reduce((total, [type, qty]) => {
      const stats = UNIT_STATS[type as keyof typeof UNIT_STATS];
      return total + (stats?.carryCapacity ?? 0) * qty;
    }, 0);
  }, [selectedUnits]);

  const totalAttack = useMemo(() => {
    return Object.entries(selectedUnits).reduce((total, [type, qty]) => {
      const stats = UNIT_STATS[type as keyof typeof UNIT_STATS];
      return total + (stats?.attack ?? 0) * qty;
    }, 0);
  }, [selectedUnits]);

  const handleUnitChange = (unitType: string, raw: number) => {
    const unit = heldUnits.find((u) => u.type === unitType);
    if (!unit) return;
    const validQuantity = Math.max(0, Math.min(raw, unit.quantity));
    setSelectedUnits((prev) => ({ ...prev, [unitType]: validQuantity }));
    setError(null);
  };

  const targetKind = target.kind === 'BARBARIAN_VILLAGE'
    ? 'BARBARIAN_VILLAGE'
    : target.kind === 'PLAYER_VILLAGE'
      ? 'PLAYER_VILLAGE'
      : null;

  const handleAttack = () => {
    if (!villageId || !userId) {
      setError('Session invalide');
      return;
    }
    if (!targetKind) {
      setError('Cible invalide');
      return;
    }
    if (totalSelected === 0) {
      setError('Sélectionne au moins une unité');
      return;
    }

    setError(null);
    const filteredUnits = Object.fromEntries(
      Object.entries(selectedUnits).filter(([, qty]) => qty > 0),
    );

    attack.mutate(
      {
        villageId,
        targetX: target.x,
        targetY: target.y,
        targetKind,
        targetRefId: target.id,
        units: filteredUnits,
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'attaque");
        },
      },
    );
  };

  if (!targetKind) return null;

  return (
    <Modal isOpen onClose={onClose} size="lg" variant="default">
      <ModalBody className="!p-0 relative flex flex-col overflow-hidden h-[90vh] max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="relative h-32 bg-gradient-to-br from-game-red-light to-game-red-dark border-b-4 border-game-red-border flex-shrink-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-1" aria-hidden>
              ⚔️
            </div>
            <h2 className="font-cinzel text-xl font-bold text-white text-shadow">
              Préparer une attaque
            </h2>
            <p className="text-xs text-white/90 mt-1">
              {target.name} ({target.x}, {target.y}) — distance {distance.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {inventory.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : heldUnits.length === 0 ? (
            <div className="p-4 bg-game-stone-light/10 border-2 border-game-stone-border/30 rounded-lg text-center">
              <p className="text-sm text-kingdom-700">
                Vous n&apos;avez aucune unité disponible.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-white/60 to-white/40 border-2 border-kingdom-300 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold text-kingdom-800 mb-1">
                Sélection des unités
              </h4>
              {heldUnits.map((unit) => {
                const meta = unitMetaFor(unit.type);
                const value = selectedUnits[unit.type] ?? 0;
                return (
                  <div key={unit.type} className="space-y-2">
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-2">
                        {meta.iconPath ? (
                          <img
                            src={meta.iconPath}
                            alt={meta.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        ) : (
                          <span aria-hidden className="text-xl">
                            {meta.emoji}
                          </span>
                        )}
                        <span className="text-sm font-medium text-kingdom-800">
                          {meta.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="md">{value}</Badge>
                        <span className="text-xs text-kingdom-600">/ {unit.quantity}</span>
                      </div>
                    </div>
                    <Slider
                      variant="info"
                      size="md"
                      min={0}
                      max={unit.quantity}
                      value={value}
                      onChange={(e) =>
                        handleUnitChange(unit.type, parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div role="alert">
              <InputHelperText variant="error">{error}</InputHelperText>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-kingdom-200 bg-gradient-to-b from-kingdom-50 to-kingdom-100 flex-shrink-0 flex flex-col gap-2">
          <div className="p-3 bg-game-blue-light/10 border-2 border-game-blue-border/30 rounded-lg space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-kingdom-700">Puissance estimée :</span>
              <span className="font-bold tabular-nums">{totalAttack.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kingdom-700">Capacité de transport :</span>
              <span className="font-bold tabular-nums">
                {totalCarryCapacity > 0 ? totalCarryCapacity.toLocaleString() : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kingdom-700">Temps de trajet :</span>
              <span className="font-bold tabular-nums">
                {travelMs > 0 ? formatTravelTime(travelMs) : '—'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="neutral"
              size="md"
              className="flex-1 font-bold"
              onClick={onClose}
              disabled={attack.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1 font-bold shadow-clay-lg"
              onClick={handleAttack}
              disabled={attack.isPending || totalSelected === 0}
            >
              {attack.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Envoi…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <Swords size={16} />
                  <span>Attaquer</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
