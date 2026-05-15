import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import type {
  DailyCardDto,
  DailyCardTaskDto,
  DailyCardTaskType,
  RetentionSummaryDto,
} from '@battleforthecrown/shared/retention';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';
import {
  DailyQuestModal,
  type DailyQuestBacklog,
  type DailyQuestChapter,
  type DailyQuestClaimPanel,
  type DailyQuestItem,
  type DailyQuestOyez,
  type DailyQuestReward,
  RoyalSeal,
} from '@/features/design-system/components';
import type { JoinedVillage } from '@/api';

interface ClaimInput {
  cardId: string;
  villageId: string;
}

export interface DailyRetentionWidgetProps {
  activeVillageId: string | null;
  className?: string;
  isClaiming?: boolean;
  isLoading?: boolean;
  onClaim: (input: ClaimInput) => void;
  onNavigate: (path: string) => void;
  summary?: RetentionSummaryDto;
  villages: JoinedVillage[];
}

const taskMeta: Record<
  DailyCardTaskType,
  { actionLabel: string; icon: string; loopLabel: string; path: string }
> = {
  TRAIN_UNITS: {
    actionLabel: 'Armée',
    icon: '/assets/army-power.png',
    loopLabel: 'Armée',
    path: '/game/army',
  },
  COMPLETE_BUILDING: {
    actionLabel: 'Village',
    icon: '/assets/castle.png',
    loopLabel: 'Éco',
    path: '/game',
  },
  RAID_BARBARIAN: {
    actionLabel: 'Carte',
    icon: '/assets/attack.png',
    loopLabel: 'PVM',
    path: '/game/world',
  },
  SCOUT_TARGET: {
    actionLabel: 'Carte',
    icon: '/assets/lupa.png',
    loopLabel: 'Scout',
    path: '/game/world',
  },
  SEND_REINFORCEMENT: {
    actionLabel: 'Carte',
    icon: '/assets/defense.png',
    loopLabel: 'Défense',
    path: '/game/world',
  },
};

const statusLabel: Record<DailyCardDto['status'], string> = {
  ACTIVE: 'En cours',
  CLAIMABLE: 'À réclamer',
  CLAIMED: 'Réclamée',
};

const taskLabelOverride: Partial<Record<DailyCardTaskType, string>> = {
  RAID_BARBARIAN: 'Vaincre un village barbare',
};

const rewardFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const cardDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
});

function rewardPills(card: DailyCardDto): DailyQuestReward[] {
  return [
    { icon: '/assets/resources/wood.png', value: rewardFormatter.format(card.reward.wood) },
    { icon: '/assets/resources/stone.png', value: rewardFormatter.format(card.reward.stone) },
    { icon: '/assets/resources/iron.png', value: rewardFormatter.format(card.reward.iron) },
  ].filter((reward) => reward.value !== '0');
}

function formatCardTitle(card: DailyCardDto): string {
  const [year, month, day] = card.dayKey.split('-').map(Number);
  if (!year || !month || !day) return 'Aujourd’hui';
  return cardDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

function mapTask(task: DailyCardTaskDto, onNavigate: (path: string) => void): DailyQuestItem {
  const meta = taskMeta[task.type];
  const isDone = task.completedAt !== null || task.progress >= task.target;
  return {
    action: isDone
      ? undefined
      : {
          label: meta.actionLabel,
          onAction: () => onNavigate(meta.path),
        },
    have: task.progress,
    icon: meta.icon,
    id: task.id,
    loopLabel: meta.loopLabel,
    name: taskLabelOverride[task.type] ?? task.label,
    need: task.target,
    rewards: [],
    state: isDone ? 'done' : 'progress',
  };
}

function mapOyez(summary: RetentionSummaryDto): DailyQuestOyez | undefined {
  if (!summary.oyez) return undefined;
  return {
    effect: summary.oyez.description,
    eyebrow: 'Oyez · en cours',
    icon: '/assets/crown.png',
    title: summary.oyez.title,
  };
}

function villageOptionLabel(village: JoinedVillage): string {
  const label = village.isCapital
    ? 'Capitale'
    : village.label
      ? VILLAGE_LABEL_DISPLAY[village.label]
      : 'Village';
  return `${label} · ${village.name}`;
}

function chooseDefaultVillageId(
  summary: RetentionSummaryDto | undefined,
  activeVillageId: string | null,
  villages: JoinedVillage[],
): string {
  const preferred = summary?.defaultRewardVillageId ?? activeVillageId;
  if (preferred && villages.some((village) => village.id === preferred)) return preferred;
  return villages[0]?.id ?? '';
}

export function DailyRetentionWidget({
  activeVillageId,
  className,
  isClaiming = false,
  isLoading = false,
  onClaim,
  onNavigate,
  summary,
  villages,
}: DailyRetentionWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSealPressed, setIsSealPressed] = useState(false);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const claimableCount = summary?.claimableCount ?? 0;
  const defaultVillageId = chooseDefaultVillageId(summary, activeVillageId, villages);
  const selectedRewardVillageId =
    selectedVillageId && villages.some((village) => village.id === selectedVillageId)
      ? selectedVillageId
      : defaultVillageId;

  const focusCard = useMemo(() => {
    if (!summary) return undefined;
    return (
      summary.cards.find((card) => card.status === 'CLAIMABLE') ??
      summary.cards.find((card) => card.status === 'ACTIVE') ??
      summary.cards[0]
    );
  }, [summary]);

  const navigateAndClose = useCallback((path: string) => {
    setIsOpen(false);
    onNavigate(path);
  }, [onNavigate]);

  const quests = useMemo(
    () => focusCard?.tasks.map((task) => mapTask(task, navigateAndClose)) ?? [],
    [focusCard, navigateAndClose],
  );

  const chapter: DailyQuestChapter | undefined = focusCard
    ? {
        eyebrow: focusCard.status === 'CLAIMABLE' ? 'Récompense prête' : 'En cours',
        expiresIn: '',
        icon: '/assets/crown.png',
        rewardLabel: 'Ressources',
        rewards: rewardPills(focusCard),
        title: formatCardTitle(focusCard),
      }
    : undefined;

  const backlogCards =
    summary?.cards
      .filter((card) => card.id !== focusCard?.id)
      .map((card) => ({
        id: card.id,
        statusLabel: statusLabel[card.status],
        title: formatCardTitle(card),
      })) ?? [];
  const backlog: DailyQuestBacklog | undefined =
    backlogCards.length > 0
      ? {
          badgeLabel: `${backlogCards.length}`,
          cards: backlogCards,
          hint: 'Cartes conservées pour rattraper les jours manqués.',
          title: 'Cartes en attente',
        }
      : undefined;

  const completedCount = quests.filter((quest) => quest.state === 'done').length;
  const canClaim = focusCard?.status === 'CLAIMABLE' && selectedRewardVillageId.length > 0;

  const claimPanel: DailyQuestClaimPanel | undefined =
    focusCard?.status === 'CLAIMABLE'
      ? {
          claimLabel: isClaiming ? 'Récupération...' : 'Récupérer',
          disabled: isClaiming,
          isClaiming,
          onVillageChange: setSelectedVillageId,
          rewardLabel: 'Gain',
          rewards: rewardPills(focusCard),
          selectedVillageId: selectedRewardVillageId,
          villageLabel: 'Village récompensé',
          villages: villages.map((village) => ({
            id: village.id,
            label: villageOptionLabel(village),
          })),
        }
      : undefined;

  const handlePrimaryAction = () => {
    if (focusCard?.status === 'CLAIMABLE') {
      if (selectedRewardVillageId) {
        onClaim({ cardId: focusCard.id, villageId: selectedRewardVillageId });
      }
      return;
    }
  };

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <RoyalSeal
        ariaLabel={
          claimableCount > 0
            ? `Devoir royal, ${claimableCount} carte${claimableCount > 1 ? 's' : ''} à réclamer`
            : 'Devoir royal'
        }
        badge={claimableCount > 0}
        badgeCount={claimableCount > 0 ? claimableCount : null}
        className={isLoading && !summary ? `${className ?? ''} opacity-60` : className}
        halo={claimableCount > 0}
        onBlur={() => setIsSealPressed(false)}
        onClick={() => setIsOpen(true)}
        onPointerCancel={() => setIsSealPressed(false)}
        onPointerDown={() => setIsSealPressed(true)}
        onPointerLeave={() => setIsSealPressed(false)}
        onPointerUp={() => setIsSealPressed(false)}
        pressed={isOpen || isSealPressed}
        size={58}
        softShadow
        variant="wax"
      />

      {isOpen && summary ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3"
          data-testid="daily-retention-backdrop"
          onMouseDown={handleBackdropMouseDown}
        >
          <DailyQuestModal
            backlog={backlog}
            chapter={chapter}
            claimPanel={claimPanel}
            claimRowLabel="Réclamer"
            closeLabel="Fermer"
            completedLabel="accomplies"
            completedSummary={`${completedCount} / ${quests.length}`}
            eyebrow={undefined}
            expiresInLabel="Reset à"
            expiresInValue="04h00"
            maxHeight="min(680px, calc(100dvh - 18px))"
            onClose={() => setIsOpen(false)}
            onPrimaryAction={handlePrimaryAction}
            oyez={mapOyez(summary)}
            primaryActionDisabled={
              focusCard?.status !== 'CLAIMABLE' || !canClaim || isClaiming
            }
            primaryActionLabel={
              isClaiming ? 'Récupération...' : 'Récupérer'
            }
            primaryActionVariant={focusCard?.status === 'CLAIMABLE' ? 'success' : 'neutral'}
            quests={quests}
            questsTodayLabel="Tâches du jour"
            rewardLabel="Récompense"
            tasksDividerLabel="Tâches du Roi"
            taskDoneLabel="Tâche accomplie"
            title="Devoir royal"
            width="min(360px, calc(100vw - 24px))"
          />
        </div>
      ) : null}
    </>
  );
}
