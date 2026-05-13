import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { publicAsset } from "@/lib/publicAsset";
import { BaseModal } from "./BaseModal";
import { ProgressBar, type ProgressBarTone } from "./ProgressBar";

export type TroopDetailResource = "wood" | "stone" | "iron" | "crowns";
export type TroopDetailRoleTone =
  | "danger"
  | "info"
  | "success"
  | "warning"
  | "neutral";

export interface TroopDetailStats {
  attack: number;
  carryCapacity: number;
  defenseArcher: number;
  defenseCavalry: number;
  defenseInfantry: number;
  speed: number;
}

export interface TroopDetailCost {
  crowns: number;
  iron: number;
  stone: number;
  wood: number;
}

export interface TroopDetailPassive {
  bonus: string;
  description: string;
  icon: ReactNode;
  name: string;
  watermarkIcon?: ReactNode;
}

export interface TroopDetailLabels {
  attack: string;
  carryCapacity: string;
  characteristics: string;
  cost: string;
  costMultiplier: string;
  defenseArcher: string;
  defenseCavalry: string;
  defenseGroup: string;
  defenseInfantry: string;
  population: string;
  speed: string;
  tiers: {
    correct: string;
    excellent: string;
    faible: string;
    mediocre: string;
    solide: string;
  };
  training: string;
}

export interface TroopDetailModalProps {
  archetype: string;
  className?: string;
  closeLabel: string;
  cost: TroopDetailCost;
  fieldMax: TroopDetailStats;
  labels: TroopDetailLabels;
  maxHeight?: number | string;
  name: string;
  onClose?: () => void;
  passive?: TroopDetailPassive | null;
  populationCost: number;
  portraitFallback?: ReactNode;
  portraitSrc?: string | null;
  roleLabel: string;
  roleTone?: TroopDetailRoleTone;
  stats: TroopDetailStats;
  stock?: TroopDetailCost | null;
  tagline: string;
  tierBadge?: string;
  trainingTime: string;
  width?: number | string;
}

const toneGrad = {
  green: "#2d6b16",
  gold: "#8a5e07",
  red: "#7d2218",
} as const;

const roleClass: Record<TroopDetailRoleTone, string> = {
  danger:
    "border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]",
  info: "border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]",
  neutral:
    "border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]",
  success:
    "border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]",
  warning:
    "border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] text-[#3a2a00]",
};

const resourceIcon: Record<TroopDetailResource, string> = {
  crowns: "/assets/casual-icons/crown.png",
  iron: "/assets/resources/iron.png",
  stone: "/assets/resources/stone.png",
  wood: "/assets/resources/wood.png",
};

function tierFor(
  pct: number,
  labels: TroopDetailLabels["tiers"],
): { label: string; tone: ProgressBarTone } {
  if (pct >= 90) return { label: labels.excellent, tone: "green" };
  if (pct >= 65) return { label: labels.solide, tone: "green" };
  if (pct >= 40) return { label: labels.correct, tone: "gold" };
  if (pct >= 20) return { label: labels.faible, tone: "red" };
  return { label: labels.mediocre, tone: "red" };
}

function formatCount(value: number): string {
  return value.toLocaleString("fr-FR");
}

function AssetIcon({ className, src }: { className?: string; src: string }) {
  return (
    <img
      alt=""
      className={cn(
        "size-[19px] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.22)]",
        className,
      )}
      src={publicAsset(src)}
    />
  );
}

function StatBar({
  icon,
  indent = false,
  label,
  max,
  tierLabels,
  value,
}: {
  icon: ReactNode;
  indent?: boolean;
  label: string;
  max: number;
  tierLabels: TroopDetailLabels["tiers"];
  value: number;
}) {
  const target = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const tier = tierFor(target, tierLabels);

  return (
    <div
      className={cn("relative flex flex-col gap-[5px]", indent ? "pl-2" : "")}
    >
      {indent ? (
        <span className="absolute -left-0.5 top-[9px] h-px w-2 bg-[rgba(60,38,25,.3)]" />
      ) : null}
      <div className="flex items-center gap-[7px] font-game">
        <span className="inline-flex size-[20px] shrink-0 items-center justify-center text-[14px] leading-none text-[#3d2f1f]">
          {icon}
        </span>
        <span
          className={cn(
            "flex-1 font-bold tracking-[.015em]",
            indent
              ? "text-[10.5px] text-[#6d5838]"
              : "text-[11.5px] text-[#3d2f1f]",
          )}
        >
          {label}
        </span>
        <span
          className="text-[8.5px] font-extrabold uppercase tracking-[.16em]"
          style={{ color: toneGrad[tier.tone] }}
        >
          {tier.label}
        </span>
        <span className="min-w-[26px] text-right text-[13px] font-black tabular-nums text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.4)]">
          {formatCount(value)}
        </span>
      </div>
      <ProgressBar
        animated={false}
        aria-label={label}
        className="[&>div:first-child]:hidden [&>div:last-child]:h-2.5 [&>div:last-child]:rounded-full [&>div:last-child]:border [&>div:last-child]:border-[rgba(60,38,25,.32)] [&>div:last-child]:bg-[rgba(60,38,25,.16)]"
        label={label}
        suffix={formatCount(value)}
        tone={tier.tone}
        value={target}
      />
    </div>
  );
}

function DefenseGroup({
  labels,
  max,
  stats,
}: {
  labels: TroopDetailLabels;
  max: TroopDetailStats;
  stats: TroopDetailStats;
}) {
  return (
    <div className="relative ml-[9px] flex flex-col gap-[7px] border-l-2 border-[rgba(60,38,25,.22)] pl-2">
      <div className="absolute -left-2.5 -top-0.5 inline-flex items-center gap-1.5 py-px pl-0 pr-1.5 font-game text-[11px] font-extrabold uppercase tracking-[.16em] text-[#3d2f1f]">
        <span className="inline-flex size-[20px] items-center justify-center">
          <AssetIcon src="/assets/defense.png" />
        </span>
        {labels.defenseGroup}
      </div>
      <div className="h-3.5" />
      <StatBar
        icon="🛡"
        indent
        label={labels.defenseInfantry}
        max={max.defenseInfantry}
        tierLabels={labels.tiers}
        value={stats.defenseInfantry}
      />
      <StatBar
        icon="🐎"
        indent
        label={labels.defenseCavalry}
        max={max.defenseCavalry}
        tierLabels={labels.tiers}
        value={stats.defenseCavalry}
      />
      <StatBar
        icon="🏹"
        indent
        label={labels.defenseArcher}
        max={max.defenseArcher}
        tierLabels={labels.tiers}
        value={stats.defenseArcher}
      />
    </div>
  );
}

function TroopHero({
  archetype,
  name,
  portraitFallback,
  portraitSrc,
  roleLabel,
  roleTone = "danger",
  tagline,
  tierBadge,
}: Pick<
  TroopDetailModalProps,
  | "archetype"
  | "name"
  | "portraitFallback"
  | "portraitSrc"
  | "roleLabel"
  | "roleTone"
  | "tagline"
  | "tierBadge"
>) {
  return (
    <div className="flex items-stretch gap-3 px-3.5 pb-2.5 pt-3">
      <div className="relative h-[86px] w-[78px] shrink-0 overflow-hidden rounded-[14px] border-[2.5px] border-[#3c2619] bg-[linear-gradient(160deg,#5f3d2b_0%,#2e1c12_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_4px_0_rgba(0,0,0,.18)]">
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(241,196,15,.45)_0%,rgba(241,196,15,0)_70%)]" />
        {portraitSrc ? (
          <img
            alt={name}
            className="absolute left-1/2 top-1/2 w-[92%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,.45)]"
            src={publicAsset(portraitSrc)}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-[0_4px_6px_rgba(0,0,0,.45)]">
            {portraitFallback}
          </span>
        )}
        {tierBadge ? (
          <span className="absolute bottom-1 left-1 rounded border border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] px-[5px] py-0.5 font-game text-[7.5px] font-extrabold tracking-[.18em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]">
            {tierBadge}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="font-game text-2xl font-black leading-none tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
          {name}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full border-[1.5px] px-[7px] py-[2.5px] font-game text-[9.5px] font-extrabold uppercase tracking-[.14em] shadow-[inset_0_1px_0_rgba(255,255,255,.35)]",
              roleClass[roleTone],
            )}
          >
            {roleLabel}
          </span>
          <span className="font-game text-[10.5px] font-bold text-[#6d5838]">
            {archetype}
          </span>
        </div>
        <div className="mt-0.5 border-l-2 border-[rgba(60,38,25,.25)] pl-2 font-game text-[10.5px] italic text-[#6d5838]">
          {tagline}
        </div>
      </div>
    </div>
  );
}

function SubStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[rgba(60,38,25,.22)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.5),rgba(244,228,193,.5))] px-[9px] py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="flex min-w-0 flex-col gap-px">
        <span className="font-game text-[8.5px] font-extrabold uppercase tracking-[.16em] text-[#6d5838]">
          {label}
        </span>
        <span className="font-game text-xs font-extrabold leading-none text-[#3d2f1f] tabular-nums">
          {value}
        </span>
      </span>
    </div>
  );
}

function PassiveCard({ passive }: { passive: TroopDetailPassive }) {
  return (
    <div className="relative mx-3.5 flex items-center gap-[9px] overflow-hidden rounded-xl border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fff7e0_0%,#f3df9e_100%)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_2px_0_rgba(0,0,0,.12)]">
      <span className="pointer-events-none absolute -right-2.5 -top-2 font-game text-[64px] font-black leading-none text-[rgba(154,121,28,.18)]">
        {passive.watermarkIcon ?? passive.icon}
      </span>
      <div className="relative flex size-[30px] shrink-0 items-center justify-center rounded-lg border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] font-game text-base font-black text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
        {passive.icon}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-game text-[12.5px] font-extrabold tracking-[.02em] text-[#3a2a00]">
            {passive.name}
          </span>
          <span className="font-game text-[11px] font-black text-[#7d4e08] tabular-nums">
            {passive.bonus}
          </span>
        </div>
        <div className="font-game text-[10.5px] leading-[1.3] text-[#6b4d10]">
          {passive.description}
        </div>
      </div>
    </div>
  );
}

function CostChip({
  ok,
  resource,
  value,
}: {
  ok: boolean;
  resource: TroopDetailResource;
  value: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full border-[1.5px] py-0 pl-1 pr-[7px] font-game text-[10.5px] font-bold tabular-nums [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]",
        ok
          ? "border-[rgba(0,0,0,.3)] bg-[rgba(0,0,0,.22)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]"
          : "border-[#a93226] bg-[linear-gradient(to_bottom,rgba(192,57,43,.45),rgba(192,57,43,.7))] text-[#ffe2dc] shadow-[inset_0_0_8px_rgba(192,57,43,.4)]",
      )}
    >
      <img
        alt=""
        className="size-3.5 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]"
        src={publicAsset(resourceIcon[resource])}
      />
      {formatCount(value)}
    </span>
  );
}

function CostStrip({
  cost,
  labels,
  stock,
}: {
  cost: TroopDetailCost;
  labels: TroopDetailLabels;
  stock?: TroopDetailCost | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.96),rgba(78,56,34,.96))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_2px_0_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase tracking-[.18em] text-[#f0e0c0]">
          {labels.cost}
        </span>
        <span className="font-game text-[9px] font-bold tracking-[.14em] text-[#cdb88a]">
          {labels.costMultiplier}
        </span>
      </div>
      <div className="flex flex-wrap gap-[5px]">
        {(["wood", "stone", "iron", "crowns"] as const).map((resource) => (
          <CostChip
            key={resource}
            ok={!stock || stock[resource] >= cost[resource]}
            resource={resource}
            value={cost[resource]}
          />
        ))}
      </div>
    </div>
  );
}

function PixelButton({
  children,
  disabled,
  onClick,
  variant,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant: "neutral" | "success";
}) {
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-2 px-[18px] py-[9px] font-game text-sm font-bold tracking-[.04em] shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] enabled:cursor-pointer enabled:hover:brightness-110 enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "success"
          ? "border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]"
          : "border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function TroopDetailModal({
  archetype,
  className,
  closeLabel,
  cost,
  fieldMax,
  labels,
  maxHeight = "min(720px, calc(100dvh - 24px))",
  name,
  onClose,
  passive,
  populationCost,
  portraitFallback,
  portraitSrc,
  roleLabel,
  roleTone = "danger",
  stats,
  stock,
  tagline,
  tierBadge,
  trainingTime,
  width = 380,
}: TroopDetailModalProps) {
  const footer = (
    <div className="flex flex-col gap-[9px]">
      <CostStrip cost={cost} labels={labels} stock={stock} />
      <div className="flex">
        <PixelButton onClick={onClose} variant="neutral">
          {closeLabel}
        </PixelButton>
      </div>
    </div>
  );

  return (
    <BaseModal
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      className={className}
      closeLabel={closeLabel}
      footer={footer}
      footerClassName="flex flex-col gap-[9px]"
      maxHeight={maxHeight}
      tone="red"
      width={width}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <TroopHero
          archetype={archetype}
          name={name}
          portraitFallback={portraitFallback}
          portraitSrc={portraitSrc}
          roleLabel={roleLabel}
          roleTone={roleTone}
          tagline={tagline}
          tierBadge={tierBadge}
        />

        <div className="mx-3.5 mb-2 mt-0.5 flex items-center gap-2">
          <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
          <span className="font-game text-[9px] font-extrabold uppercase tracking-[.28em] text-[#6d5838]">
            {labels.characteristics}
          </span>
          <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
        </div>

        <div className="mx-3.5 flex flex-col gap-[11px]">
          <StatBar
            icon={<AssetIcon src="/assets/attack.png" />}
            label={labels.attack}
            max={fieldMax.attack}
            tierLabels={labels.tiers}
            value={stats.attack}
          />
          <DefenseGroup labels={labels} max={fieldMax} stats={stats} />
          <StatBar
            icon={<AssetIcon src="/assets/speed.png" />}
            label={labels.speed}
            max={fieldMax.speed}
            tierLabels={labels.tiers}
            value={stats.speed}
          />
          <StatBar
            icon="📦"
            label={labels.carryCapacity}
            max={fieldMax.carryCapacity}
            tierLabels={labels.tiers}
            value={stats.carryCapacity}
          />
        </div>

        <div className="mx-3.5 mt-2.5 grid grid-cols-2 gap-2">
          <SubStat
            icon={<AssetIcon className="size-4" src="/assets/clock.png" />}
            label={labels.training}
            value={trainingTime}
          />
          <SubStat
            icon={
              <AssetIcon
                className="size-4"
                src="/assets/resources/population.png"
              />
            }
            label={labels.population}
            value={`${formatCount(populationCost)}`}
          />
        </div>

        {passive ? (
          <>
            <div className="h-2.5" />
            <PassiveCard passive={passive} />
          </>
        ) : null}
        <div className="h-3 shrink-0" />
      </div>
    </BaseModal>
  );
}

export function TroopDetailPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[720px] w-[360px] overflow-hidden rounded-[36px] border-[8px] border-[#0c0c1a] bg-[#1a1a2e] shadow-[0_30px_60px_rgba(0,0,0,.6),inset_0_0_0_2px_#2a2a45]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#7c9756_0%,#a8b977_28%,#cdbf8e_60%,#b89968_100%)]">
        <div className="absolute inset-x-0 top-0 h-[62px] border-b-2 border-[#8b7355] bg-[linear-gradient(to_bottom,rgba(60,38,25,.94),rgba(78,56,34,.94))]" />
        <img
          alt=""
          className="absolute left-[70px] top-[200px] w-[140px] opacity-75"
          src={publicAsset("/assets/barracks.png")}
        />
        <img
          alt=""
          className="absolute left-[200px] top-[380px] w-[110px] opacity-70"
          src={publicAsset("/assets/castle.png")}
        />
        <img
          alt=""
          className="absolute left-[30px] top-[440px] w-[90px] opacity-70"
          src={publicAsset("/assets/watchtower.png")}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 border-t-2 border-[#8b7355] bg-[linear-gradient(to_top,rgba(60,38,25,.95),rgba(78,56,34,.9))]" />
        <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] [backdrop-filter:blur(2px)]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-2.5">
        {children}
      </div>
    </div>
  );
}
