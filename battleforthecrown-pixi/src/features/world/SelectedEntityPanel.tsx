import {
  MapEntityCallout,
  type MapEntityCalloutSection,
  type MapEntityCalloutStat,
} from '@/features/design-system/components';
import { useQuery } from '@tanstack/react-query';
import {
  publicKingdomPowerQueryOptions,
  useArmyInventoryQuery,
  useGarrisonQuery,
  useKingdomPowerQuery,
  usePublicVillagePowerQuery,
} from '@/api/queries';
import type { MapEntity } from '@/api/world-types';
import type { OpenConquestDto } from '@battleforthecrown/shared/combat';
import { isAttackAllowedByPowerRatio } from '@battleforthecrown/shared';
import { useGameStore } from '@/stores/game';
import { useTickingNow } from '@/lib/useTickingNow';
import { formatRemaining } from '@/features/village/constructionProgress';
import { computeProgress } from '@/features/combat/kingdomActivitiesViewModel';
import { mapEntityCalloutSubtitle } from './mapEntityLabels';
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
  const worldId = useGameStore((state) => state.worldId);
  // Enemy player owner — used to fetch defender kingdom power for the ÷3 guard.
  const defenderUserId =
    entity?.kind === 'PLAYER_VILLAGE' && !entity.isMine
      ? (entity.ownerId ?? null)
      : null;
  const armyInventory = useArmyInventoryQuery(ownedVillageId);
  const garrison = useGarrisonQuery(ownedVillageId);
  const villagePower = usePublicVillagePowerQuery(villagePowerId);
  const myKingdomPower = useKingdomPowerQuery();
  const defenderKingdomPower = useQuery({
    ...publicKingdomPowerQueryOptions(defenderUserId, worldId ?? ''),
    enabled: defenderUserId !== null && Boolean(worldId),
  });

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
  const shield = entity.newbieShield;
  const shieldEndsMs = shield ? Date.parse(shield.endsAt) : Number.NaN;
  const shieldRemainingMs = Number.isFinite(shieldEndsMs)
    ? Math.max(0, shieldEndsMs - now)
    : 0;
  const shieldActive = Boolean(shield?.active && shieldRemainingMs > 0);
  const shieldBlocksAttack = shieldActive && isPlayerVillage;

  // Anti-snowball power guard (spec 14 §2). Pre-check mirrors the server: the
  // attack is forbidden when the defender's kingdom power is below 1/3 of ours.
  // Only computed for enemy player villages with both powers loaded; the server
  // remains authoritative (403 POWER_RATIO_FORBIDDEN intercepted at send time).
  const attackerPower = myKingdomPower.data?.kingdomPower;
  const defenderPower = defenderKingdomPower.data?.kingdomPower;
  const ratioBlocksAttack =
    isPlayerVillage
    && !shieldBlocksAttack
    && attackerPower !== undefined
    && defenderPower !== undefined
    && !isAttackAllowedByPowerRatio({ attackerPower, defenderPower });

  const attackBlockLabel = shieldBlocksAttack
    ? `Joueur protégé — bouclier débutant (${formatRemaining(shieldRemainingMs)} restantes)`
    : ratioBlocksAttack
      ? 'Puissance trop faible'
      : null;
  const attackBlocked = attackBlockLabel !== null;

  const troopSection = troopsSectionFor(
    isOwnedPlayerVillage,
    armyInventory.data ?? [],
    garrison.data ?? [],
    armyInventory.isLoading || garrison.isLoading,
    armyInventory.isError || garrison.isError,
  );
  const captureSection = captureSectionFor(entity, activeCapture, now);
  const shieldSection = shieldSectionFor(entity, now);
  const sections = [captureSection, shieldSection, troopSection].filter(
    (section): section is MapEntityCalloutSection => Boolean(section),
  );
  const actions = [
    ...(showAttack
      ? [
          {
            icon: '⚔',
            label: attackBlockLabel ?? 'Attaquer',
            tone: 'attack' as const,
            disabled: attackBlocked ? true : undefined,
            onClick: attackBlocked ? undefined : () => onAttack?.(entity),
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
      subtitle={mapEntityCalloutSubtitle(entity)}
      tier={entity.tier ? { label: `★ ${entity.tier}` } : undefined}
      title={entity.name}
      titleIcon={isBarbarian ? '★' : undefined}
    />
  );
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

function shieldSectionFor(
  entity: MapEntity,
  nowMs: number,
): MapEntityCalloutSection | null {
  const shield = entity.newbieShield;
  if (!shield?.active) return null;
  const endsAt = Date.parse(shield.endsAt);
  const remainingMs = Number.isFinite(endsAt) ? Math.max(0, endsAt - nowMs) : 0;
  if (remainingMs <= 0) return null;
  return {
    title: 'Bouclier débutant',
    rows: [
      {
        icon: '/assets/clock.png',
        label: 'Joueur protégé',
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
