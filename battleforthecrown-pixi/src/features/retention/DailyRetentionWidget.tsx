import { useCallback, useMemo, useState } from "react";
import type {
  DailyCardDto,
  DailyCardTaskDto,
  DailyCardTaskType,
  OyezTheme,
  RetentionSummaryDto,
} from "@battleforthecrown/shared/retention";
import { VILLAGE_LABEL_DISPLAY } from "@battleforthecrown/shared/village";
import {
  DailyQuestModal,
  type DailyQuestChapter,
  type DailyQuestClaimPanel,
  type DailyQuestItem,
  type DailyQuestOyez,
  type DailyQuestReward,
  RoyalSeal,
} from "@/features/design-system/components";
import type { JoinedVillage } from "@/api";
import {
  GAME_ACTIONS,
  getDailyTaskGameAction,
  type GameActionId,
} from "@/features/game-actions/gameActions";
import { ModalOverlay } from "@/ui/modals/ModalOverlay";

interface ClaimInput {
  cardId: string;
  villageId: string;
}

export interface DailyRetentionWidgetProps {
  activeVillageId: string | null;
  className?: string;
  /** When true the RoyalSeal trigger button is not rendered (portal-only mode) */
  hideButton?: boolean;
  isClaiming?: boolean;
  isLoading?: boolean;
  onAction?: (actionId: GameActionId) => void;
  onClaim: (input: ClaimInput) => void;
  onNavigate: (path: string) => void;
  /** Controlled open state. When provided the component does not manage its own open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Override the RoyalSeal size (default 58) */
  sealSize?: number;
  summary?: RetentionSummaryDto;
  villages: JoinedVillage[];
}

const taskLabelOverride: Partial<Record<DailyCardTaskType, string>> = {
  RAID_BARBARIAN: "Vaincre un village barbare",
};

const OYEZ_THEME_ICON: Record<OyezTheme, string> = {
  BUILDERS: "/assets/castle.png",
  MARCH: "/assets/army-power.png",
  WATCH: "/assets/watchtower.png",
  BARBARIANS: "/assets/attack.png",
};

const rewardFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});
const cardDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

function rewardPills(card: DailyCardDto): DailyQuestReward[] {
  return [
    {
      icon: "/assets/resources/wood.png",
      value: rewardFormatter.format(card.reward.wood),
    },
    {
      icon: "/assets/resources/stone.png",
      value: rewardFormatter.format(card.reward.stone),
    },
    {
      icon: "/assets/resources/iron.png",
      value: rewardFormatter.format(card.reward.iron),
    },
  ].filter((reward) => reward.value !== "0");
}

function formatCardTitle(card: DailyCardDto): string {
  const [year, month, day] = card.dayKey.split("-").map(Number);
  if (!year || !month || !day) return "Aujourd’hui";
  return cardDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

function mapTask(
  task: DailyCardTaskDto,
  onAction: (actionId: GameActionId) => void,
): DailyQuestItem {
  const meta = getDailyTaskGameAction(task.type);
  const isDone = task.completedAt !== null || task.progress >= task.target;
  return {
    action: isDone
      ? undefined
      : {
          label: meta.actionLabel,
          onAction: () => onAction(meta.gameActionId),
        },
    have: task.progress,
    icon: meta.icon,
    id: task.id,
    loopLabel: meta.loopLabel,
    name: task.metadata.minTargetTier
      ? task.label
      : (taskLabelOverride[task.type] ?? task.label),
    need: task.target,
    rewards: [],
    state: isDone ? "done" : "progress",
  };
}

function mapOyez(summary: RetentionSummaryDto): DailyQuestOyez | undefined {
  if (!summary.oyez) return undefined;
  return {
    effect: summary.oyez.description,
    eyebrow: "Oyez · en cours",
    icon: OYEZ_THEME_ICON[summary.oyez.theme] ?? "/assets/crown.png",
    title: summary.oyez.title,
  };
}

function villageOptionLabel(village: JoinedVillage): string {
  const label = village.isCapital
    ? "Capitale"
    : village.label
      ? VILLAGE_LABEL_DISPLAY[village.label]
      : "Village";
  return `${label} · ${village.name}`;
}

function chooseDefaultVillageId(
  summary: RetentionSummaryDto | undefined,
  activeVillageId: string | null,
  villages: JoinedVillage[],
): string {
  const preferred = summary?.defaultRewardVillageId ?? activeVillageId;
  if (preferred && villages.some((village) => village.id === preferred))
    return preferred;
  return villages[0]?.id ?? "";
}

export function DailyRetentionWidget({
  activeVillageId,
  className,
  hideButton = false,
  isClaiming = false,
  isLoading = false,
  onAction,
  onClaim,
  onNavigate,
  open: controlledOpen,
  onOpenChange,
  sealSize = 58,
  summary,
  villages,
}: DailyRetentionWidgetProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? (controlledOpen ?? false) : internalOpen;
  const handleSetOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );
  const [isSealPressed, setIsSealPressed] = useState(false);
  const [selectedVillageId, setSelectedVillageId] = useState("");
  const claimableCount = summary?.claimableCount ?? 0;
  const defaultVillageId = chooseDefaultVillageId(
    summary,
    activeVillageId,
    villages,
  );
  const selectedRewardVillageId =
    selectedVillageId &&
    villages.some((village) => village.id === selectedVillageId)
      ? selectedVillageId
      : defaultVillageId;

  const focusCard = useMemo(() => {
    if (!summary) return undefined;
    return (
      summary.cards.find((card) => card.status === "CLAIMABLE") ??
      summary.cards.find((card) => card.status === "ACTIVE") ??
      summary.cards[0]
    );
  }, [summary]);

  const runActionAndClose = useCallback(
    (actionId: GameActionId) => {
      handleSetOpen(false);
      if (onAction) {
        onAction(actionId);
        return;
      }
      onNavigate(GAME_ACTIONS[actionId].route);
    },
    [handleSetOpen, onAction, onNavigate],
  );

  const quests = useMemo(
    () =>
      focusCard?.tasks.map((task) => mapTask(task, runActionAndClose)) ?? [],
    [focusCard, runActionAndClose],
  );

  const chapter: DailyQuestChapter | undefined = focusCard
    ? {
        eyebrow: focusCard.status === "CLAIMABLE" ? "Récompense prête" : "",
        expiresIn: "",
        icon: "/assets/crown.png",
        rewardLabel: "Ressources",
        rewards: rewardPills(focusCard),
        title: formatCardTitle(focusCard),
      }
    : undefined;

  const completedCount = quests.filter(
    (quest) => quest.state === "done",
  ).length;
  const canClaim =
    focusCard?.status === "CLAIMABLE" && selectedRewardVillageId.length > 0;

  const claimPanel: DailyQuestClaimPanel | undefined =
    focusCard?.status === "CLAIMABLE"
      ? {
          claimLabel: isClaiming ? "Récupération..." : "Récupérer",
          disabled: isClaiming,
          isClaiming,
          onVillageChange: setSelectedVillageId,
          rewardLabel: "Gain",
          rewards: rewardPills(focusCard),
          selectedVillageId: selectedRewardVillageId,
          villageLabel: "Village récompensé",
          villages: villages.map((village) => ({
            id: village.id,
            label: villageOptionLabel(village),
          })),
        }
      : undefined;

  const handlePrimaryAction = () => {
    if (focusCard?.status === "CLAIMABLE") {
      if (selectedRewardVillageId) {
        onClaim({ cardId: focusCard.id, villageId: selectedRewardVillageId });
      }
      return;
    }
  };

  return (
    <>
      {!hideButton && (
        <RoyalSeal
          ariaLabel={
            claimableCount > 0
              ? `Devoir royal, ${claimableCount} carte${claimableCount > 1 ? "s" : ""} à réclamer`
              : "Devoir royal"
          }
          badge={claimableCount > 0}
          badgeCount={claimableCount > 0 ? claimableCount : null}
          className={
            isLoading && !summary ? `${className ?? ""} opacity-60` : className
          }
          halo={claimableCount > 0}
          onBlur={() => setIsSealPressed(false)}
          onClick={() => handleSetOpen(true)}
          onPointerCancel={() => setIsSealPressed(false)}
          onPointerDown={() => setIsSealPressed(true)}
          onPointerLeave={() => setIsSealPressed(false)}
          onPointerUp={() => setIsSealPressed(false)}
          pressed={isOpen || isSealPressed}
          size={sealSize}
          variant="crown"
        />
      )}

      {summary ? (
        <ModalOverlay
          ariaLabel="Devoir royal"
          isOpen={isOpen}
          onClose={() => handleSetOpen(false)}
          zIndex={80}
        >
          <DailyQuestModal
                chapter={chapter}
                claimPanel={claimPanel}
                claimRowLabel="Réclamer"
                closeLabel="Fermer"
                completedLabel="accomplies"
                completedSummary={`${completedCount} / ${quests.length}`}
                eyebrow={undefined}
                expiresInLabel="Expire à"
                expiresInValue="04h00"
                maxHeight="min(680px, calc(100dvh - 18px))"
                onClose={() => handleSetOpen(false)}
                onPrimaryAction={handlePrimaryAction}
                oyez={mapOyez(summary)}
                primaryActionDisabled={
                  focusCard?.status !== "CLAIMABLE" || !canClaim || isClaiming
                }
                primaryActionLabel={
                  isClaiming ? "Récupération..." : "Récupérer"
                }
                primaryActionVariant={
                  focusCard?.status === "CLAIMABLE" ? "success" : "neutral"
                }
                quests={quests}
                questsTodayLabel="Tâches du jour"
                rewardLabel="Récompense"
                tasksDividerLabel="Tâches du Roi"
                taskDoneLabel="Tâche accomplie"
                title="Devoir royal"
                width="min(360px, calc(100vw - 24px))"
              />
        </ModalOverlay>
      ) : null}
    </>
  );
}
