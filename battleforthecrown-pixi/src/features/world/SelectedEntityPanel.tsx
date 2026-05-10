import { Shield, Swords, X } from 'lucide-react';
import { Button, Panel } from '@/ui';
import type { MapEntity } from '@/api/world-types';

interface SelectedEntityPanelProps {
  entity: MapEntity | null;
  currentVillageId?: string | null;
  onClose: () => void;
  onAttack?: (entity: MapEntity) => void;
}

const TIER_LABEL: Record<NonNullable<MapEntity['tier']>, string> = {
  T1: 'Tier 1',
  T2: 'Tier 2',
  T3: 'Tier 3',
};

function typeLabel(entity: MapEntity): string {
  if (entity.kind === 'BARBARIAN_VILLAGE') {
    return entity.tier ? TIER_LABEL[entity.tier] : 'Village barbare';
  }
  if (entity.kind === 'PLAYER_VILLAGE') {
    return entity.isMine ? 'Mon village' : 'Village joueur';
  }
  return 'Entité';
}

export function SelectedEntityPanel({
  entity,
  currentVillageId,
  onClose,
  onAttack,
}: SelectedEntityPanelProps) {
  if (!entity) return null;

  const isPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && !entity.isMine;
  const isOwnedPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && entity.isMine;
  const isBarbarian = entity.kind === 'BARBARIAN_VILLAGE';
  const showAttack = (isBarbarian || isPlayerVillage) && Boolean(onAttack);
  const showReinforce = isOwnedPlayerVillage
    && entity.id !== currentVillageId
    && Boolean(onAttack);
  const actionLabel = showReinforce ? 'Renforcer' : 'Attaquer';
  const ActionIcon = showReinforce ? Shield : Swords;

  const showAction = showAttack || showReinforce;

  return (
    <Panel
      variant="parchment"
      padding="sm"
      className="relative flex flex-col gap-2 text-sm text-kingdom-800 shadow-lg w-full max-w-xs"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-1 right-1 p-1 rounded-full text-kingdom-700 hover:bg-black/10 transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col leading-tight pr-6">
        <span className="font-cinzel text-[11px] uppercase tracking-wide text-kingdom-600">
          {typeLabel(entity)}
        </span>
        <span className="font-cinzel text-base font-bold text-kingdom-900">
          {entity.name}
        </span>
      </div>

      {showAction && (
        <Button
          variant={showReinforce ? 'neutral' : 'danger'}
          size="sm"
          onClick={() => onAttack?.(entity)}
          className="w-full font-bold"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <ActionIcon size={16} />
            <span>{actionLabel}</span>
          </span>
        </Button>
      )}
    </Panel>
  );
}
