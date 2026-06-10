import {
  MapEntityCallout,
  type MapEntityCalloutSection,
  type MapEntityCalloutStat,
} from '@/features/design-system/components';
import {
  useArmyInventoryQuery,
  useGarrisonQuery,
  usePublicVillagePowerQuery,
} from '@/api/queries';
import type { MapEntity } from '@/api/world-types';
import type { OpenConquestDto } from '@battleforthecrown/shared/combat';
import { useTickingNow } from '@/lib/useTickingNow';
import { formatRemaining } from '@/features/village/constructionProgress';
import { computeProgress } from '@/features/combat/kingdomActivitiesViewModel';
import { buildTroopsSection, summarizePresentTroops } from './selectedEntityTroops';

interface SelectedEntityPanelProps {
  activeCapture?: OpenConquestDto | null;
  entity: MapEntity | null;
  currentVillageId?: string | null;
  onAttack?: (entity: MapEntity) => void;
  onCaravan?: (entity: MapEntity) => void;
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
  activeCapture,
  entity,
  currentVillageId,
  onAttack,
  onCaravan,
  onScout,
  onGoToVillage,
}: SelectedEntityPanelProps) {
  const now = useTickingNow(1_000);
  const ownedVillageId = entity?.kind === 'PLAYER_VILLAGE' && entity.isMine ? entity.id : null;
  const villagePowerId =
    entity?.kind === 'PLAYER_VILLAGE' || entity?.kind === 'BARBARIAN_VILLAGE'
      ? entity.id
      : null;
  const armyInventory = useArmyInventoryQuery(ownedVillageId);
  const garrison = useGarrisonQuery(ownedVillageId);
  const villagePower = usePublicVillagePowerQuery(villagePowerId);

  if (!entity) return null;

  // Village-only power (buildings); troops are excluded server-side.
  const stats: MapEntityCalloutStat[] | undefined = villagePower.data
    ? [
        {
          icon: '/assets/castle.png',
          value: villagePower.data.buildings.toLocaleString('fr-FR'),
        },
      ]
    : undefined;

  const isPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && !entity.isMine;
  const isOwnedPlayerVillage = entity.kind === 'PLAYER_VILLAGE' && entity.isMine;
  const isBarbarian = entity.kind === 'BARBARIAN_VILLAGE';
  const showAttack = (isBarbarian || isPlayerVillage) && Boolean(onAttack);
  const showScout = (isBarbarian || isPlayerVillage) && Boolean(onScout);
  const showReinforce = isOwnedPlayerVillage
    && entity.id !== currentVillageId
    && Boolean(onAttack);
  const showCaravan = isOwnedPlayerVillage
    && entity.id !== currentVillageId
    && Boolean(onCaravan);
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
  const captureSection = captureSectionFor(entity, activeCapture, now);
  const sections = [captureSection, troopSection].filter(
    (section): section is MapEntityCalloutSection => Boolean(section),
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
    ...(showCaravan
      ? [
          {
            icon: '📦',
            label: 'Envoyer ressources',
            tone: 'support' as const,
            onClick: () => onCaravan?.(entity),
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
      sections={sections}
      stats={stats}
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

function captureSectionFor(
  entity: MapEntity,
  activeCapture: OpenConquestDto | null | undefined,
  nowMs: number,
): MapEntityCalloutSection | null {
  if (activeCapture) {
    const startedAt = Date.parse(activeCapture.captureStartedAt);
    const captureUntil = Date.parse(activeCapture.captureUntil);
    const elapsedMs = Number.isFinite(startedAt)
      ? Math.max(0, nowMs - startedAt)
      : 0;
    const remainingMs = Number.isFinite(captureUntil)
      ? Math.max(0, captureUntil - nowMs)
      : 0;
    const progress = computeProgress(startedAt, captureUntil, nowMs);

    return {
      title: 'Capture',
      rows: [
        {
          icon: '/assets/castle.png',
          label: 'Depuis',
          value: activeCapture.attackerVillageName || 'Village inconnu',
        },
        {
          icon: '/assets/clock.png',
          label: 'Écoulé',
          value: formatRemaining(elapsedMs),
        },
        {
          icon: '/assets/clock.png',
          label: 'Reste',
          value: formatRemaining(remainingMs),
        },
      ],
      progress: {
        label: `${Math.round(progress)}%`,
        value: progress,
      },
    };
  }

  if (!entity.captureWindow) return null;

  const captureUntil = Date.parse(entity.captureWindow.captureUntil);
  const remainingMs = Number.isFinite(captureUntil)
    ? Math.max(0, captureUntil - nowMs)
    : 0;

  return {
    title: 'Capture',
    rows: [
      {
        icon: '/assets/clock.png',
        label: 'Reste',
        value: formatRemaining(remainingMs),
      },
    ],
  };
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
