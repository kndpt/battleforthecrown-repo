import { useMemo, useState } from 'react';
import { Shield, Swords, X } from 'lucide-react';
import {
  Badge,
  Button,
  InputHelperText,
  Modal,
  ModalBody,
  Slider,
  Spinner,
} from '@/ui';
import { UNIT_STATS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { TempoService } from '@battleforthecrown/shared/world';
import {
  calculateDistance,
  calculateTravelTime,
  findSlowestUnitSpeed,
} from '@battleforthecrown/shared/logic';
import { formatTravelTime } from '@/lib/combatHelpers';
import {
  useArmyInventoryQuery,
  useInitiateAttackMutation,
  useInitiateReinforceMutation,
  useInitiateScoutMutation,
  useWorldConfigQuery,
} from '@/api/queries';
import { combatErrorMessage } from './combatErrorMessage';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { unitMetaFor } from '@/features/army/unitConfig';
import { SegmentedControl } from '@/features/design-system/components';
import { publicAsset } from '@/lib/publicAsset';
import type { MapEntity } from '@/api/world-types';
import { getBarbarianCaptureDurationLabel } from '@/features/world/barbarianConquest';
import { getPvpCaptureDurationLabel } from '@battleforthecrown/shared/combat';

interface AttackDetailModalProps {
  target: MapEntity;
  origin: { x: number; y: number };
  initialMode?: 'attack' | 'scout';
  onClose: () => void;
}

export function AttackDetailModal({
  target,
  origin,
  initialMode = 'attack',
  onClose,
}: AttackDetailModalProps) {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const inventory = useArmyInventoryQuery(villageId);
  const worldConfig = useWorldConfigQuery(worldId);
  const attack = useInitiateAttackMutation();
  const reinforce = useInitiateReinforceMutation();
  const scout = useInitiateScoutMutation();
  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'attack' | 'scout'>(initialMode);
  const [error, setError] = useState<string | null>(null);

  const targetKind = target.kind === 'BARBARIAN_VILLAGE'
    ? 'BARBARIAN_VILLAGE'
    : target.kind === 'PLAYER_VILLAGE'
      ? 'PLAYER_VILLAGE'
      : null;
  const isReinforcement = target.kind === 'PLAYER_VILLAGE' && target.isMine;
  const canScout = Boolean(targetKind && !isReinforcement);
  const activeMode = isReinforcement ? 'reinforce' : mode;
  const effectiveUnits = useMemo(() => {
    if (activeMode !== 'scout') return selectedUnits;
    const spyCount = selectedUnits[UNIT_TYPES.SPY] ?? 0;
    return spyCount > 0 ? { [UNIT_TYPES.SPY]: spyCount } : {};
  }, [activeMode, selectedUnits]);
  const heldUnits = (inventory.data ?? [])
    .filter((u) => u.quantity > 0)
    .filter((u) => activeMode !== 'scout' || u.type === UNIT_TYPES.SPY);

  const totalSelected = useMemo(
    () => Object.values(effectiveUnits).reduce((s, v) => s + v, 0),
    [effectiveUnits],
  );

  const distance = calculateDistance(origin.x, origin.y, target.x, target.y);

  const travelMs = useMemo(() => {
    if (totalSelected === 0) return 0;
    const tempo = worldConfig.data?.tempo;
    if (!tempo) return 0;
    const slowest = findSlowestUnitSpeed(effectiveUnits, UNIT_STATS);
    if (slowest === 0) return 0;
    return Math.round(
      TempoService.applyDuration(
        calculateTravelTime(distance, 1, slowest),
        tempo,
        'travelSpeed',
      ),
    );
  }, [effectiveUnits, totalSelected, distance, worldConfig.data]);

  const totalCarryCapacity = useMemo(() => {
    return Object.entries(effectiveUnits).reduce((total, [type, qty]) => {
      const stats = UNIT_STATS[type as keyof typeof UNIT_STATS];
      return total + (stats?.carryCapacity ?? 0) * qty;
    }, 0);
  }, [effectiveUnits]);

  const totalAttack = useMemo(() => {
    return Object.entries(effectiveUnits).reduce((total, [type, qty]) => {
      const stats = UNIT_STATS[type as keyof typeof UNIT_STATS];
      return total + (stats?.attack ?? 0) * qty;
    }, 0);
  }, [effectiveUnits]);
  const selectedNobleCount = effectiveUnits[UNIT_TYPES.NOBLE] ?? 0;
  const isBarbarianConquest =
    target.kind === 'BARBARIAN_VILLAGE' &&
    activeMode === 'attack' &&
    selectedNobleCount > 0;
  const captureDuration = getBarbarianCaptureDurationLabel(target.tier);
  const isEnemyPlayerVillage =
    target.kind === 'PLAYER_VILLAGE' && !target.isMine;
  const pvpCaptureDuration = getPvpCaptureDurationLabel(target.castleLevel);
  const missionAccentClass =
    activeMode === 'reinforce'
      ? 'from-game-green-light to-game-green-dark border-game-green-border'
      : activeMode === 'scout'
        ? 'from-game-blue-light to-game-blue-dark border-game-blue-border'
        : 'from-game-red-light to-game-red-dark border-game-red-border';
  const missionSummaryClass =
    activeMode === 'reinforce'
      ? 'bg-game-green-light/10 border-game-green-border/30'
      : activeMode === 'scout'
        ? 'bg-game-blue-light/10 border-game-blue-border/30'
        : 'bg-game-red-light/10 border-game-red-border/30';
  const primaryActionVariant =
    activeMode === 'reinforce' ? 'success' : activeMode === 'scout' ? 'info' : 'danger';

  const handleUnitChange = (unitType: string, raw: number) => {
    const unit = heldUnits.find((u) => u.type === unitType);
    if (!unit) return;
    const validQuantity = Math.max(0, Math.min(raw, unit.quantity));
    setSelectedUnits((prev) => ({ ...prev, [unitType]: validQuantity }));
    setError(null);
  };

  const isPending = activeMode === 'reinforce'
    ? reinforce.isPending
    : activeMode === 'scout'
      ? scout.isPending
      : attack.isPending;

  const handleSubmit = () => {
    if (!villageId || !userId) {
      setError('Session invalide');
      return;
    }
    if ((!isReinforcement && !targetKind) || (isReinforcement && target.id === villageId)) {
      setError('Cible invalide');
      return;
    }
    if (totalSelected === 0) {
      setError('Sélectionne au moins une unité');
      return;
    }
    if (activeMode === 'scout' && (effectiveUnits[UNIT_TYPES.SPY] ?? 0) <= 0) {
      setError('Sélectionne au moins un ESPION');
      return;
    }

    setError(null);
    const filteredUnits = Object.fromEntries(
      Object.entries(effectiveUnits).filter(([, qty]) => qty > 0),
    );

    if (activeMode === 'reinforce') {
      reinforce.mutate(
        {
          villageId,
          targetVillageId: target.id,
          units: filteredUnits,
        },
        {
          onSuccess: () => onClose(),
          onError: (err) => {
            setError(combatErrorMessage(err, 'Échec du renfort'));
          },
        },
      );
      return;
    }

    if (!targetKind) {
      setError('Cible invalide');
      return;
    }

    const mutation = activeMode === 'scout' ? scout : attack;
    mutation.mutate(
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
          const fallback = activeMode === 'scout' ? 'Échec du scout' : "Échec de l'attaque";
          setError(combatErrorMessage(err, fallback));
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

        <div
          className={`relative h-32 bg-gradient-to-br border-b-4 flex-shrink-0 flex items-center justify-center ${missionAccentClass}`}
        >
          <div className="text-center">
            {activeMode === 'scout' ? (
              <img
                alt=""
                className="mx-auto mb-1 size-10 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]"
                src={publicAsset('/assets/lupa.png')}
              />
            ) : (
              <div className="text-3xl mb-1" aria-hidden>
                {isReinforcement ? '🛡️' : '⚔️'}
              </div>
            )}
            <h2 className="font-cinzel text-xl font-bold text-white text-shadow">
              {activeMode === 'reinforce'
                ? 'Préparer un renfort'
                : activeMode === 'scout'
                  ? 'Préparer un scout'
                  : 'Préparer une attaque'}
            </h2>
            <p className="text-xs text-white/90 mt-1">
              {target.name} ({target.x}, {target.y}) — distance {distance.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isReinforcement && canScout && (
            <SegmentedControl
              ariaLabel="Mode de mission"
              className="w-full [&>button]:flex-1 [&>button]:justify-center"
              onChange={(value) => {
                if (isPending) return;
                setMode(value as 'attack' | 'scout');
                setError(null);
              }}
              options={[
                { icon: '/assets/army-power.png', label: 'Attaque', value: 'attack' },
                { icon: '/assets/lupa.png', label: 'Scout', value: 'scout' },
              ]}
              size="tabs"
              value={activeMode === 'scout' ? 'scout' : 'attack'}
            />
          )}

          {inventory.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : heldUnits.length === 0 ? (
            <div className="p-4 bg-game-stone-light/10 border-2 border-game-stone-border/30 rounded-lg text-center">
              <p className="text-sm text-kingdom-700">
                {activeMode === 'scout'
                  ? "Vous n'avez aucun ESPION disponible."
                  : "Vous n'avez aucune unité disponible."}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-white/60 to-white/40 border-2 border-kingdom-300 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold text-kingdom-800 mb-1">
                {activeMode === 'scout' ? 'Sélection des ESPIONs' : 'Sélection des unités'}
              </h4>
              {heldUnits.map((unit) => {
                const meta = unitMetaFor(unit.type);
                const value = selectedUnits[unit.type] ?? 0;
                const unitIconPath = meta.iconPath;
                return (
                  <div key={unit.type} className="space-y-2">
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-2">
                        {unitIconPath ? (
                          <img
                            src={unitIconPath}
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

          {target.kind === 'BARBARIAN_VILLAGE' && activeMode === 'attack' && (
            <div className="p-3 bg-game-gold-light/10 border-2 border-game-gold-border/30 rounded-lg text-sm text-kingdom-800">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Fenêtre de capture</span>
                <Badge variant={isBarbarianConquest ? 'warning' : 'neutral'} size="sm">
                  {captureDuration ?? 'Inconnue'}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-kingdom-700">
                {isBarbarianConquest
                  ? 'Un Noble sélectionné ouvrira cette fenêtre si le combat est gagné et qu’il survit.'
                  : 'Ajoute un Noble à l’attaque pour transformer cette mission en conquête.'}
              </p>
            </div>
          )}

          {isEnemyPlayerVillage && activeMode === 'attack' && (
            <div className="p-3 bg-game-gold-light/10 border-2 border-game-gold-border/30 rounded-lg text-sm text-kingdom-800">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Fenêtre de capture</span>
                <Badge variant={pvpCaptureDuration ? 'warning' : 'neutral'} size="sm">
                  {pvpCaptureDuration ?? 'Inconnue'}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-kingdom-700">
                {pvpCaptureDuration
                  ? 'Durée pendant laquelle un Seigneur capturera ce village. Tes voisins peuvent intervenir.'
                  : 'Envoie un espion pour estimer la fenêtre de capture (niveau du Château inconnu).'}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-kingdom-200 bg-gradient-to-b from-kingdom-50 to-kingdom-100 flex-shrink-0 flex flex-col gap-2">
          <div className={`p-3 border-2 rounded-lg space-y-1.5 text-sm ${missionSummaryClass}`}>
            {activeMode === 'scout' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-kingdom-700">Coût mission :</span>
                  <span className="font-bold tabular-nums">
                    {effectiveUnits[UNIT_TYPES.SPY] ?? 0} ESPION{(effectiveUnits[UNIT_TYPES.SPY] ?? 0) > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-kingdom-700">Coût couronnes :</span>
                  <span className="font-bold tabular-nums">0</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant={primaryActionVariant}
              size="md"
              className="flex-1 font-bold shadow-clay-lg"
              onClick={handleSubmit}
              disabled={isPending || totalSelected === 0}
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Envoi…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  {activeMode === 'reinforce'
                    ? <Shield size={16} />
                    : activeMode === 'scout'
                      ? <img alt="" className="size-4 object-contain" src={publicAsset('/assets/lupa.png')} />
                      : <Swords size={16} />}
                  <span>
                    {activeMode === 'reinforce'
                      ? 'Renforcer'
                      : activeMode === 'scout'
                        ? 'Envoyer scout'
                        : isBarbarianConquest
                          ? 'Lancer conquête'
                          : 'Attaquer'}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
