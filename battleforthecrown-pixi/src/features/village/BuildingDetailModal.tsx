import { useState } from 'react';
import { Button } from '@/ui/buttons';
import { Spinner } from '@/ui/spinners';
import { metaFor } from './buildingMeta';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';
import { useTickingNow } from '@/lib/useTickingNow';
import { useUpgradeBuildingMutation, useCancelConstructionMutation } from '@/api/queries';
import { ApiError } from '@/api';
import type { BuildingDto } from '@/api';

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

  const isMaxed = building.level >= building.maxLevel;

  const onUpgrade = () => {
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

  const onCancel = () => {
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-md border-4 border-game-gold-border bg-[#2a1f12] p-5 text-parchment shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3">
          <span aria-hidden className="text-4xl">
            {meta.emoji}
          </span>
          <div className="flex-1">
            <h2 className="font-game text-xl text-game-gold-light text-shadow-game">{meta.label}</h2>
            <p className="text-sm text-parchment/80">{meta.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm uppercase tracking-widest text-parchment/70 hover:text-game-gold-light"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Niveau actuel</dt>
            <dd className="font-bold text-game-gold-light">{building.level}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Plafond</dt>
            <dd className="font-bold text-game-gold-light">{building.maxLevel}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Population</dt>
            <dd>{building.populationCost}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Statut</dt>
            <dd>{progress.inProgress ? 'En construction' : 'Disponible'}</dd>
          </div>
        </dl>

        {progress.inProgress && (
          <div>
            <div className="h-2 w-full rounded bg-black/40">
              <div className="h-2 rounded bg-game-green-light" style={{ width: `${progress.percent.toFixed(1)}%` }} />
            </div>
            <p className="mt-1 text-xs text-parchment/70">
              {progress.percent.toFixed(0)}% · reste {formatRemaining(progress.remainingMs)}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-sm text-white">
            {error}
          </p>
        )}

        <footer className="flex flex-wrap gap-2">
          {progress.inProgress ? (
            <Button variant="danger" size="md" disabled={cancel.isPending} onClick={onCancel}>
              {cancel.isPending ? <Spinner size="sm" /> : 'Annuler la construction'}
            </Button>
          ) : (
            <Button
              variant="success"
              size="md"
              disabled={upgrade.isPending || isMaxed}
              onClick={onUpgrade}
            >
              {upgrade.isPending ? (
                <Spinner size="sm" />
              ) : isMaxed ? (
                'Niveau maximal'
              ) : (
                `Améliorer vers niv. ${building.level + 1}`
              )}
            </Button>
          )}
          <Button variant="neutral" size="md" onClick={onClose}>
            Fermer
          </Button>
        </footer>
      </div>
    </div>
  );
}
