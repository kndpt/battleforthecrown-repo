import { Bell, Castle, Check, ChevronLeft, Lock, Map, ScrollText, Shield, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';
import type { WorldCtaKind, WorldDetailMetricViewModel, WorldDetailViewModel, WorldThemeTokens } from '@/features/worlds/worldsViewModel';

export interface WorldDetailLabels {
  back: string;
  guardrailsTitle: string;
  joinedStatsTitle: string;
  lifecycleTitle: string;
  mapTitle: string;
  notFound: string;
  tempoTitle: string;
}

export interface WorldDetailDesignProps {
  className?: string;
  errorMessage?: string | null;
  isLoading?: boolean;
  labels: WorldDetailLabels;
  onBack: () => void;
  onPrimaryAction: (world: WorldDetailViewModel) => void;
  world: WorldDetailViewModel | null;
}

const KINGDOM_POWER_ICON = '/assets/army-power.png';

function DetailCrest({ glyph, theme }: { glyph: string; theme: WorldThemeTokens }) {
  return (
    <div className="relative h-[54px] w-[48px] shrink-0 drop-shadow-[0_4px_6px_rgba(0,0,0,.55)]">
      <div
        className="absolute inset-0 border-[2.5px] shadow-[inset_0_2px_0_rgba(255,255,255,.28),inset_0_-10px_18px_rgba(0,0,0,.28)] [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]"
        style={{
          background: `linear-gradient(to bottom, ${theme.light}, ${theme.dark})`,
          borderColor: '#f6d57b',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-1 font-game text-[24px] font-black leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
        {glyph}
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: WorldDetailMetricViewModel }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-[rgba(60,38,25,.18)] px-1 py-[5px] last:border-b-0">
      <span className="font-game text-[10px] font-extrabold uppercase tracking-[.14em] text-[#6d5838]">
        {metric.label}
      </span>
      <span className="text-right font-game text-[12px] font-extrabold text-[#3c2619] tabular-nums">
        {metric.value}
      </span>
    </div>
  );
}

function DetailCard({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[12px] border-[2.5px] border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f5e6d3)] p-3 shadow-[0_4px_10px_rgba(60,38,25,.18),inset_0_2px_0_rgba(255,255,255,.5),inset_0_-10px_16px_rgba(60,38,25,.06)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-[7px] border-[1.5px] border-[#5d4a32] bg-[linear-gradient(to_bottom,#cdb88a,#8b7355)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
          {icon}
        </span>
        <h2 className="font-game text-[12px] font-black uppercase tracking-[.16em] text-[#3c2619]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function PrimaryIcon({ ctaKind }: { ctaKind: WorldCtaKind }) {
  if (ctaKind === 'notify') return <Bell aria-hidden="true" className="size-4 stroke-[2.4]" />;
  if (ctaKind === 'joined') return <Check aria-hidden="true" className="size-4 stroke-[2.4]" />;
  if (ctaKind === 'locked') return <Lock aria-hidden="true" className="size-4 stroke-[2.4]" />;
  return <ScrollText aria-hidden="true" className="size-4 stroke-[2.4]" />;
}

export function WorldDetailDesign({
  className,
  errorMessage,
  isLoading = false,
  labels,
  onBack,
  onPrimaryAction,
  world,
}: WorldDetailDesignProps) {
  if (isLoading) {
    return (
      <main className={cn('min-h-screen bg-[#d4c094] text-[#3d2f1f]', className)}>
        <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col gap-3 overflow-hidden bg-[radial-gradient(ellipse_at_top,#e8d5b7_0%,#f5e6d3_45%,#d4c094_100%)] p-3 font-game">
          <div className="h-32 animate-pulse rounded-[14px] bg-[rgba(60,38,25,.18)]" />
          <div className="h-40 animate-pulse rounded-[12px] bg-[rgba(60,38,25,.12)]" />
          <div className="h-40 animate-pulse rounded-[12px] bg-[rgba(60,38,25,.12)]" />
        </div>
      </main>
    );
  }

  if (!world) {
    return (
      <main className={cn('min-h-screen bg-[#d4c094] text-[#3d2f1f]', className)}>
        <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-[radial-gradient(ellipse_at_top,#e8d5b7_0%,#f5e6d3_45%,#d4c094_100%)] p-3 font-game">
          <button
            className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-lg border-[1.5px] border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.92),rgba(78,56,34,.92))] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.08em] text-[#f0e0c0] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
            onClick={onBack}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-3.5 stroke-[3]" />
            {labels.back}
          </button>
          <div role="alert" className="rounded-[12px] border-2 border-[#a93226] bg-[rgba(192,57,43,.12)] px-4 py-3 text-center text-[12px] font-bold text-[#7d1e15]">
            {errorMessage ?? labels.notFound}
          </div>
        </div>
      </main>
    );
  }

  const primaryDisabled = world.ctaKind === 'locked';
  const primaryTone = world.ctaKind === 'notify'
    ? 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]'
    : world.ctaKind === 'locked'
      ? 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#b0b8c0,#7c8088)]'
      : 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]';

  return (
    <main className={cn('min-h-screen bg-[#d4c094] text-[#3d2f1f]', className)}>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#e8d5b7_0%,#f5e6d3_45%,#d4c094_100%)] font-game shadow-[0_0_0_1px_rgba(60,38,25,.2)]">
        <header
          className="relative shrink-0 border-b-[3px] border-[#3c2619] px-3.5 pb-3 pt-2 shadow-[0_4px_12px_rgba(60,38,25,.35),inset_0_-10px_22px_rgba(0,0,0,.25)]"
          style={{
            background: `linear-gradient(135deg, ${world.theme.light} 0%, ${world.theme.dark} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,.7)_1px,transparent_1.5px)] bg-[length:26px_26px] opacity-[.15]" />
          <div className="relative mb-2 flex items-center justify-between gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[rgba(255,255,255,.28)] bg-[rgba(0,0,0,.32)] px-2.5 py-1 font-game text-[11px] font-bold uppercase tracking-[.08em] text-white [text-shadow:0_1px_1px_rgba(0,0,0,.5)]"
              onClick={onBack}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5 stroke-[3]" />
              {labels.back}
            </button>
            <span className="inline-flex shrink-0 rounded-full border-[1.5px] border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] px-2 py-0.5 font-game text-[9.5px] font-extrabold uppercase tracking-[.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_1px_2px_rgba(0,0,0,.25)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
              {world.tempoLabel}
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            <DetailCrest glyph={world.sigilGlyph} theme={world.theme} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-game text-[23px] font-black leading-none tracking-[.02em] text-white [text-shadow:0_2px_4px_rgba(0,0,0,.55)]">
                {world.displayName}
              </h1>
              <div className="mt-1 flex items-center gap-2 font-game text-[10px] font-extrabold uppercase tracking-[.1em] text-[rgba(255,255,255,.9)] [text-shadow:0_1px_1px_rgba(0,0,0,.5)]">
                <span>{world.id}</span>
                <span className="opacity-[.6]">·</span>
                <span>{world.tierLabel}</span>
              </div>
              <p className="mt-1 max-h-[26px] overflow-hidden font-game text-[10.5px] italic leading-[1.2] text-[rgba(255,255,255,.85)] [text-shadow:0_1px_1px_rgba(0,0,0,.45)]">
                « {world.tagline} »
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-24">
          {errorMessage ? (
            <div role="alert" className="mb-2 rounded-[12px] border-2 border-[#a93226] bg-[rgba(192,57,43,.12)] px-4 py-3 text-center font-game text-[12px] font-bold text-[#7d1e15]">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex flex-col gap-2.5">
            <DetailCard icon={<ScrollText aria-hidden="true" className="size-4 stroke-[2.4]" />} title={labels.lifecycleTitle}>
              {world.lifecycleRows.map((metric) => <MetricRow key={metric.label} metric={metric} />)}
            </DetailCard>

            <DetailCard icon={<Map aria-hidden="true" className="size-4 stroke-[2.4]" />} title={labels.mapTitle}>
              <div className="flex items-center justify-between gap-3 rounded-[9px] border border-[rgba(60,38,25,.2)] bg-[rgba(60,38,25,.06)] px-3 py-2">
                <span className="font-game text-[10px] font-extrabold uppercase tracking-[.14em] text-[#6d5838]">
                  {labels.mapTitle}
                </span>
                <span className="font-game text-[16px] font-black text-[#3c2619] tabular-nums">
                  {world.mapLabel}
                </span>
              </div>
            </DetailCard>

            <DetailCard icon={<Shield aria-hidden="true" className="size-4 stroke-[2.4]" />} title={labels.tempoTitle}>
              {world.tempoRows.map((metric) => <MetricRow key={metric.label} metric={metric} />)}
            </DetailCard>

            {world.personalStats ? (
              <DetailCard icon={<Castle aria-hidden="true" className="size-4 stroke-[2.4]" />} title={labels.joinedStatsTitle}>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-game text-[11px] font-extrabold text-[#3d2f1f] tabular-nums">
                    <Castle aria-hidden="true" className="size-[14px] shrink-0 text-[#6d5838]" />
                    {world.personalStats.villageCountLabel}
                  </span>
                  <span className="h-4 w-px bg-[rgba(60,38,25,.18)]" />
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-game text-[11px] font-extrabold text-[#3d2f1f] tabular-nums">
                    <img alt="" className="size-[14px] shrink-0 object-contain" src={publicAsset(KINGDOM_POWER_ICON)} />
                    {world.personalStats.kingdomPowerLabel}
                  </span>
                </div>
              </DetailCard>
            ) : null}

            <DetailCard icon={<Users aria-hidden="true" className="size-4 stroke-[2.4]" />} title={labels.guardrailsTitle}>
              {world.guardrails.map((metric) => <MetricRow key={metric.label} metric={metric} />)}
            </DetailCard>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 mx-auto w-full bg-[linear-gradient(to_top,rgba(212,192,148,1)_68%,rgba(212,192,148,0))] px-3 pb-3 pt-8">
          <button
            className={cn(
              'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 px-3 font-game text-[11px] font-extrabold uppercase tracking-[.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_3px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]',
              primaryTone,
              primaryDisabled ? 'cursor-not-allowed opacity-[.7]' : 'cursor-pointer active:translate-y-px',
            )}
            disabled={primaryDisabled}
            onClick={() => {
              if (!primaryDisabled) onPrimaryAction(world);
            }}
            type="button"
          >
            <PrimaryIcon ctaKind={world.ctaKind} />
            {world.ctaLabel}
          </button>
        </div>
      </div>
    </main>
  );
}
