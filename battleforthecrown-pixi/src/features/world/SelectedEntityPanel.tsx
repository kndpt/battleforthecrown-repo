import { MapEntityCallout } from '@/features/design-system/components';
import type { MapEntity } from '@/api/world-types';
import { getBarbarianCaptureDurationLabel } from './barbarianConquest';

interface SelectedEntityPanelProps {
  entity: MapEntity | null;
  currentVillageId?: string | null;
  onAttack?: (entity: MapEntity) => void;
  onScout?: (entity: MapEntity) => void;
}

const TIER_LABEL: Record<NonNullable<MapEntity['tier']>, string> = {
  T1: 'Tier 1',
  T2: 'Tier 2',
  T3: 'Tier 3',
  T4: 'Tier 4',
  T5: 'Tier 5',
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
  onAttack,
  onScout,
}: SelectedEntityPanelProps) {
  if (!entity) return null;

  const isPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && !entity.isMine;
  const isOwnedPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && entity.isMine;
  const isBarbarian = entity.kind === 'BARBARIAN_VILLAGE';
  const showAttack = (isBarbarian || isPlayerVillage) && Boolean(onAttack);
  const showScout = (isBarbarian || isPlayerVillage) && Boolean(onScout);
  const showReinforce = isOwnedPlayerVillage
    && entity.id !== currentVillageId
    && Boolean(onAttack);
  const actions = [
    ...(showAttack
      ? [
          {
            icon: '⚔',
            label: 'Attaquer',
            tone: 'attack' as const,
            onClick: () => onAttack?.(entity),
          },
        ]
      : []),
    ...(showScout
      ? [
          {
            icon: '/assets/lupa.png',
            label: 'Espionner',
            tone: 'scout' as const,
            onClick: () => onScout?.(entity),
          },
        ]
      : []),
    ...(showReinforce
      ? [
          {
            icon: '🛡',
            label: 'Renforcer',
            tone: 'support' as const,
            onClick: () => onAttack?.(entity),
          },
        ]
      : []),
  ];

  return (
    <MapEntityCallout
      actions={actions}
      coordinates={`${entity.x}|${entity.y}`}
      stats={isBarbarian ? captureStatsFor(entity) : undefined}
      subtitle={subtitleFor(entity)}
      tier={entity.tier ? { label: `★ ${entity.tier}` } : undefined}
      title={entity.name}
      titleIcon={isBarbarian ? '★' : undefined}
    />
  );
}

function subtitleFor(entity: MapEntity): string {
  if (entity.kind === 'BARBARIAN_VILLAGE') return 'Inhabité · pillable';
  return typeLabel(entity);
}

function captureStatsFor(entity: MapEntity) {
  const duration = getBarbarianCaptureDurationLabel(entity.tier);
  return duration ? [{ label: 'Capture', value: duration }] : undefined;
}
