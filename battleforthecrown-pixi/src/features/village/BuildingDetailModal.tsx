import { useState } from 'react';
import { Hammer, X } from 'lucide-react';
import { Button, InputHelperText, Modal, ModalBody, Spinner } from '@/ui';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import { useUpgradeBuildingMutation, useCancelConstructionMutation } from '@/api/queries';
import { ApiError } from '@/api';
import type { BuildingDto } from '@/api';
import { BuildingHeader } from './BuildingDetailModal/BuildingHeader';
import { ConstructionProgress } from './BuildingDetailModal/ConstructionProgress';

interface BuildingDetailModalProps {
  villageId: string;
  building: BuildingDto;
  onClose: () => void;
}

export function BuildingDetailModal({ villageId, building, onClose }: BuildingDetailModalProps) {
  const meta = metaFor(building.type);
  const now = useTickingNow(1_000);
  const progress = computeConstructionProgress(
    { startTime: building.startTime, endTime: building.endTime },
    now,
  );
  const upgrade = useUpgradeBuildingMutation();
  const cancel = useCancelConstructionMutation();
  const [error, setError] = useState<string | null>(null);

  const isMaxLevel = building.level >= building.maxLevel;
  const isUnderConstruction = progress.inProgress;

  const handleUpgrade = () => {
    setError(null);
    upgrade.mutate(
      { villageId, buildingType: building.type },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'amélioration");
        },
      },
    );
  };

  const handleCancel = () => {
    setError(null);
    cancel.mutate(
      { villageId, buildingId: building.id },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Échec de l'annulation");
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

        <BuildingHeader
          iconPath={meta.iconPath}
          emoji={meta.emoji}
          buildingName={meta.label}
          buildingDescription={meta.description}
          level={building.level}
          isMaxLevel={isMaxLevel}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isUnderConstruction && (
            <ConstructionProgress
              progress={progress.percent}
              remainingMs={progress.remainingMs}
            />
          )}

          {!isUnderConstruction && !isMaxLevel && (
            <div className="rounded-lg border-2 border-kingdom-200 bg-kingdom-50/50 p-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-kingdom-600">
                    Niveau actuel
                  </dt>
                  <dd className="font-bold text-kingdom-900 font-cinzel text-lg">
                    {building.level}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-kingdom-600">
                    Plafond
                  </dt>
                  <dd className="font-bold text-kingdom-900 font-cinzel text-lg">
                    {building.maxLevel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-kingdom-600">
                    Population
                  </dt>
                  <dd className="font-bold text-kingdom-900">{building.populationCost}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-kingdom-600">
                    Statut
                  </dt>
                  <dd className="font-bold text-kingdom-900">Disponible</dd>
                </div>
              </dl>
            </div>
          )}

          {isMaxLevel && (
            <div className="p-4 bg-game-green-light/10 border-2 border-game-green-border rounded-lg text-center">
              <p className="font-bold text-game-green-dark mb-2 text-lg">🏆 Niveau Maximum</p>
              <p className="text-sm text-kingdom-600">
                Ce bâtiment a atteint son développement maximal.
              </p>
            </div>
          )}

          {error && (
            <div role="alert">
              <InputHelperText variant="error">{error}</InputHelperText>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-kingdom-200 bg-gradient-to-b from-kingdom-50 to-kingdom-100 flex-shrink-0">
          {isUnderConstruction ? (
            <Button
              variant="danger"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled={cancel.isPending}
              onClick={handleCancel}
            >
              {cancel.isPending ? (
                <Spinner size="sm" />
              ) : (
                <div className="flex flex-col items-center justify-center leading-tight">
                  <span className="text-base font-semibold">Annuler la construction</span>
                  <span className="text-xs mt-0.5 opacity-90">
                    {formatRemaining(progress.remainingMs)} restant
                  </span>
                </div>
              )}
            </Button>
          ) : isMaxLevel ? (
            <Button
              variant="neutral"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled
            >
              Niveau Maximum
            </Button>
          ) : (
            <Button
              variant="success"
              size="lg"
              className="w-full font-bold shadow-clay-lg !py-1"
              disabled={upgrade.isPending}
              onClick={handleUpgrade}
            >
              {upgrade.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Hammer size={20} className="animate-bounce" />
                  <span>Amélioration en cours...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center leading-tight">
                  <div className="flex items-center justify-center gap-1">
                    <Hammer size={20} />
                    <span className="text-lg font-semibold">
                      Améliorer → Niv. {building.level + 1}
                    </span>
                  </div>
                </div>
              )}
            </Button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
