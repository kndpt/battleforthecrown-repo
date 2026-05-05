import { useMemo, useState } from 'react';
import { Hammer, Swords, X } from 'lucide-react';
import {
  Badge,
  Button,
  InputHelperText,
  Modal,
  ModalBody,
  ResourceIcon,
  Spinner,
} from '@/ui';
import { UNIT_COSTS, UNIT_STATS } from '@battleforthecrown/shared/army';
import type { ArmyUnitDto } from '@/api/queries';
import { useTrainUnitsMutation } from '@/api/queries';
import { ApiError } from '@/api';
import { useGameStore } from '@/stores/game';
import { unitMetaFor } from './unitConfig';

interface UnitDetailModalProps {
  unit: ArmyUnitDto;
  barracksLevel: number;
  onClose: () => void;
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

export function UnitDetailModal({ unit, barracksLevel, onClose }: UnitDetailModalProps) {
  const villageId = useGameStore((state) => state.villageId);
  const meta = unitMetaFor(unit.type);
  const cost = UNIT_COSTS[unit.type as keyof typeof UNIT_COSTS];
  const stats = UNIT_STATS[unit.type as keyof typeof UNIT_STATS];
  const requiredLevel = cost?.requiredBarracksLevel ?? 1;
  const isLocked = barracksLevel < requiredLevel;
  const train = useTrainUnitsMutation();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const totalCost = useMemo(() => {
    if (!cost) return null;
    return {
      wood: cost.wood * quantity,
      stone: cost.stone * quantity,
      iron: cost.iron * quantity,
      population: cost.population * quantity,
      timeSeconds: cost.time * quantity,
    };
  }, [cost, quantity]);

  const handleTrain = () => {
    if (!villageId) return;
    setError(null);
    train.mutate(
      { villageId, unitType: unit.type, quantity },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'entraînement");
        },
      },
    );
  };

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

        <div className="relative h-40 bg-gradient-to-br from-game-blue-light to-game-blue-dark border-b-4 border-game-blue-border flex-shrink-0 flex items-center justify-center">
          {meta.iconPath ? (
            <img
              src={meta.iconPath}
              alt={meta.name}
              width={120}
              height={120}
              className="object-contain drop-shadow-2xl"
            />
          ) : (
            <span aria-hidden className="text-7xl drop-shadow-2xl">
              {meta.emoji}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <h2 className="font-cinzel text-xl font-bold text-white text-center text-shadow">
              {meta.name}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 bg-gradient-to-br from-white/60 to-white/40 border-2 border-kingdom-300 rounded-lg">
            <p className="text-sm text-kingdom-800 leading-relaxed text-center">
              {meta.description}
            </p>
          </div>

          {stats && (
            <div className="p-4 bg-game-blue-light/10 border-2 border-game-blue-border/30 rounded-lg">
              <h3 className="font-cinzel text-base font-bold text-kingdom-900 mb-3 flex items-center gap-2">
                <Swords size={18} className="text-game-blue-dark" />
                Statistiques de combat
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">⚔️ Attaque</span>
                  <Badge variant="error" size="sm">{stats.attack}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">🛡️ Déf. Inf.</span>
                  <Badge variant="info" size="sm">{stats.defenseInfantry}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">🐎 Déf. Cav.</span>
                  <Badge variant="info" size="sm">{stats.defenseCavalry}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">🏹 Déf. Arch.</span>
                  <Badge variant="info" size="sm">{stats.defenseArcher}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">⚡ Vitesse</span>
                  <Badge variant="warning" size="sm">{stats.speed} min</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">📦 Capacité</span>
                  <Badge variant="success" size="sm">{stats.carryCapacity}</Badge>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-game-green-light/10 border-2 border-game-green-border/30 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-kingdom-800">Vos troupes :</span>
              <Badge variant="success" size="lg">{unit.quantity}</Badge>
            </div>
          </div>

          {!isLocked && cost && (
            <div className="p-4 bg-kingdom-50 border-2 border-kingdom-300 rounded-lg space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-kingdom-800">Quantité</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                  className="flex-1 max-w-[120px] rounded border-2 border-kingdom-300 bg-white px-3 py-1.5 text-right font-bold text-kingdom-900 focus:border-game-blue-border focus:outline-none"
                />
              </div>
              {totalCost && (
                <>
                  <p className="text-xs font-semibold text-kingdom-700 text-center">Coût total</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(['wood', 'stone', 'iron'] as const).map((res) =>
                      totalCost[res] ? (
                        <div
                          key={res}
                          className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border bg-game-blue-light/20 border-game-blue-border/30 text-game-blue-dark"
                        >
                          <ResourceIcon resource={res} size={14} />
                          <span>{totalCost[res].toLocaleString()}</span>
                        </div>
                      ) : null,
                    )}
                    {totalCost.population > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border bg-game-stone-light/20 border-game-stone-border/30 text-kingdom-800">
                        <span>👥</span>
                        <span>{totalCost.population}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center text-xs text-kingdom-600 pt-1 border-t border-kingdom-300/50">
                    ⏱ {formatTime(totalCost.timeSeconds)}
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div role="alert">
              <InputHelperText variant="error">{error}</InputHelperText>
            </div>
          )}
        </div>

        {!isLocked && cost && (
          <div className="p-4 border-t-2 border-kingdom-200 bg-gradient-to-b from-kingdom-50 to-kingdom-100 flex-shrink-0">
            <Button
              variant="success"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled={train.isPending}
              onClick={handleTrain}
            >
              {train.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Lancement...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Hammer size={20} />
                  <span className="text-lg font-semibold">Entraîner {quantity}</span>
                </div>
              )}
            </Button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
