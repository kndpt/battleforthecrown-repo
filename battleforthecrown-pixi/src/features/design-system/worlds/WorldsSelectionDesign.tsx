import { Bell, Castle, Check, ChevronLeft, Lock, ScrollText, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';
import type { WorldCardViewModel, WorldsTab, WorldThemeTokens } from '@/features/worlds/worldsViewModel';

export interface SeasonVariant {
  disabled?: boolean;
  duration: string;
  id: 'standard' | 'speed' | 'hardcore';
  label: string;
  tempo: string;
}

export interface WorldsSelectionLabels {
  back: string;
  details: string;
  empty: Record<WorldsTab, string>;
  seasonVariants: string;
  subtitle: string;
  tempoHint: string;
  title: string;
}

export interface WorldsSelectionDesignProps {
  activeTab: WorldsTab;
  className?: string;
  counts: Record<WorldsTab, number>;
  errorMessage?: string | null;
  isLoading?: boolean;
  labels: WorldsSelectionLabels;
  noticeMessage?: string | null;
  onBack?: () => void;
  onDetails: (world: WorldCardViewModel) => void;
  onJoin: (world: WorldCardViewModel) => void;
  onNotify: (world: WorldCardViewModel) => void;
  onTabChange: (tab: WorldsTab) => void;
  totalCount: number;
  variants: SeasonVariant[];
  worlds: WorldCardViewModel[];
}

const tabLabels: Record<WorldsTab, string> = {
  locked: 'Verrouillés',
  open: 'Inscription',
  planned: 'Bientôt',
};

const variantTone: Record<SeasonVariant['id'], WorldThemeTokens> = {
  hardcore: { border: '#4d100a', dark: '#7d1e15', glow: 'rgba(192,57,43,.35)', light: '#c0392b' },
  speed: { border: '#9e7b0d', dark: '#c59e3f', glow: 'rgba(246,213,123,.35)', light: '#f6d57b' },
  standard: { border: '#3a6c1f', dark: '#4a8c2a', glow: 'rgba(110,191,73,.35)', light: '#6ebf49' },
};
const KINGDOM_POWER_ICON = '/assets/army-power.png';

function lifecycleToneFor(world: WorldCardViewModel): WorldThemeTokens {
  if (world.lifecycleDay === null) {
    return { border: '#1f5288', dark: '#2e75b6', glow: 'rgba(91,155,213,.4)', light: '#5b9bd5' };
  }
  if (world.inscriptionPhase === 'late') {
    return { border: '#9e7b0d', dark: '#c59e3f', glow: 'rgba(246,213,123,.5)', light: '#f6d57b' };
  }
  if (world.inscriptionPhase === 'closed') {
    return { border: '#5d4a32', dark: '#5d4a32', glow: 'rgba(60,38,25,.4)', light: '#8b6f47' };
  }
  return { border: '#3a6c1f', dark: '#4a8c2a', glow: 'rgba(110,191,73,.45)', light: '#6ebf49' };
}

function SeasonIcon({ id }: { id: SeasonVariant['id'] }) {
  if (id === 'speed') {
    return (
      <svg aria-hidden="true" className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 2 4 14h7l-1 8 10-12h-7z" />
      </svg>
    );
  }
  if (id === 'hardcore') return <Lock aria-hidden="true" className="size-3.5 stroke-[2.4]" />;
  return <ScrollText aria-hidden="true" className="size-3.5 stroke-[2.4]" />;
}

function Crest({ glyph, theme }: { glyph: string; theme: WorldThemeTokens }) {
  return (
    <div className="relative h-[44px] w-[38px] shrink-0 drop-shadow-[0_3px_4px_rgba(0,0,0,.5)]">
      <div
        className="absolute inset-0 border-2 shadow-[inset_0_2px_0_rgba(255,255,255,.25),inset_0_-8px_14px_rgba(0,0,0,.25)] [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]"
        style={{
          background: `linear-gradient(to bottom, ${theme.light}, ${theme.dark})`,
          borderColor: '#f6d57b',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-1 font-game text-[19px] font-black leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
        {glyph}
      </div>
    </div>
  );
}

function LifecycleBar({ world }: { world: WorldCardViewModel }) {
  const phaseTone = lifecycleToneFor(world);
  const total = world.lifecycleTotalDays;
  const mainDays = Math.min(7, total);
  const lateDays = Math.min(3, Math.max(total - mainDays, 0));
  const lockedDays = Math.max(total - mainDays - lateDays, 1);
  const markerPct = world.lifecycleDay === null
    ? 0
    : Math.max(0.5, Math.min(99.5, (world.lifecycleDay / total) * 100));
  const fillWidth = world.lifecycleDay === null ? 0 : markerPct;

  return (
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2 py-[2px] font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]"
          style={{
            background: `linear-gradient(to bottom, ${phaseTone.light}, ${phaseTone.dark})`,
            borderColor: phaseTone.border,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.25), 0 0 8px ${phaseTone.glow}`,
          }}
        >
          <span className="size-[5px] rounded-full bg-white shadow-[0_0_4px_#fff]" />
          {world.statusLabel}
        </span>
        <span className="whitespace-nowrap font-game text-[11px] font-extrabold text-[#3d2f1f] tabular-nums">
          {world.dayLabel}
        </span>
      </div>
      <div className="relative h-3 rounded-[7px] border-2 border-[rgba(60,38,25,.5)] bg-[rgba(60,38,25,.18)] shadow-[inset_0_2px_3px_rgba(0,0,0,.25)]">
        <div className="absolute inset-0 flex overflow-hidden rounded-[5px]">
          <div className="bg-[rgba(110,191,73,.32)]" style={{ flex: mainDays }} />
          <div className="w-px bg-[rgba(60,38,25,.55)]" />
          <div className="bg-[rgba(246,213,123,.42)]" style={{ flex: lateDays }} />
          <div className="w-px bg-[rgba(60,38,25,.55)]" />
          <div className="bg-[rgba(60,38,25,.32)]" style={{ flex: lockedDays }} />
        </div>
        {fillWidth > 0 ? (
          <div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-l-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]"
            style={{ width: `${fillWidth}%` }}
          >
            <div className="flex h-full" style={{ width: `${100 / (fillWidth / 100)}%` }}>
              <div className="bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]" style={{ flex: mainDays }} />
              <div className="bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)]" style={{ flex: lateDays }} />
              <div className="bg-[linear-gradient(to_bottom,#8b6f47,#5d4a32)]" style={{ flex: lockedDays }} />
            </div>
          </div>
        ) : null}
        {world.lifecycleDay !== null ? (
          <div
            className="absolute -top-1 -bottom-1 z-[2] w-[2.5px] -translate-x-1/2 rounded-sm bg-[#f6e4b8] shadow-[0_0_6px_rgba(60,38,25,.45)]"
            style={{ left: `${markerPct}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function CtaButton({
  onJoin,
  onNotify,
  world,
}: {
  onJoin: (world: WorldCardViewModel) => void;
  onNotify: (world: WorldCardViewModel) => void;
  world: WorldCardViewModel;
}) {
  const disabled = world.ctaKind === 'locked';
  const tone = world.ctaKind === 'notify'
    ? 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]'
    : world.ctaKind === 'join'
      ? 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]'
      : 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#b0b8c0,#7c8088)]';
  const Icon = world.ctaKind === 'notify' ? Bell : world.ctaKind === 'joined' ? Check : world.ctaKind === 'locked' ? Lock : ScrollText;

  return (
    <button
      className={cn(
        'inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border-2 px-3 font-game text-[11px] font-extrabold uppercase tracking-[.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_3px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]',
        tone,
        disabled ? 'cursor-not-allowed opacity-[.7]' : 'cursor-pointer active:translate-y-px',
      )}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (world.ctaKind === 'notify') onNotify(world);
        if (world.ctaKind === 'join' || world.ctaKind === 'joined') onJoin(world);
      }}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4 stroke-[2.4]" />
      {world.ctaLabel}
    </button>
  );
}

export function WorldCard({
  detailsLabel,
  onDetails,
  onJoin,
  onNotify,
  world,
}: {
  detailsLabel: string;
  onDetails: (world: WorldCardViewModel) => void;
  onJoin: (world: WorldCardViewModel) => void;
  onNotify: (world: WorldCardViewModel) => void;
  world: WorldCardViewModel;
}) {
  return (
    <article className="shrink-0 overflow-hidden rounded-[14px] border-[2.5px] border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f5e6d3)] shadow-[0_4px_10px_rgba(60,38,25,.18),inset_0_2px_0_rgba(255,255,255,.5),inset_0_-10px_16px_rgba(60,38,25,.06)]">
      <div
        className="relative min-h-[46px] border-b-[1.5px] border-[rgba(60,38,25,.35)] py-[7px] pl-14 pr-2.5"
        style={{
          background: `linear-gradient(to right, ${world.theme.light}, ${world.theme.dark}cc 60%, rgba(245,230,211,0) 100%), linear-gradient(to bottom, #fef9f0, #f5e6d3)`,
        }}
      >
        <div className="absolute left-[9px] top-[5px]">
          <Crest glyph={world.sigilGlyph} theme={world.theme} />
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-game text-[17px] font-black leading-[1.05] tracking-[.02em] text-white [text-shadow:0_2px_3px_rgba(0,0,0,.55)]">
              {world.displayName}
            </h2>
            <p className="mt-px truncate font-game text-[9.5px] italic leading-[1.15] text-[rgba(255,255,255,.78)] [text-shadow:0_1px_1px_rgba(0,0,0,.4)]">
              « {world.tagline} »
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border-[1.5px] border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] px-2 py-0.5 font-game text-[9.5px] font-extrabold uppercase tracking-[.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_1px_2px_rgba(0,0,0,.25)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
            {world.tempoLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[7px] px-2.5 py-2.5">
        <LifecycleBar world={world} />
        <div className="flex items-center justify-between gap-1.5 rounded-[7px] border border-[rgba(60,38,25,.12)] bg-[rgba(60,38,25,.07)] px-2 py-1">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-game text-[11px] font-extrabold text-[#3d2f1f] tabular-nums">
            <Users aria-hidden="true" className="size-[13px] shrink-0 text-[#6d5838]" />
            {world.joinedCountLabel}
          </span>
          <span className="h-3.5 w-px bg-[rgba(60,38,25,.18)]" />
          <span className="inline-flex min-w-0 items-center gap-1.5 font-game text-[10px] font-extrabold uppercase tracking-[.08em] text-[#3d2f1f]">
            <ScrollText aria-hidden="true" className="size-[13px] shrink-0 text-[#6d5838]" />
            {world.tierLabel}
          </span>
        </div>
        {world.personalStats ? (
          <div className="rounded-[7px] border border-[rgba(158,123,13,.28)] bg-[rgba(246,213,123,.2)] px-2 py-1.5">
            <div className="font-game text-[9px] font-extrabold uppercase tracking-[.14em] text-[#6d5838]">
              Votre royaume
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 font-game text-[10.5px] font-extrabold text-[#3d2f1f] tabular-nums">
                <Castle aria-hidden="true" className="size-[14px] shrink-0 text-[#6d5838]" />
                {world.personalStats.villageCountLabel}
              </span>
              <span className="h-3.5 w-px bg-[rgba(60,38,25,.18)]" />
              <span className="inline-flex min-w-0 items-center gap-1.5 font-game text-[10.5px] font-extrabold text-[#3d2f1f] tabular-nums">
                <img alt="" className="size-[14px] shrink-0 object-contain" src={publicAsset(KINGDOM_POWER_ICON)} />
                <span className="text-[#6d5838]">Puissance</span>
                {world.personalStats.kingdomPowerLabel}
              </span>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-[minmax(92px,.42fr)_minmax(0,1fr)] gap-1.5">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#b0b8c0,#7f8c8d)] px-2 font-game text-[10.5px] font-extrabold uppercase tracking-[.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_3px_0_rgba(0,0,0,.18)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)] active:translate-y-px"
            onClick={() => onDetails(world)}
            type="button"
          >
            <ScrollText aria-hidden="true" className="size-3.5 stroke-[2.4]" />
            {detailsLabel}
          </button>
          <CtaButton onJoin={onJoin} onNotify={onNotify} world={world} />
        </div>
      </div>
    </article>
  );
}

export function WorldEntryOverlay({ world }: { world: WorldCardViewModel }) {
  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#635f31_0%,#3c2d19_44%,#160f08_100%)] px-6 text-center animate-[bftc-world-entry-overlay_2000ms_ease-in-out_forwards]"
      role="status"
    >
      <div className="absolute inset-y-0 left-1/2 w-[35vw] max-w-[190px] -translate-x-1/2 bg-[linear-gradient(to_bottom,#7b4e2d,#bd9450_32%,#3a2115_100%)] opacity-[.55]" />
      <div className="relative flex max-w-[300px] flex-col items-center gap-4">
        <div className="relative flex size-[180px] items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[rgba(246,213,123,.28)] bg-[radial-gradient(circle_at_center,rgba(246,213,123,.22),rgba(246,213,123,.08)_44%,transparent_66%)] shadow-[0_0_55px_rgba(246,213,123,.32)] animate-[bftc-world-entry-rings_2000ms_ease-out_forwards]" />
          <div
            className="relative flex size-[108px] items-center justify-center rounded-full border-[3px] border-[#f6d57b] bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,.55),transparent_24%),linear-gradient(to_bottom,#fef9f0,#cdb88a)] shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-14px_20px_rgba(60,38,25,.28),0_0_34px_rgba(246,213,123,.45)] animate-[bftc-world-entry-crest_2000ms_cubic-bezier(.2,.8,.2,1)_forwards]"
            style={{ color: world.theme.dark }}
          >
            <div className="scale-[1.7]">
              <Crest glyph={world.sigilGlyph} theme={world.theme} />
            </div>
          </div>
        </div>
        <div className="font-game text-[12px] font-extrabold uppercase tracking-[.18em] text-[#f6d57b] [text-shadow:1px_1px_2px_rgba(0,0,0,.65)]">
          Entrée dans
        </div>
        <div className="font-game text-3xl font-black leading-none text-[#fef9f0] [text-shadow:0_2px_3px_rgba(0,0,0,.72)]">
          {world.displayName}
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full border border-[rgba(246,213,123,.45)] bg-[rgba(12,10,8,.45)]">
          <div className="h-full w-full origin-left bg-[linear-gradient(to_right,#5b9bd5,#f6d57b,#6ebf49)] animate-[bftc-world-entry-progress_2000ms_ease-out_forwards]" />
        </div>
      </div>
    </div>
  );
}

function WorldsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((item) => (
        <div
          className="h-[142px] animate-pulse rounded-[14px] border-[2.5px] border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f5e6d3)] opacity-[.75]"
          key={item}
        />
      ))}
    </div>
  );
}

export function WorldsSelectionDesign({
  activeTab,
  className,
  counts,
  errorMessage,
  isLoading = false,
  labels,
  noticeMessage,
  onBack,
  onDetails,
  onJoin,
  onNotify,
  onTabChange,
  totalCount,
  variants,
  worlds,
}: WorldsSelectionDesignProps) {
  return (
    <main className={cn('min-h-screen bg-[#d4c094] text-[#3d2f1f]', className)}>
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#e8d5b7_0%,#f5e6d3_45%,#d4c094_100%)] font-game shadow-[0_0_0_1px_rgba(60,38,25,.2)]">
        <header className="border-b-2 border-[rgba(60,38,25,.5)] bg-[linear-gradient(to_bottom,rgba(232,212,168,.6),rgba(212,192,148,.85))] px-3.5 pb-2.5 pt-3 shadow-[0_3px_8px_rgba(60,38,25,.18)]">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.92),rgba(78,56,34,.92))] px-2.5 py-1 font-game text-[11px] font-bold uppercase tracking-[.08em] text-[#f0e0c0] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
              onClick={onBack}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5 stroke-[3]" />
              {labels.back}
            </button>
            <span className="inline-flex items-center rounded-full border-[1.5px] border-[rgba(60,38,25,.25)] bg-[rgba(60,38,25,.12)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.18em] text-[#5d4a32]">
              {totalCount} royaumes
            </span>
          </div>
          <h1 className="font-game text-xl font-black leading-none tracking-[.02em] text-[#3c2619] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
            {labels.title}
          </h1>
          <p className="mt-0.5 font-game text-[11px] italic leading-tight text-[#6d5838]">« {labels.subtitle} »</p>
        </header>

        <section className="border-b border-[rgba(60,38,25,.25)] bg-[linear-gradient(to_bottom,rgba(232,212,168,.55),rgba(212,192,148,.7))] px-3 py-2">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-game text-[8.5px] font-extrabold uppercase tracking-[.22em] text-[#6d5838]">
              {labels.seasonVariants}
            </span>
            <span className="font-game text-[8.5px] italic text-[#6d5838]">{labels.tempoHint}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {variants.map((variant) => {
              const tone = variantTone[variant.id];
              return (
                <button
                  className={cn(
                    'relative flex h-[42px] items-center gap-1.5 rounded-[9px] border-[1.5px] px-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
                    variant.disabled ? 'cursor-not-allowed bg-[rgba(232,212,168,.45)] opacity-[.55]' : 'bg-[rgba(254,249,240,.7)]',
                  )}
                  disabled={variant.disabled}
                  key={variant.id}
                  style={{ borderColor: variant.disabled ? 'rgba(60,38,25,.25)' : `${tone.light}88` }}
                  type="button"
                >
                  <span
                    className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)]"
                    style={{
                      background: variant.disabled
                        ? 'linear-gradient(to bottom, #b8a888, #8c7a5e)'
                        : `linear-gradient(to bottom, ${tone.light}, ${tone.dark})`,
                      borderColor: variant.disabled ? '#6d5838' : tone.border,
                    }}
                  >
                    <SeasonIcon id={variant.id} />
                  </span>
                  <span className="min-w-0 leading-none">
                    <span className="block truncate font-game text-[11px] font-black text-[#3c2619]">{variant.label}</span>
                    <span className="mt-0.5 block truncate font-game text-[8.5px] font-bold tracking-[.04em] text-[#6d5838] tabular-nums">
                      {variant.duration} · {variant.tempo}
                    </span>
                  </span>
                  {variant.disabled ? (
                    <span className="absolute -right-1 -top-1.5 rounded-full border border-[#5d4a32] bg-[linear-gradient(to_bottom,#cdb88a,#8b7355)] px-1.5 py-px font-game text-[7.5px] font-extrabold uppercase tracking-[.1em] text-white shadow-[0_1px_2px_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
                      Bientôt
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <nav className="flex gap-1 border-b-[1.5px] border-[rgba(60,38,25,.45)] bg-[linear-gradient(to_bottom,rgba(212,192,148,.5),rgba(232,212,168,.3))] px-2.5 pt-1">
          {(['open', 'planned', 'locked'] as const).map((tab) => {
            const selected = activeTab === tab;
            const count = counts[tab];
            return (
              <button
                className={cn(
                  'mb-[-1.5px] inline-flex flex-1 items-center justify-center gap-1 rounded-t-lg border-[1.5px] px-1 py-2 font-game text-[10.5px] font-extrabold uppercase tracking-[.08em]',
                  selected
                    ? 'border-[#8b7355] border-b-[#e8d4a8] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] text-[#3c2619] [text-shadow:0_1px_0_rgba(255,255,255,.5)]'
                    : 'border-transparent bg-[rgba(60,38,25,.06)] text-[#6d5838]',
                )}
                key={tab}
                onClick={() => onTabChange(tab)}
                type="button"
              >
                {tabLabels[tab]}
                <span
                  className={cn(
                    'inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[1.5px] px-1.5 text-[9.5px] font-black tabular-nums',
                    selected
                      ? 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] text-[#3a2a00]'
                      : 'border-[rgba(60,38,25,.32)] bg-[rgba(60,38,25,.2)] text-[#6d5838]',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          {errorMessage ? (
            <div role="alert" className="rounded-[12px] border-2 border-[#a93226] bg-[rgba(192,57,43,.12)] px-4 py-3 text-center font-game text-[12px] font-bold text-[#7d1e15]">
              {errorMessage}
            </div>
          ) : (
            <>
              {noticeMessage ? (
                <div role="alert" className="mb-2 rounded-[12px] border-2 border-[#a93226] bg-[rgba(192,57,43,.12)] px-4 py-3 text-center font-game text-[12px] font-bold text-[#7d1e15]">
                  {noticeMessage}
                </div>
              ) : null}
              {isLoading ? (
                <WorldsSkeleton />
              ) : worlds.length === 0 ? (
                <div className="mx-auto mt-5 max-w-60 px-5 py-4 text-center font-game text-xs italic text-[#6d5838]">
                  « {labels.empty[activeTab]} »
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {worlds.map((world) => (
                    <WorldCard
                      detailsLabel={labels.details}
                      key={world.id}
                      onDetails={onDetails}
                      onJoin={onJoin}
                      onNotify={onNotify}
                      world={world}
                    />
                  ))}
                  <div className="sticky -bottom-3 h-[30px] shrink-0 bg-[linear-gradient(to_bottom,transparent,#d4c094)]" />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
