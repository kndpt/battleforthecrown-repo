import type { ReactNode } from 'react';
import { BftcButton, type BftcButtonVariant } from './BftcButton';
import { BaseModal } from './BaseModal';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type DailyQuestState = 'progress' | 'claimable' | 'done' | 'locked';

export interface DailyQuestReward {
  icon: string;
  value: string;
}

export interface DailyQuestTaskAction {
  label: string;
  onAction: () => void;
}

export interface DailyQuestItem {
  action?: DailyQuestTaskAction;
  have?: number;
  icon: string;
  id: string;
  loopLabel: string;
  lockedHint?: string;
  name: string;
  need?: number;
  progressLabel?: string;
  rewards: DailyQuestReward[];
  state: DailyQuestState;
}

export interface DailyQuestChapter {
  body?: string;
  description?: string;
  eyebrow: string;
  expiresIn: string;
  icon: string;
  rewardLabel: string;
  rewards: DailyQuestReward[];
  title: string;
}

export interface DailyQuestBacklog {
  badgeLabel: string;
  cards?: Array<{
    id: string;
    statusLabel: string;
    title: string;
  }>;
  hint: string;
  title: string;
}

export interface DailyQuestOyez {
  effect: string;
  eyebrow: string;
  icon: string;
  title: string;
}

export interface DailyQuestVillageOption {
  id: string;
  label: string;
}

export interface DailyQuestClaimPanel {
  claimLabel: string;
  disabled?: boolean;
  isClaiming?: boolean;
  onVillageChange: (villageId: string) => void;
  rewardLabel: string;
  rewards: DailyQuestReward[];
  selectedVillageId: string;
  villageLabel: string;
  villages: DailyQuestVillageOption[];
}

export interface DailyQuestModalProps {
  backlog?: DailyQuestBacklog;
  chapter?: DailyQuestChapter;
  claimPanel?: DailyQuestClaimPanel;
  claimRowLabel: string;
  className?: string;
  closeLabel: string;
  completedLabel: string;
  completedSummary: string;
  eyebrow?: string;
  expiresInLabel: string;
  expiresInValue: string;
  maxHeight?: number | string;
  onClaim?: (questId: string) => void;
  onClose?: () => void;
  onPrimaryAction?: () => void;
  oyez?: DailyQuestOyez;
  primaryActionDisabled?: boolean;
  primaryActionLabel: string;
  primaryActionVariant?: BftcButtonVariant;
  questsTodayLabel: string;
  quests: DailyQuestItem[];
  rewardLabel: string;
  tasksDividerLabel: string;
  taskDoneLabel: string;
  title: string;
  width?: number | string;
}

const stateRowClass: Record<DailyQuestState, string> = {
  progress:
    'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]',
  claimable:
    'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fef0c6,#e8c878)] shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_3px_0_rgba(0,0,0,.16),0_0_14px_rgba(241,196,15,.4)]',
  done: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#d6ecc4,#a8d28d)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]',
  locked:
    'border-[#8b7355] bg-[linear-gradient(to_bottom,#ede5d4,#c9bda1)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)] opacity-[.85]',
};

function RewardPill({
  icon,
  value,
  dim = false,
}: DailyQuestReward & { dim?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[3px] rounded-full border-[1.5px] border-[rgba(0,0,0,.22)] bg-[rgba(0,0,0,.06)] py-0.5 pl-[3px] pr-[7px] font-game text-[10.5px] font-extrabold tabular-nums text-[#3d2f1f]',
        dim ? 'opacity-50' : '',
      )}
    >
      <img alt="" className="size-3.5" src={publicAsset(icon)} />
      {value}
    </span>
  );
}

function ChapterFeaturedCard({
  chapter,
  rewardLabel,
}: {
  chapter: DailyQuestChapter;
  rewardLabel: string;
}) {
  return (
    <div className="relative grid grid-cols-[62px_1fr] gap-[11px] rounded-[14px] border-[2.5px] border-[#9e7b0d] bg-[linear-gradient(135deg,#fef0c6,#e8c878)] px-3 py-[11px] text-[#3a2a00] shadow-[0_4px_0_rgba(0,0,0,.16),inset_0_1px_0_rgba(255,255,255,.5)]">
      <div className="flex size-[62px] items-center justify-center rounded-[12px] border-[2.5px] border-[#6e4a08] bg-[radial-gradient(circle_at_30%_25%,#fff5b8,#a87b25)] shadow-[inset_0_1.5px_0_rgba(255,255,255,.5)]">
        <img
          alt=""
          className="size-11 drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]"
          src={publicAsset(chapter.icon)}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-game text-[9px] font-extrabold uppercase tracking-[.22em] text-[#704c0a]">
            {chapter.eyebrow}
          </span>
          {chapter.expiresIn ? (
            <span className="font-game text-[9.5px] font-bold tracking-[.06em] text-[#704c0a]">
              {chapter.expiresIn}
            </span>
          ) : null}
        </div>
        <div className="font-game text-[15px] font-black leading-[1.15] tracking-[.01em] text-[#3a2a00]">
          {chapter.title}
        </div>
        {chapter.body ? (
          <div className="font-game text-[11px] leading-[1.35] text-[#5a4400]">
            {chapter.body}
          </div>
        ) : null}
        <div className="mt-[5px] flex flex-col items-start gap-[5px]">
          <span className="font-game text-[9px] font-extrabold uppercase tracking-[.18em] text-[#704c0a]">
            {rewardLabel}
          </span>
          <div className="flex flex-wrap items-center gap-[5px]">
            {chapter.rewards.map((reward, i) => (
              <span
                className="inline-flex items-center gap-[3px] rounded-full border-[1.5px] border-[#704c0a] bg-[rgba(255,255,255,.45)] py-0.5 pl-[3px] pr-2 font-game text-[11px] font-extrabold tabular-nums text-[#3a2a00]"
                key={`${reward.icon}-${reward.value}-${i}`}
              >
                <img alt="" className="size-[15px]" src={publicAsset(reward.icon)} />
                {reward.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestRow({
  claimLabel,
  onClaim,
  quest,
  taskDoneLabel,
}: {
  claimLabel: string;
  onClaim?: (questId: string) => void;
  quest: DailyQuestItem;
  taskDoneLabel: string;
}) {
  const isLocked = quest.state === 'locked';
  const isClaimable = quest.state === 'claimable';
  const isDone = quest.state === 'done';
  const pct =
    quest.need && quest.need > 0
      ? Math.min(100, Math.round(((quest.have ?? 0) / quest.need) * 100))
      : 0;
  const progressText =
    quest.progressLabel ??
    (quest.need !== undefined
      ? `${(quest.have ?? 0).toLocaleString('fr-FR')} / ${quest.need.toLocaleString('fr-FR')}`
      : '');

  const loopBadgeClass = isLocked
    ? 'bg-[linear-gradient(to_bottom,#b0b8c0,#7f8c8d)]'
    : 'bg-[linear-gradient(to_bottom,#8b6f47,#5d4a32)]';

  return (
    <div
      className={cn(
        'relative grid grid-cols-[46px_1fr_auto] items-center gap-2.5 rounded-xl border-2 px-[11px] py-[9px]',
        stateRowClass[quest.state],
      )}
    >
      <span
        className={cn(
          'absolute -top-[7px] left-[10px] rounded-full border-[1.5px] border-[#3c2619] px-[6px] py-[1.5px] font-game text-[8px] font-extrabold uppercase tracking-[.18em] text-[#f0e0c0] shadow-[inset_0_1px_0_rgba(255,255,255,.25)] [text-shadow:0_1px_0_rgba(0,0,0,.45)]',
          loopBadgeClass,
        )}
      >
        {quest.loopLabel}
      </span>

      <div
        className={cn(
          'flex size-[46px] items-center justify-center rounded-[10px] border-2 border-[rgba(0,0,0,.22)] bg-[linear-gradient(135deg,rgba(255,255,255,.4),rgba(0,0,0,.18))] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]',
          isLocked ? 'opacity-[.55]' : '',
        )}
      >
        <img
          alt=""
          className="size-[34px] drop-shadow-[0_1px_2px_rgba(0,0,0,.4)]"
          src={publicAsset(quest.icon)}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <div
          className={cn(
            'font-game text-[13px] font-extrabold leading-[1.15]',
            isLocked ? 'text-[#7d6a55]' : 'text-[#3d2f1f]',
          )}
        >
          {quest.name}
        </div>
        {isLocked ? (
          <div className="font-game text-[11px] italic text-[#7d6a55]">
            {quest.lockedHint}
          </div>
        ) : isClaimable || isDone ? (
          <div className="font-game text-[11px] font-extrabold tracking-[.06em] text-[#2d6b16]">
            {taskDoneLabel}
          </div>
        ) : (
          <>
            <div className="relative h-2 overflow-hidden rounded border border-[rgba(0,0,0,.25)] bg-[rgba(0,0,0,.22)]">
              <div
                className="h-full bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="font-game text-[10.5px] font-bold tabular-nums text-[#3d2f1f]">
              {progressText}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1">
          {quest.rewards.map((reward, i) => (
            <RewardPill
              dim={isLocked}
              icon={reward.icon}
              key={`${reward.icon}-${reward.value}-${i}`}
              value={reward.value}
            />
          ))}
        </div>
        {isClaimable ? (
          <BftcButton
            className="px-2.5 py-1 text-[10.5px]"
            onClick={onClaim ? () => onClaim(quest.id) : undefined}
            size="xs"
            variant="success"
          >
            {claimLabel}
          </BftcButton>
        ) : quest.action && !isDone && !isLocked ? (
          <BftcButton
            className="px-2.5 py-1 text-[10.5px]"
            onClick={quest.action.onAction}
            size="xs"
            variant="info"
          >
            {quest.action.label}
          </BftcButton>
        ) : null}
      </div>
    </div>
  );
}

function SubHeader({
  completedLabel,
  completedSummary,
  expiresInLabel,
  expiresInValue,
  questsTodayLabel,
}: {
  completedLabel: string;
  completedSummary: string;
  expiresInLabel: string;
  expiresInValue: string;
  questsTodayLabel: string;
}) {
  return (
    <div className="mx-3.5 mt-2 flex items-center gap-2.5 rounded-[10px] border border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(60,38,25,.08),rgba(60,38,25,.14))] px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-game text-[9px] font-extrabold uppercase tracking-[.28em] text-[#6d5838]">
          {questsTodayLabel}
        </div>
        <div className="mt-px flex items-baseline gap-[5px]">
          <span className="font-game text-lg font-black tabular-nums text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
            {completedSummary}
          </span>
          <span className="font-game text-[11px] text-[#6d5838]">{completedLabel}</span>
        </div>
      </div>
      <div className="text-right font-game text-[10px] text-[#6d5838]">
        <div className="text-[9px] font-extrabold uppercase tracking-[.18em]">{expiresInLabel}</div>
        <div className="mt-px inline-flex items-center gap-1 font-game text-[12.5px] font-extrabold tabular-nums text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
          <img alt="" className="size-3" src={publicAsset('/assets/clock.png')} />
          {expiresInValue}
        </div>
      </div>
    </div>
  );
}

function OyezBanner({ oyez }: { oyez: DailyQuestOyez }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border-2 border-[#1f5288] bg-[linear-gradient(135deg,#3a6fa3,#234a76)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_2px_0_rgba(0,0,0,.18)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#0e2d4d] bg-[radial-gradient(circle_at_30%_25%,#7ec1f0,#1f5288)] shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
        <img alt="" className="size-6 drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]" src={publicAsset(oyez.icon)} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-game text-[9px] font-extrabold uppercase tracking-[.28em] text-[#b8d4ee]">
          {oyez.eyebrow}
        </span>
        <span className="font-game text-[12.5px] font-extrabold leading-tight tracking-[.02em] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]">
          {oyez.title}
        </span>
        <span className="font-game text-[10.5px] italic leading-tight text-[#dde9f4]">
          {oyez.effect}
        </span>
      </div>
    </div>
  );
}

function BacklogStrip({ backlog }: { backlog: DailyQuestBacklog }) {
  return (
    <div className="my-0.5 rounded-[10px] border-[1.5px] border-dashed border-[rgba(60,38,25,.35)] bg-[rgba(255,255,255,.25)] px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-[22px] items-center justify-center rounded-[6px] border-[1.5px] border-[#3c2619] bg-[linear-gradient(to_bottom,#8b6f47,#5d4a32)] font-game text-[11px] font-black text-[#f0e0c0]">
          {backlog.badgeLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-game text-[10.5px] font-extrabold tracking-[.04em] text-[#3d2f1f]">
            {backlog.title}
          </div>
          <div className="font-game text-[10px] italic text-[#6d5838]">{backlog.hint}</div>
        </div>
      </div>
      {backlog.cards && backlog.cards.length > 0 ? (
        <div className="mt-2 grid gap-1.5">
          {backlog.cards.map((card) => (
            <div
              className="flex items-center justify-between gap-2 rounded-[7px] border border-[rgba(60,38,25,.18)] bg-[rgba(255,255,255,.24)] px-2 py-1"
              key={card.id}
            >
              <span className="truncate font-game text-[10px] font-bold text-[#3d2f1f]">
                {card.title}
              </span>
              <span className="shrink-0 font-game text-[9px] font-extrabold uppercase tracking-[.12em] text-[#6d5838]">
                {card.statusLabel}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ClaimPanel({ panel }: { panel: DailyQuestClaimPanel }) {
  return (
    <div className="rounded-[10px] border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,rgba(254,240,198,.78),rgba(232,200,120,.54))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-game text-[9px] font-extrabold uppercase tracking-[.18em] text-[#704c0a]">
          {panel.rewardLabel}
        </span>
        {panel.rewards.map((reward, i) => (
          <RewardPill key={`${reward.icon}-${reward.value}-${i}`} {...reward} />
        ))}
      </div>
      <label className="mt-2 flex flex-col gap-1 font-game text-[10px] font-extrabold uppercase tracking-[.14em] text-[#704c0a]">
        {panel.villageLabel}
        <select
          className="min-h-9 rounded-lg border-2 border-[#5d4a32] bg-[#fef9f0] px-2 font-game text-[12px] font-bold normal-case tracking-normal text-[#3d2f1f]"
          disabled={panel.disabled || panel.villages.length === 0}
          onChange={(event) => panel.onVillageChange(event.target.value)}
          value={panel.selectedVillageId}
        >
          {panel.villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="mt-0.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
      <span className="font-game text-[9px] font-extrabold uppercase tracking-[.28em] text-[#6d5838]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
    </div>
  );
}

export function DailyQuestModal({
  backlog,
  chapter,
  claimPanel,
  claimRowLabel,
  className,
  closeLabel,
  completedLabel,
  completedSummary,
  eyebrow,
  expiresInLabel,
  expiresInValue,
  maxHeight = 'min(680px, calc(100dvh - 24px))',
  onClaim,
  onClose,
  onPrimaryAction,
  oyez,
  primaryActionDisabled,
  primaryActionLabel,
  primaryActionVariant = 'success',
  questsTodayLabel,
  quests,
  rewardLabel,
  tasksDividerLabel,
  taskDoneLabel,
  title,
  width = 336,
}: DailyQuestModalProps) {
  return (
    <BaseModal
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      className={className}
      closeLabel={closeLabel}
      footer={
        <div className="flex gap-2">
          <BftcButton
            className="flex-1 justify-center py-2 text-sm"
            onClick={onClose}
            variant="info"
          >
            {closeLabel}
          </BftcButton>
          <BftcButton
            className="flex-1 justify-center py-2 text-sm"
            disabled={primaryActionDisabled}
            onClick={onPrimaryAction}
            variant={primaryActionVariant}
          >
            {primaryActionLabel}
          </BftcButton>
        </div>
      }
      maxHeight={maxHeight}
      onClose={onClose}
      tone="gold"
      title={
        <div className="flex flex-col">
          {eyebrow ? (
            <span className="font-game text-[9px] font-extrabold uppercase tracking-[.22em] text-[#6d5838]">
              {eyebrow}
            </span>
          ) : null}
          <span className="font-game text-base font-extrabold tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
            {title}
          </span>
        </div>
      }
      width={width}
    >
      <SubHeader
        completedLabel={completedLabel}
        completedSummary={completedSummary}
        expiresInLabel={expiresInLabel}
        expiresInValue={expiresInValue}
        questsTodayLabel={questsTodayLabel}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3.5 pb-2 pt-3">
        {oyez ? <OyezBanner oyez={oyez} /> : null}
        {chapter ? <ChapterFeaturedCard chapter={chapter} rewardLabel={rewardLabel} /> : null}

        <Divider label={tasksDividerLabel} />

        <div className="flex flex-col gap-3 pt-1">
          {quests.map((quest) => (
            <QuestRow
              claimLabel={claimRowLabel}
              key={quest.id}
              onClaim={onClaim}
              quest={quest}
              taskDoneLabel={taskDoneLabel}
            />
          ))}
        </div>

        {claimPanel ? <ClaimPanel panel={claimPanel} /> : null}

        {backlog ? <BacklogStrip backlog={backlog} /> : null}
      </div>
    </BaseModal>
  );
}

export function DailyQuestPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[720px] w-[360px] overflow-hidden rounded-[36px] border-[8px] border-[#0c0c1a] bg-[#1a1a2e] shadow-[0_30px_60px_rgba(0,0,0,.6),inset_0_0_0_2px_#2a2a45]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#7c9756_0%,#a8b977_28%,#cdbf8e_60%,#b89968_100%)]">
        <div className="absolute inset-x-0 top-0 h-[62px] border-b-2 border-[#8b7355] bg-[linear-gradient(to_bottom,rgba(60,38,25,.94),rgba(78,56,34,.94))]" />
        <img
          alt=""
          className="absolute left-[60px] top-[200px] w-[140px] opacity-[.72]"
          src={publicAsset('/assets/castle.png')}
        />
        <img
          alt=""
          className="absolute left-[200px] top-[380px] w-[110px] opacity-[.65]"
          src={publicAsset('/assets/barracks.png')}
        />
        <img
          alt=""
          className="absolute left-[30px] top-[440px] w-[90px] opacity-[.65]"
          src={publicAsset('/assets/watchtower.png')}
        />
        <img
          alt=""
          className="absolute left-[130px] top-[520px] w-[130px] opacity-[.65]"
          src={publicAsset('/assets/quarter.png')}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 border-t-2 border-[#8b7355] bg-[linear-gradient(to_top,rgba(60,38,25,.95),rgba(78,56,34,.9))]" />
        <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] [backdrop-filter:blur(2px)]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-2.5">{children}</div>
    </div>
  );
}
