import type { ReactNode } from 'react';
import { Bell, Castle, Check, ChevronLeft, Clock, Map, Shield, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';
import type { WorldCardViewModel, WorldThemeTokens } from '@/features/worlds/worldsViewModel';

export interface WorldDetailLabels {
  back: string;
  lifecycle: string;
  map: string;
  personalStats: string;
  publicData: string;
  shield: string;
  tempo: string;
  vassals: string;
}

export interface WorldDetailDesignProps {
  className?: string;
  isLoading?: boolean;
  labels: WorldDetailLabels;
  noticeMessage?: string | null;
  onBack: () => void;
  onEnter: (world: WorldCardViewModel) => void;
  onJoin: (world: WorldCardViewModel) => void;
  onNotify: (world: WorldCardViewModel) => void;
  world: WorldCardViewModel;
}

const KINGDOM_POWER_ICON = '/assets/power.png';

function DetailCrest({ glyph, theme }: { glyph: string; theme: WorldThemeTokens }) {
  return (
    <div className="relative h-[58px] w-[50px] shrink-0 drop-shadow-[0_4px_5px_rgba(0,0,0,.5)]">
      <div
        className="absolute inset-0 border-2 shadow-[inset_0_2px_0_rgba(255,255,255,.25),inset_0_-10px_16px_rgba(0,0,0,.28)] [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]"
        style={{
          background: `linear-gradient(to bottom, ${theme.light}, ${theme.dark})`,
          borderColor: '#f6d57b',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-1 font-game text-[25px] font-black leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
        {glyph}
      </div>
    </div>
  );
}

function SectionTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <div className="mb-2 flex flex-col gap-0.5 text-center">
      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-[linear-gradient(to_right,rgba(60,38,25,.45),transparent)]" />
        <h2 className="font-game text-[10px] font-black uppercase tracking-[.24em] text-[#3c2619] [text-shadow:0_1px_0_rgba(255,255,255,.45)]">
          {children}
        </h2>
        <span className="h-px flex-1 bg-[linear-gradient(to_left,rgba(60,38,25,.45),transparent)]" />
      </div>
      {subtitle ? (
        <p className="font-game text-[9.5px] italic leading-tight text-[#6d5838]">{subtitle}</p>
      ) : null}
    </div>
  );
}

function ParchmentCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f3e3c2)] p-2.5 shadow-[0_2px_6px_rgba(60,38,25,.18),inset_0_1px_0_rgba(255,255,255,.5),inset_0_-8px_14px_rgba(60,38,25,.05)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

function LifecycleBar({ world }: { world: WorldCardViewModel }) {
  const total = world.lifecycleTotalDays;
  const mainDays = Math.min(world.lifecycleInscriptionMainDays, total);
  const lateDays = Math.min(world.lifecycleInscriptionLateDays, Math.max(total - mainDays, 0));
  const lockedDays = Math.max(total - mainDays - lateDays, 1);
  const markerPct = world.lifecycleDay === null
    ? 0
    : Math.max(0.5, Math.min(99.5, (world.lifecycleDay / total) * 100));
  const fillWidth = world.lifecycleDay === null ? 0 : markerPct;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2 py-[2px] font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]"
          style={{
            background: `linear-gradient(to bottom, ${world.theme.light}, ${world.theme.dark})`,
            borderColor: world.theme.border,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.25), 0 0 8px ${world.theme.glow}`,
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
            className="absolute inset-y-0 left-0 overflow-hidden rounded-l-[5px] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]"
            style={{ width: `${fillWidth}%` }}
          />
        ) : null}
        {world.lifecycleDay !== null ? (
          <div
            className="absolute -top-1 -bottom-1 z-[2] w-[2.5px] -translate-x-1/2 rounded-sm bg-[#f6e4b8] shadow-[0_0_6px_rgba(60,38,25,.45)]"
            style={{ left: `${markerPct}%` }}
          />
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-1 font-game text-[8.5px] font-extrabold uppercase tracking-[.12em] text-[#6d5838]">
        <span>Ouverture</span>
        <span className="text-center">Retardataires</span>
        <span className="text-right">Verrouillé</span>
      </div>
    </div>
  );
}

function FactRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-[rgba(60,38,25,.22)] px-1 py-1.5 font-game last:border-b-0">
      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#6d5838]">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right text-[11px] font-extrabold text-[#3d2f1f] tabular-nums">
        {value}
      </span>
    </div>
  );
}

function DetailCta({
  onEnter,
  onJoin,
  onNotify,
  world,
}: {
  onEnter: (world: WorldCardViewModel) => void;
  onJoin: (world: WorldCardViewModel) => void;
  onNotify: (world: WorldCardViewModel) => void;
  world: WorldCardViewModel;
}) {
  if (world.ctaKind === 'locked') return null;

  const tone = world.ctaKind === 'notify'
    ? 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]'
    : world.ctaKind === 'join'
      ? 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]'
      : 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] text-[#3a2a00] [text-shadow:0_1px_0_rgba(255,255,255,.35)]';
  const Icon = world.ctaKind === 'notify' ? Bell : world.ctaKind === 'joined' ? Check : UserPlus;

  return (
    <button
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 px-3 font-game text-[12px] font-extrabold uppercase tracking-[.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_3px_0_rgba(0,0,0,.22)] [text-shadow:1px_1px_1px_rgba(0,0,0,.45)]',
        tone,
        'cursor-pointer active:translate-y-px',
      )}
      onClick={() => {
        if (world.ctaKind === 'notify') onNotify(world);
        if (world.ctaKind === 'join') onJoin(world);
        if (world.ctaKind === 'joined') onEnter(world);
      }}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4 stroke-[2.4]" />
      {world.ctaLabel}
    </button>
  );
}

export function WorldDetailDesign({
  className,
  isLoading = false,
  labels,
  noticeMessage,
  onBack,
  onEnter,
  onJoin,
  onNotify,
  world,
}: WorldDetailDesignProps) {
  return (
    <main className={cn('min-h-screen bg-[#d4c094] text-[#3d2f1f]', className)}>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#e8d5b7_0%,#f5e6d3_45%,#d4c094_100%)] font-game shadow-[0_0_0_1px_rgba(60,38,25,.2)]">
        <header
          className="relative shrink-0 border-b-[3px] border-[#3c2619] px-3.5 pb-3 pt-3 shadow-[0_4px_12px_rgba(60,38,25,.35),inset_0_-10px_22px_rgba(0,0,0,.25)]"
          style={{ background: `linear-gradient(135deg, ${world.theme.light} 0%, ${world.theme.dark} 100%)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#fff_1px,transparent_1.5px)] bg-[length:26px_26px] opacity-[.15]" />
          <div className="relative mb-2 flex items-center justify-between gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[rgba(255,255,255,.28)] bg-[rgba(0,0,0,.32)] px-2.5 py-1 font-game text-[11px] font-bold uppercase tracking-[.08em] text-white [text-shadow:0_1px_1px_rgba(0,0,0,.5)]"
              onClick={onBack}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5 stroke-[3]" />
              {labels.back}
            </button>
            <span className="inline-flex rounded-full border-[1.5px] border-[rgba(255,255,255,.28)] bg-[rgba(0,0,0,.24)] px-2.5 py-1 font-game text-[9.5px] font-extrabold uppercase tracking-[.14em] text-white [text-shadow:0_1px_1px_rgba(0,0,0,.5)]">
              {world.tempoLabel}
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            <DetailCrest glyph={world.sigilGlyph} theme={world.theme} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-game text-[22px] font-black leading-none tracking-[.02em] text-white [text-shadow:0_2px_4px_rgba(0,0,0,.55)]">
                {world.displayName}
              </h1>
              <div className="mt-1 flex items-center gap-2 font-game text-[10px] font-extrabold uppercase tracking-[.1em] text-[rgba(255,255,255,.9)] [text-shadow:0_1px_1px_rgba(0,0,0,.5)]">
                <span>{world.id}</span>
                <span className="opacity-60">·</span>
                <span>{world.tierLabel}</span>
              </div>
              <p className="mt-1 max-h-8 overflow-hidden font-game text-[10.5px] italic leading-tight text-[rgba(255,255,255,.85)] [text-shadow:0_1px_1px_rgba(0,0,0,.45)]">
                « {world.tagline} »
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 pb-[82px]">
          {noticeMessage ? (
            <div role="alert" className="mb-2 rounded-[12px] border-2 border-[#a93226] bg-[rgba(192,57,43,.12)] px-4 py-3 text-center font-game text-[12px] font-bold text-[#7d1e15]">
              {noticeMessage}
            </div>
          ) : null}
          {isLoading ? (
            <div className="h-[420px] animate-pulse rounded-xl border-2 border-[#8b7355] bg-[rgba(254,249,240,.62)]" />
          ) : (
            <div className="flex flex-col gap-2.5">
              <ParchmentCard>
                <SectionTitle subtitle={`Ce monde dure ${world.lifecycleTotalDays} jours.`}>{labels.lifecycle}</SectionTitle>
                <LifecycleBar world={world} />
              </ParchmentCard>

              <ParchmentCard>
                <SectionTitle>{labels.publicData}</SectionTitle>
                <div className="flex flex-col">
                  <FactRow icon={<Users aria-hidden="true" className="size-3.5 text-[#6d5838]" />} label={labels.vassals} value={world.joinedCountLabel} />
                  <FactRow icon={<Map aria-hidden="true" className="size-3.5 text-[#6d5838]" />} label={labels.map} value={world.mapSizeLabel} />
                  <FactRow icon={<Clock aria-hidden="true" className="size-3.5 text-[#6d5838]" />} label={labels.tempo} value={world.tempoLabel} />
                  <FactRow icon={<Shield aria-hidden="true" className="size-3.5 text-[#6d5838]" />} label={labels.shield} value={world.shieldLabel} />
                </div>
              </ParchmentCard>

              {world.personalStats ? (
                <ParchmentCard className="border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fef4d8,#e8d4a8)]">
                  <SectionTitle>{labels.personalStats}</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-[rgba(158,123,13,.28)] bg-[rgba(246,213,123,.2)] px-2 py-2 text-center">
                      <Castle aria-hidden="true" className="mx-auto mb-1 size-4 text-[#6d5838]" />
                      <div className="font-game text-[10.5px] font-extrabold text-[#3d2f1f]">{world.personalStats.villageCountLabel}</div>
                    </div>
                    <div className="rounded-lg border border-[rgba(158,123,13,.28)] bg-[rgba(246,213,123,.2)] px-2 py-2 text-center">
                      <img alt="" className="mx-auto mb-1 size-4 object-contain" src={publicAsset(KINGDOM_POWER_ICON)} />
                      <div className="font-game text-[10.5px] font-extrabold text-[#3d2f1f]">{world.personalStats.kingdomPowerLabel}</div>
                    </div>
                  </div>
                </ParchmentCard>
              ) : null}
            </div>
          )}
        </div>

        {world.ctaKind !== 'locked' ? (
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] bg-[linear-gradient(to_top,rgba(212,192,148,1)_60%,rgba(212,192,148,0))] px-3 pb-3 pt-7">
            <DetailCta onEnter={onEnter} onJoin={onJoin} onNotify={onNotify} world={world} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
