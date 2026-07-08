import type {
  DefenderCaptureDto,
  OpenConquestDto,
  OpenExpeditionDto,
} from '@battleforthecrown/shared/combat';
import type { IncomingAttackDto } from '@battleforthecrown/shared/events';
import type {
  CaptureTier,
  CaptureWindowCardProps,
  ExpeditionActivityCardProps,
  IncomingAttackCardProps,
} from '@/features/design-system/components';
import { clamp } from '@/lib/math';
import { formatRemaining } from '@/features/village/constructionProgress';

const SOON_THRESHOLD_MS = 15 * 60_000;

export interface KingdomActivityLabels {
  captureEndTimeLabel: string;
  captureOriginLabelPrefix: string;
  captureStatusLabel: string;
  captureSoonStatusLabel: string;
  incomingThreatStatus: string;
  incomingThreatSubtitlePrefix: string;
  incomingThreatTitle: string;
  nobleEyebrow: string;
  nobleNameFallback: string;
  siegeStatusLabel: string;
  siegeSoonStatusLabel: string;
  tierSubLabel: string;
}

export const KINGDOM_ACTIVITY_LABELS: KingdomActivityLabels = {
  captureEndTimeLabel: 'Fin à',
  captureOriginLabelPrefix: 'Depuis',
  captureSoonStatusLabel: 'Bientôt terminée',
  captureStatusLabel: 'Capture en cours',
  incomingThreatStatus: 'Imminente',
  incomingThreatSubtitlePrefix: 'Cible',
  incomingThreatTitle: 'ATTAQUE ENTRANTE',
  nobleEyebrow: 'Seigneur immobilisé',
  nobleNameFallback: 'Seigneur',
  siegeStatusLabel: 'Sous siège',
  siegeSoonStatusLabel: 'Chute imminente',
  tierSubLabel: 'Tier',
};

/**
 * Window over which an incoming attack visually "fills" its row. We have no
 * depart time (fog-of-war: the DTO never reveals it), so the bar reflects
 * imminence — it grows as the ETA falls inside this window. Purely a function
 * of remaining ETA, so it never leaks the attacker's travel distance/origin.
 */
const INCOMING_ATTACK_IMMINENCE_MS = 15 * 60_000;

const EXPEDITION_LABELS: Record<OpenExpeditionDto['kind'], string> = {
  ATTACK: 'ATTAQUE',
  REINFORCE: 'RENFORT',
  SCOUT: 'SCOUT',
  CARAVAN: 'CARAVANE',
  EXTRACTION: 'EXTRACTION',
};

const EXPEDITION_ICONS: Record<OpenExpeditionDto['kind'], string> = {
  ATTACK: '/assets/hand-red.png',
  REINFORCE: '/assets/hand-silver.png',
  SCOUT: '/assets/lupa.png',
  CARAVAN: '/assets/resources/resources.png',
  EXTRACTION: '/assets/resources/resources.png',
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
    id: conquest.pendingConquestId,
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

/**
 * Maps the fog-safe defender view of a capture window to a siege card. Mirror
 * of {@link mapOpenConquestToCaptureCard} minus every attacker field: no noble,
 * no origin village — the besieged owner only sees their own village and the
 * countdown until it falls. Always rendered in the neutral `open` (gold) state
 * so the green "about to succeed" tone (an attacker cue) never misleads the
 * defender; urgency is carried textually via {@link siegeSoonStatusLabel}.
 */
export function mapDefenderCaptureToSiegeCard(
  capture: DefenderCaptureDto,
  nowMs: number,
  labels: KingdomActivityLabels = KINGDOM_ACTIVITY_LABELS,
): CaptureWindowCardProps {
  const captureStartedAt = Date.parse(capture.captureStartedAt);
  const captureUntil = Date.parse(capture.captureUntil);
  const remainingMs = Math.max(0, captureUntil - nowMs);
  const progress = computeProgress(captureStartedAt, captureUntil, nowMs);
  const soon = remainingMs > 0 && remainingMs <= SOON_THRESHOLD_MS;

  return {
    id: capture.pendingConquestId,
    coordinates: `${capture.targetX}|${capture.targetY}`,
    endTime: formatTime(captureUntil),
    endTimeLabel: labels.captureEndTimeLabel,
    progress,
    state: 'open',
    statusLabel: soon ? labels.siegeSoonStatusLabel : labels.siegeStatusLabel,
    targetName: capture.targetName,
    tier: 'PVP',
    tierSubLabel: formatCastleLevel(capture.targetCastleLevel),
    timeRemaining: formatRemaining(remainingMs),
  };
}

/**
 * Dedup + sort helper for the defender siege feed. The endpoint already returns
 * distinct rows, but the at-least-once Outbox means a duplicated WS delivery
 * can momentarily surface the same `pendingConquestId` twice mid-refetch; this
 * collapses duplicates by id (first wins) so the feed never shows a doubled
 * card, and orders by soonest deadline first.
 */
export function mapDefenderCapturesToSiegeCards(
  captures: DefenderCaptureDto[],
  nowMs: number,
  labels: KingdomActivityLabels = KINGDOM_ACTIVITY_LABELS,
): CaptureWindowCardProps[] {
  const byId = new Map<string, DefenderCaptureDto>();
  for (const capture of captures) {
    if (!byId.has(capture.pendingConquestId)) {
      byId.set(capture.pendingConquestId, capture);
    }
  }
  return [...byId.values()]
    .sort((a, b) => Date.parse(a.captureUntil) - Date.parse(b.captureUntil))
    .map((capture) => mapDefenderCaptureToSiegeCard(capture, nowMs, labels));
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
        : expedition.kind === 'CARAVAN'
          ? 'caravan'
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

export function mapIncomingAttackToThreatCard(
  attack: IncomingAttackDto,
  nowMs: number,
  labels: KingdomActivityLabels = KINGDOM_ACTIVITY_LABELS,
): IncomingAttackCardProps {
  const arrivalAt = Date.parse(attack.arrivalAt);
  const remainingMs = Math.max(0, arrivalAt - nowMs);
  const imminence = clamp(
    (1 - remainingMs / INCOMING_ATTACK_IMMINENCE_MS) * 100,
    0,
    100,
  );

  return {
    icon: '/assets/hand-red.png',
    movementId: attack.expeditionId,
    progress: imminence,
    statusLabel: labels.incomingThreatStatus,
    subtitle: `${labels.incomingThreatSubtitlePrefix} ${attack.targetX}|${attack.targetY} · Arrivée ${formatRelativeDue(arrivalAt, nowMs)}`,
    time: formatRemaining(remainingMs),
    title: labels.incomingThreatTitle,
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
