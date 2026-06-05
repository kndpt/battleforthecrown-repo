import type {
  OpenConquestDto,
  OpenExpeditionDto,
} from '@battleforthecrown/shared/combat';
import type {
  CaptureTier,
  CaptureWindowCardProps,
  ExpeditionActivityCardProps,
} from '@/features/design-system/components';
import { formatRemaining } from '@/features/village/constructionProgress';

const SOON_THRESHOLD_MS = 15 * 60_000;

export interface KingdomActivityLabels {
  captureEndTimeLabel: string;
  captureOriginLabelPrefix: string;
  captureStatusLabel: string;
  captureSoonStatusLabel: string;
  nobleEyebrow: string;
  nobleNameFallback: string;
  tierSubLabel: string;
}

export const KINGDOM_ACTIVITY_LABELS: KingdomActivityLabels = {
  captureEndTimeLabel: 'Fin à',
  captureOriginLabelPrefix: 'Depuis',
  captureSoonStatusLabel: 'Bientôt terminée',
  captureStatusLabel: 'Capture en cours',
  nobleEyebrow: 'Seigneur immobilisé',
  nobleNameFallback: 'Seigneur',
  tierSubLabel: 'Tier',
};

const EXPEDITION_LABELS: Record<OpenExpeditionDto['kind'], string> = {
  ATTACK: 'ATTAQUE',
  REINFORCE: 'RENFORT',
  SCOUT: 'SCOUT',
};

const EXPEDITION_ICONS: Record<OpenExpeditionDto['kind'], string> = {
  ATTACK: '/assets/hand-red.png',
  REINFORCE: '/assets/hand-silver.png',
  SCOUT: '/assets/lupa.png',
};

export function mapOpenConquestToCaptureCard(
  conquest: OpenConquestDto,
  nowMs: number,
  labels: KingdomActivityLabels = KINGDOM_ACTIVITY_LABELS,
): CaptureWindowCardProps {
  const captureStartedAt = Date.parse(conquest.captureStartedAt);
  const captureUntil = Date.parse(conquest.captureUntil);
  const remainingMs = Math.max(0, captureUntil - nowMs);
  const progress = computeProgress(captureStartedAt, captureUntil, nowMs);
  const soon = remainingMs > 0 && remainingMs <= SOON_THRESHOLD_MS;
  const isPlayerTarget = conquest.targetKind === 'PLAYER_VILLAGE';

  return {
    coordinates: `${conquest.targetX}|${conquest.targetY}`,
    endTime: formatTime(captureUntil),
    endTimeLabel: labels.captureEndTimeLabel,
    nobleEyebrow: labels.nobleEyebrow,
    nobleName: labels.nobleNameFallback,
    originLabelPrefix: labels.captureOriginLabelPrefix,
    originName: conquest.attackerVillageName,
    progress,
    state: soon ? 'soon' : 'open',
    statusLabel: soon ? labels.captureSoonStatusLabel : labels.captureStatusLabel,
    targetName: conquest.targetName,
    tier: isPlayerTarget ? 'PVP' : conquest.targetTier ?? ('T1' satisfies CaptureTier),
    tierSubLabel: isPlayerTarget
      ? formatCastleLevel(conquest.targetCastleLevel)
      : labels.tierSubLabel,
    timeRemaining: formatRemaining(remainingMs),
  };
}

export function mapOpenExpeditionToActivityCard(
  expedition: OpenExpeditionDto,
  nowMs: number,
  onRecall?: (expeditionId: string, attackerVillageId: string) => void,
): ExpeditionActivityCardProps {
  const departAt = Date.parse(expedition.departAt);
  const arrivalAt = Date.parse(expedition.arrivalAt);
  const returnAt = expedition.returnAt ? Date.parse(expedition.returnAt) : null;
  const dueAt = expedition.status === 'RETURNING' && returnAt ? returnAt : arrivalAt;
  const statusLabel = expedition.isConquest
    ? 'CONQUÊTE'
    : EXPEDITION_LABELS[expedition.kind];
  const tone = expedition.isConquest
    ? 'conquest'
    : expedition.kind === 'REINFORCE'
      ? 'reinforce'
      : expedition.kind === 'SCOUT'
        ? 'scout'
        : 'attack';

  return {
    icon: expedition.isConquest ? '/assets/casual-icons/crown.png' : EXPEDITION_ICONS[expedition.kind],
    kind: tone,
    movementId: expedition.expeditionId,
    onRecall: onRecall ? () => onRecall(expedition.expeditionId, expedition.attackerVillageId) : undefined,
    phase:
      expedition.status === 'RETURNING'
        ? 'returning'
        : expedition.status === 'RESOLVED'
          ? 'resolved'
          : 'en_route',
    progress:
      expedition.status === 'RETURNING' && returnAt
        ? computeProgress(arrivalAt, returnAt, nowMs)
        : computeProgress(departAt, arrivalAt, nowMs),
    recallLabel:
      expedition.status === 'EN_ROUTE' && expedition.kind !== 'REINFORCE'
        ? 'Rappeler'
        : undefined,
    statusLabel,
    subtitle: `${expedition.targetX}|${expedition.targetY} · ${expedition.status === 'RETURNING' ? 'Retour' : 'Arrivée'} ${formatRelativeDue(dueAt, nowMs)}`,
    time: formatRemaining(Math.max(0, dueAt - nowMs)),
    title: expedition.targetName ?? expedition.targetKind,
  };
}

export function formatTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) return '--:--';
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDue(dueAt: number, nowMs: number): string {
  if (!Number.isFinite(dueAt)) return 'indisponible';
  return `dans ${formatRemaining(Math.max(0, dueAt - nowMs))}`;
}

function formatCastleLevel(castleLevel: number | null | undefined): string {
  return castleLevel ? `Ch. ${castleLevel}` : 'Joueur';
}

export function computeProgress(startAt: number, endAt: number, nowMs: number): number {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    return 100;
  }

  return Math.min(100, Math.max(0, ((nowMs - startAt) / (endAt - startAt)) * 100));
}
