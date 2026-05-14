import { MapEntityCallout } from '@/features/design-system/components';
import { useArmyInventoryQuery, useGarrisonQuery } from '@/api/queries';
import type { MapEntity } from '@/api/world-types';
import { getBarbarianCaptureDurationLabel } from './barbarianConquest';
import { buildTroopsSection, summarizePresentTroops } from './selectedEntityTroops';

interface SelectedEntityPanelProps {
  entity: MapEntity | null;
  currentVillageId?: string | null;
  onAttack?: (entity: MapEntity) => void;
  onScout?: (entity: MapEntity) => void;
  onGoToVillage?: (entity: MapEntity) => void;
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
  onGoToVillage,
}: SelectedEntityPanelProps) {
  const ownedVillageId = entity?.kind === 'PLAYER_VILLAGE' && entity.isMine ? entity.id : null;
  const armyInventory = useArmyInventoryQuery(ownedVillageId);
  const garrison = useGarrisonQuery(ownedVillageId);

  if (!entity) return null;

  const isPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && !entity.isMine;
  const isOwnedPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && entity.isMine;
  const isBarbarian = entity.kind === 'BARBARIAN_VILLAGE';
  const showAttack = (isBarbarian || isPlayerVillage) && Boolean(onAttack);
  const showScout = (isBarbarian || isPlayerVillage) && Boolean(onScout);
  const showReinforce = isOwnedPlayerVillage
    && entity.id !== currentVillageId
    && Boolean(onAttack);
  const showGoToVillage = isOwnedPlayerVillage
    && entity.id !== currentVillageId
    && Boolean(onGoToVillage);
  const troopSection = troopsSectionFor(
    isOwnedPlayerVillage,
    armyInventory.data ?? [],
    garrison.data ?? [],
    armyInventory.isLoading || garrison.isLoading,
    armyInventory.isError || garrison.isError,
  );
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
    ...(showGoToVillage
      ? [
          {
            icon: '↪',
            label: 'Aller à ce village',
            tone: 'support' as const,
            onClick: () => onGoToVillage?.(entity),
          },
        ]
      : []),
  ];

  return (
    <MapEntityCallout
      actions={actions}
      coordinates={`${entity.x}|${entity.y}`}
      sections={[
        ...(isBarbarian ? captureSectionsFor(entity) : []),
        ...(troopSection ? [troopSection] : []),
      ]}
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

function captureSectionsFor(entity: MapEntity) {
  const duration = getBarbarianCaptureDurationLabel(entity.tier);
  if (!duration) return [];

  return [
    {
      title: 'Capture',
      rows: [
        { label: 'Durée de conquête', value: duration },
        ...(entity.captureWindow
          ? [{ label: 'Statut', value: 'Capture en cours' }]
          : []),
      ],
    },
  ];
}

function troopsSectionFor(
  isOwnedPlayerVillage: boolean,
  inventory: Parameters<typeof summarizePresentTroops>[0],
  garrison: Parameters<typeof summarizePresentTroops>[1],
  isLoading: boolean,
  isError: boolean,
) {
  if (!isOwnedPlayerVillage || isError) return null;
  if (isLoading) {
    return {
      title: 'Troupes présentes',
      rows: [{ label: 'Chargement', value: '...' }],
    };
  }
  return buildTroopsSection(summarizePresentTroops(inventory, garrison));
}
