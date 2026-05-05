import { useState } from 'react';
import {
  Button,
  InputHelperText,
  Modal,
  ModalBody,
  ModalFooter,
  ProgressBar,
  Spinner,
} from '@/ui';
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
    <Modal isOpen onClose={onClose} title={meta.label} size="md">
      <ModalBody>
        <div className="flex items-center gap-4 mb-4">
          {meta.iconPath ? (
            <img
              src={meta.iconPath}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 object-contain drop-shadow"
            />
          ) : (
            <span aria-hidden className="text-5xl leading-none">
              {meta.emoji}
            </span>
          )}
          <p className="text-sm text-gray-700 font-game flex-1">{meta.description}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-gray-600">Niveau actuel</dt>
            <dd className="font-bold text-gray-800 font-cinzel text-lg">{building.level}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-gray-600">Plafond</dt>
            <dd className="font-bold text-gray-800 font-cinzel text-lg">{building.maxLevel}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-gray-600">Population</dt>
            <dd className="font-bold text-gray-800">{building.populationCost}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-gray-600">Statut</dt>
            <dd className="font-bold text-gray-800">
              {progress.inProgress ? 'En construction' : 'Disponible'}
            </dd>
          </div>
        </dl>

        {progress.inProgress && (
          <div className="mb-4">
            <ProgressBar
              value={progress.percent}
              variant="success"
              size="md"
              animated
              label={`${Math.round(progress.percent)}% · reste ${formatRemaining(progress.remainingMs)}`}
            />
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4">
            <InputHelperText variant="error">{error}</InputHelperText>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
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
      </ModalFooter>
    </Modal>
  );
}
