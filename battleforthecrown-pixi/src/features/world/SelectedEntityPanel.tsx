import { useState } from "react";
import {
  VillageMapPanel,
  type VillageMapVariant,
  type VillageMapTypeTag,
  type BarbarianTier,
  type FullIntelArmyEntry,
  type FullIntelPanelProps,
} from "@/features/design-system/components";
import { useQuery } from "@tanstack/react-query";
import {
  publicKingdomPowerQueryOptions,
  useArmyInventoryQuery,
  useGarrisonQuery,
  useKingdomPowerQuery,
  usePublicVillagePowerQuery,
  useVillageIntelQuery,
} from "@/api/queries";
import {
  entityTileImageSrc,
  mapEntityDisplayName,
  type MapEntity,
} from "@/api/world-types";
import {
  getPvpCaptureDurationLabel,
  type OpenConquestDto,
} from "@battleforthecrown/shared/combat";
import type { WorldTier } from "@battleforthecrown/shared/world";
import { isAttackAllowedByPowerRatio } from "@battleforthecrown/shared";
import { useGameStore } from "@/stores/game";
import { useTickingNow } from "@/lib/useTickingNow";
import { formatRemaining } from "@/features/village/constructionProgress";
import { unitMetaFor } from "@/features/army/unitConfig";
import { unitCategoryFor } from "@/features/design-system/components/villageMapPanel/meta";
import { summarizePresentTroops } from "./selectedEntityTroops";
import { formatIntelAge, toIntelView } from "./intelView";
import { ReportDetailModal } from "@/features/combat/ReportDetailModal";
import { PublicPlayerProfileSheet } from "./PublicPlayerProfileSheet";

interface SelectedEntityPanelProps {
  /** Accepté pour compat appelant ; la progression de capture n'est plus
   *  rendue dans ce panneau (la carte parchemin du mockup n'a pas de slot). */
  activeCapture?: OpenConquestDto | null;
  entity: MapEntity | null;
  currentVillageId?: string | null;
  /** Id du joueur courant — masque le CTA « Voir profil » sur ses villages. */
  currentUserId?: string | null;
  onAttack?: (entity: MapEntity) => void;
  onCaravan?: (entity: MapEntity) => void;
  onScout?: (entity: MapEntity) => void;
  onGoToVillage?: (entity: MapEntity) => void;
  onClose?: () => void;
}

export function SelectedEntityPanel({
  activeCapture,
  entity,
  currentVillageId,
  currentUserId,
  onAttack,
  onCaravan,
  onScout,
  onGoToVillage,
  onClose,
}: SelectedEntityPanelProps) {
  const now = useTickingNow(1_000);
  const worldId = useGameStore((state) => state.worldId);
  const [reportModal, setReportModal] = useState<{
    reportId: string;
    reportKind: "scout" | "combat";
  } | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const ownedVillageId =
    entity?.kind === "PLAYER_VILLAGE" && entity.isMine ? entity.id : null;
  const villagePowerId =
    entity?.kind === "PLAYER_VILLAGE" || entity?.kind === "BARBARIAN_VILLAGE"
      ? entity.id
      : null;

  const isEnemyVillage =
    entity != null &&
    (entity.kind === "PLAYER_VILLAGE" || entity.kind === "BARBARIAN_VILLAGE") &&
    !entity.isMine;
  const intelQuery = useVillageIntelQuery(
    worldId,
    entity?.id ?? null,
    isEnemyVillage,
  );

  const defenderUserId =
    entity?.kind === "PLAYER_VILLAGE" && !entity.isMine
      ? (entity.ownerId ?? null)
      : null;

  const armyInventory = useArmyInventoryQuery(ownedVillageId);
  const garrison = useGarrisonQuery(ownedVillageId);
  const villagePower = usePublicVillagePowerQuery(villagePowerId);
  const myKingdomPower = useKingdomPowerQuery();
  const defenderKingdomPower = useQuery({
    ...publicKingdomPowerQueryOptions(defenderUserId, worldId ?? ""),
    enabled: defenderUserId !== null && Boolean(worldId),
  });

  if (!entity) return null;

  const isOwnedPlayerVillage =
    entity.kind === "PLAYER_VILLAGE" && entity.isMine;
  const isPlayerVillage = entity.kind === "PLAYER_VILLAGE" && !entity.isMine;
  const isBarbarian = entity.kind === "BARBARIAN_VILLAGE";

  // Bouclier débutant 48h — grise l'attaque (spec inchangée).
  const shield = entity.newbieShield;
  const shieldEndsMs = shield ? Date.parse(shield.endsAt) : Number.NaN;
  const shieldRemainingMs = Number.isFinite(shieldEndsMs)
    ? Math.max(0, shieldEndsMs - now)
    : 0;
  const shieldActive = Boolean(shield?.active && shieldRemainingMs > 0);
  const shieldBlocksAttack = shieldActive && isPlayerVillage;

  // Garde anti-snowball ÷3 (spec 14 §2). Pré-check miroir du serveur.
  const attackerPower = myKingdomPower.data?.kingdomPower;
  const defenderPower = defenderKingdomPower.data?.kingdomPower;
  const ratioBlocksAttack =
    isPlayerVillage &&
    !shieldBlocksAttack &&
    attackerPower !== undefined &&
    defenderPower !== undefined &&
    !isAttackAllowedByPowerRatio({ attackerPower, defenderPower });

  const attackBlockedReason = shieldBlocksAttack
    ? `Bouclier débutant (${formatRemaining(shieldRemainingMs)} restantes)`
    : ratioBlocksAttack
      ? "Puissance trop faible"
      : null;
  const attackBlocked = attackBlockedReason !== null;

  const intelData = intelQuery.isSuccess ? (intelQuery.data ?? null) : null;
  const variant: VillageMapVariant = isOwnedPlayerVillage
    ? "mine"
    : isBarbarian
      ? "barbare"
      : intelData != null
        ? "scouted"
        : "unscouted";

  const typeTag: VillageMapTypeTag = isOwnedPlayerVillage
    ? "mine"
    : isBarbarian
      ? "pvm"
      : "player";

  const villageBuildingPower = villagePower.data?.buildings ?? null;
  const ownerPower = isOwnedPlayerVillage
    ? (myKingdomPower.data?.kingdomPower ?? null)
    : isPlayerVillage
      ? (defenderKingdomPower.data?.kingdomPower ?? null)
      : null;

  let intel: FullIntelPanelProps | undefined;
  if (variant === "mine") {
    const troops = summarizePresentTroops(
      armyInventory.data ?? [],
      garrison.data ?? [],
    );
    intel = { army: toPanelArmy(troops) };
  } else if (variant === "scouted" && intelData) {
    const view = toIntelView(intelData);
    const ago = formatIntelAge(intelData.seenAt, new Date(now)).replace(
      /^il y a /,
      "",
    );
    const seenMs = Date.parse(intelData.seenAt);
    const fresh = Number.isFinite(seenMs) ? now - seenMs < 3_600_000 : false;
    intel = {
      loot: view.resources,
      army: toPanelArmy(view.units),
      wall: intelData.wallLevel,
      style: view.styleLabel === "—" ? null : view.styleLabel,
      freshness: { ago, fresh },
    };
  }

  const tier = isBarbarian ? tierToNumber(entity.tier) : undefined;
  const isOtherOwned =
    isOwnedPlayerVillage && entity.id !== currentVillageId;

  const openReport = () => {
    if (!intelData) return;
    setReportModal({
      reportId: intelData.sourceReportId,
      reportKind: intelData.sourceKind === "SCOUT" ? "scout" : "combat",
    });
  };

  // CTA « Voir profil » : seulement sur un village joueur tiers (jamais le sien,
  // jamais un barbare). La fiche est scopée par joueur (ownerId), pas par village.
  const profileTargetUserId =
    isPlayerVillage &&
    entity.ownerId != null &&
    entity.ownerId !== currentUserId
      ? entity.ownerId
      : null;

  // Preview lecture seule de la fenêtre de capture PvP sur un village joueur
  // ennemi (durée de base dérivée du Château, sans tempo). Masquée pendant une
  // capture déjà active ou en fenêtre. Le castleLevel est public (taille carte).
  const captureWindowLabel =
    isPlayerVillage && !activeCapture && !entity.captureWindow
      ? getPvpCaptureDurationLabel(entity.castleLevel ?? null)
      : null;

  return (
    <>
      <VillageMapPanel
        variant={variant}
        name={mapEntityDisplayName(entity)}
        iconSrc={entityTileImageSrc(entity)}
        coords={`${entity.x} | ${entity.y}`}
        typeTag={typeTag}
        owner={isBarbarian ? null : (entity.ownerDisplayName ?? null)}
        villagePower={villageBuildingPower}
        ownerPower={ownerPower}
        intel={intel}
        tier={tier}
        captureWindowLabel={captureWindowLabel}
        attackBlocked={attackBlocked}
        attackBlockedReason={attackBlockedReason}
        onClose={onClose}
        onEnter={
          isOtherOwned && onGoToVillage ? () => onGoToVillage(entity) : undefined
        }
        onSendResources={
          isOtherOwned && onCaravan ? () => onCaravan(entity) : undefined
        }
        onReinforce={
          isOtherOwned && onAttack ? () => onAttack(entity) : undefined
        }
        onScout={
          (isPlayerVillage || isBarbarian) && onScout
            ? () => onScout(entity)
            : undefined
        }
        onAttack={
          (isPlayerVillage || isBarbarian) && onAttack
            ? () => onAttack(entity)
            : undefined
        }
        onViewReport={
          variant === "scouted" && intelData ? openReport : undefined
        }
        onViewProfile={
          profileTargetUserId
            ? () => setProfileUserId(profileTargetUserId)
            : undefined
        }
      />
      {reportModal && (
        <ReportDetailModal
          reportId={reportModal.reportId}
          reportKind={reportModal.reportKind}
          onClose={() => setReportModal(null)}
        />
      )}
      {profileUserId && worldId && (
        <PublicPlayerProfileSheet
          userId={profileUserId}
          worldId={worldId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </>
  );
}

function tierToNumber(tier: WorldTier | null): BarbarianTier | undefined {
  if (!tier) return undefined;
  const n = Number(tier.slice(1));
  return n >= 1 && n <= 5 ? (n as BarbarianTier) : undefined;
}

// Sprite générique pour les unités sans icône dédiée (CATAPULT, RAM) : on garde
// la ligne et son compteur plutôt que de les dropper — sinon le total « N unités »
// serait sous-compté et l'unité disparaîtrait du dossier.
const FALLBACK_UNIT_ICON = "/assets/army-power.png";

function toPanelArmy(
  rows: { unitType: string; quantity: number }[],
): FullIntelArmyEntry[] {
  return rows.map((row) => {
    const meta = unitMetaFor(row.unitType);
    return {
      icon: meta.iconPath ?? FALLBACK_UNIT_ICON,
      count: row.quantity,
      category: unitCategoryFor(row.unitType),
      name: meta.name,
    };
  });
}
