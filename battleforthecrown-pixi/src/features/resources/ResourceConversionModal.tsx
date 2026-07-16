import { useMemo, useState } from 'react';
import type { ResourceType } from '@battleforthecrown/shared/resources';
import {
  CONVERTIBLE_RESOURCE_TYPES,
  RESOURCE_CONVERSION_DAILY_CAP,
  RESOURCE_CONVERSION_RATE,
  convertResourceAmount,
  resourceTypeToKey,
} from '@battleforthecrown/shared/resources';
import { ApiError } from '@/api';
import { useConvertResourcesMutation } from '@/api/queries';
import { BaseModal } from '@/features/design-system/components/BaseModal';
import { RESOURCE_CONFIG } from '@/lib/resourceConfig';
import { Button, Input, InputLabel, ModalOverlay, Select } from '@/ui';
import type { SelectOption } from '@/ui/selects/Select';

export interface ResourceConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  villageId: string | null;
}

function resourceLabel(type: ResourceType): string {
  return RESOURCE_CONFIG[resourceTypeToKey(type)].nameCapitalized;
}

const RESOURCE_OPTIONS: SelectOption[] = CONVERTIBLE_RESOURCE_TYPES.map((type) => ({
  value: type,
  label: resourceLabel(type),
}));

/**
 * Échange royal — conversion intra-village wood/stone/iron (run #099, T5).
 * UI idiote : tout le calcul (taux, plafond, aperçu du crédit) vient de
 * `@battleforthecrown/shared/resources`. Le backend reste l'unique vérité —
 * pas d'optimistic sur les stocks, `resources.changed` (WS) resynchronise
 * l'affichage après succès (cf. `useConvertResourcesMutation`).
 */
export function ResourceConversionModal({ isOpen, onClose, villageId }: ResourceConversionModalProps) {
  const [sourceType, setSourceType] = useState<ResourceType>('WOOD');
  const [destinationType, setDestinationType] = useState<ResourceType>('STONE');
  const [amountInput, setAmountInput] = useState('');
  const convert = useConvertResourcesMutation();

  const destinationOptions = useMemo(
    () => RESOURCE_OPTIONS.filter((option) => option.value !== sourceType),
    [sourceType],
  );

  const handleSourceChange = (value: string) => {
    const next = value as ResourceType;
    setSourceType(next);
    if (destinationType === next) {
      const fallback = CONVERTIBLE_RESOURCE_TYPES.find((type) => type !== next);
      if (fallback) setDestinationType(fallback);
    }
  };

  const amount = Number.parseInt(amountInput, 10);
  const hasValidAmount = Number.isInteger(amount) && amount > 0;
  const preview = hasValidAmount ? convertResourceAmount(amount) : 0;
  const canSubmit = hasValidAmount && sourceType !== destinationType && Boolean(villageId) && !convert.isPending;

  const resetAndClose = () => {
    convert.reset();
    setAmountInput('');
    onClose();
  };

  const handleSubmit = () => {
    if (!villageId || !canSubmit) return;
    convert.mutate(
      { villageId, sourceType, destinationType, amount },
      { onSuccess: resetAndClose },
    );
  };

  const errorMessage = convert.isError
    ? convert.error instanceof ApiError
      ? convert.error.message
      : 'Les scribes n’ont pas pu conclure l’échange. Réessaie.'
    : null;

  return (
    <ModalOverlay ariaLabel="Échange royal de ressources" isOpen={isOpen} onClose={resetAndClose}>
      <BaseModal onClose={resetAndClose} title="Échange royal" tone="gold">
        <div className="flex flex-col gap-3">
          <p className="font-game text-[11px] text-[#6d5838]">
            Taux défavorable de {RESOURCE_CONVERSION_RATE}:1 — le grand comptoir royal prend sa part.
            Plafond quotidien : {RESOURCE_CONVERSION_DAILY_CAP} par ressource cédée.
          </p>

          <div>
            <InputLabel htmlFor="conversion-source">Ressource cédée</InputLabel>
            <Select
              id="conversion-source"
              onValueChange={handleSourceChange}
              options={RESOURCE_OPTIONS}
              value={sourceType}
              variant="parchment"
            />
          </div>

          <div>
            <InputLabel htmlFor="conversion-destination">Ressource reçue</InputLabel>
            <Select
              id="conversion-destination"
              onValueChange={(value) => setDestinationType(value as ResourceType)}
              options={destinationOptions}
              value={destinationType}
              variant="parchment"
            />
          </div>

          <div>
            <InputLabel htmlFor="conversion-amount">
              Montant de {resourceLabel(sourceType)} à céder
            </InputLabel>
            <Input
              id="conversion-amount"
              inputMode="numeric"
              min={1}
              onChange={(event) => setAmountInput(event.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              step={1}
              type="number"
              value={amountInput}
              variant="parchment"
            />
          </div>

          <div className="rounded-lg border-2 border-[rgba(60,38,25,.22)] bg-[rgba(255,255,255,.4)] px-3 py-2 font-game text-[12px] font-bold text-[#3d2f1f]">
            Aperçu : {preview} {resourceLabel(destinationType)} crédité{preview > 1 ? 's' : ''}
          </div>

          {errorMessage ? (
            <div className="rounded-lg border-2 border-[#a93226] bg-[rgba(231,76,60,.1)] px-3 py-2 text-center font-game text-[11px] font-bold text-[#a93226]">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={resetAndClose} variant="neutral">
              Revenir au conseil
            </Button>
            <Button className="flex-1" disabled={!canSubmit} onClick={handleSubmit} variant="success">
              {convert.isPending ? 'Échange en cours…' : 'Sceller l’échange'}
            </Button>
          </div>
        </div>
      </BaseModal>
    </ModalOverlay>
  );
}
