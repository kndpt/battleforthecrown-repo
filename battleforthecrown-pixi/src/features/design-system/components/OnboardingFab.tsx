import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface OnboardingFabActionPayload {
  step: number;
  total: number;
  title: string;
}

export type OnboardingFabPlacement = 'container' | 'viewport';

export interface OnboardingFabProps {
  body: string;
  closeLabel: string;
  ctaLabel: string;
  imageAlt: string;
  imageBadgeLabel?: string;
  imageSrc: string;
  modalLabel: string;
  onOpenChange: (open: boolean) => void;
  onPrimaryAction: (payload: OnboardingFabActionPayload) => void;
  open: boolean;
  pillLabel: string;
  step: number;
  title: string;
  total: number;
  className?: string;
  disabled?: boolean;
  isAdvancing?: boolean;
  loading?: boolean;
  onSecondaryAction?: (payload: OnboardingFabActionPayload) => void;
  placement?: OnboardingFabPlacement;
  secondaryLabel?: string;
}

function buildPayload(props: Pick<OnboardingFabProps, 'step' | 'title' | 'total'>) {
  return { step: props.step, title: props.title, total: props.total };
}

function TutoRing({
  step,
  total,
  size,
  stroke = 3,
}: {
  size: number;
  step: number;
  total: number;
  stroke?: number;
}) {
  const r = size / 2 - stroke / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const gap = 6;
  const segment = circumference / total;
  const dash = segment - gap;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
      height={size}
      width={size}
    >
      {Array.from({ length: total }).map((_, index) => {
        const isComplete = index < step;
        return (
          <circle
            cx={size / 2}
            cy={size / 2}
            fill="none"
            key={index}
            r={r}
            stroke={isComplete ? '#b45309' : 'rgba(0,0,0,.35)'}
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={-(index * segment + gap / 2)}
            strokeLinecap="butt"
            strokeWidth={stroke}
            style={{
              filter: isComplete
                ? 'drop-shadow(0 0 2px rgba(244,208,63,.65))'
                : 'none',
            }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </svg>
  );
}

function TutoOrb({
  ring = true,
  size,
  step,
  total,
}: {
  size: number;
  step: number;
  total: number;
  ring?: boolean;
}) {
  const padding = ring ? 7 : 0;

  return (
    <div
      className="relative shrink-0"
      style={{ height: size, width: size }}
    >
      {ring ? <TutoRing size={size} step={step} total={total} /> : null}
      <div
        className="absolute flex items-center justify-center rounded-full border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#fff2c1,#f6d57b_45%,#c59e3f)] shadow-[inset_0_1px_0_rgba(255,255,255,.7),inset_0_-2px_4px_rgba(0,0,0,.18),0_4px_8px_rgba(0,0,0,.45)]"
        style={{ inset: padding }}
      >
        <span
          className="font-game font-black leading-none text-[#3a2a00] [text-shadow:0_1px_0_rgba(255,255,255,.55)]"
          style={{ fontSize: size * 0.42 }}
        >
          {step}
        </span>
      </div>
    </div>
  );
}

function TutoStepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-[5px]">
      {Array.from({ length: total }).map((_, index) => {
        const done = index < step - 1;
        const active = index === step - 1;
        return (
          <div
            className={cn(
              'h-[5px] rounded-full border transition-[flex] duration-[250ms]',
              done || active
                ? 'border-[#9e7b0d] bg-[linear-gradient(to_right,#f1c40f,#d4a017)] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]'
                : 'border-[rgba(93,74,50,.15)] bg-[rgba(93,74,50,.25)]',
            )}
            key={index}
            style={{ flex: active ? 2.2 : 1 }}
          />
        );
      })}
    </div>
  );
}

function PixelActionButton({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-2 border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] px-[18px] py-[9px] font-game text-sm font-bold tracking-[.04em] text-white shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)] transition-[transform,filter] duration-[150ms] hover:brightness-[1.08] active:translate-y-0.5 active:shadow-[0_1px_0_rgba(0,0,0,.22),inset_0_2px_4px_rgba(0,0,0,.4)] disabled:cursor-not-allowed disabled:brightness-[.88] disabled:saturate-[.65]"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function TutoHero({
  alt,
  badgeLabel,
  src,
}: {
  alt: string;
  src: string;
  badgeLabel?: string;
}) {
  return (
    <div className="relative flex h-[150px] items-end justify-center overflow-hidden rounded-xl border border-[rgba(146,64,14,.18)] bg-[radial-gradient(ellipse_at_50%_95%,rgba(60,38,25,.22)_0%,rgba(60,38,25,0)_60%),linear-gradient(180deg,rgba(146,64,14,.10)_0%,rgba(146,64,14,.04)_100%)] px-2 pb-1.5 pt-3">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,#6d5838_0_1px,transparent_1px_7px)] opacity-[.12]" />
      <img
        alt={alt}
        className="relative z-[1] max-h-full max-w-[82%] object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,.35)]"
        src={publicAsset(src)}
      />
      {badgeLabel ? (
        <span className="absolute bottom-2 right-2 z-[2] rounded-full border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#f6d57b,#d4a017_52%,#9e6f08)] px-2.5 py-1 font-game text-sm font-black leading-none text-[#3a2a00] shadow-[0_2px_0_rgba(60,38,25,.55),inset_0_1px_0_rgba(255,255,255,.55)] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
          {badgeLabel}
        </span>
      ) : null}
    </div>
  );
}

export function OnboardingFab({
  body,
  className,
  closeLabel,
  ctaLabel,
  disabled = false,
  imageAlt,
  imageBadgeLabel,
  imageSrc,
  isAdvancing = false,
  loading = false,
  modalLabel,
  onOpenChange,
  onPrimaryAction,
  onSecondaryAction,
  open,
  pillLabel,
  placement = 'viewport',
  secondaryLabel,
  step,
  title,
  total,
}: OnboardingFabProps) {
  const payload = buildPayload({ step, title, total });
  const isDisabled = disabled || loading;
  const rootPlacement =
    placement === 'viewport'
      ? 'fixed bottom-[calc(var(--bftc-bottom-nav-height,72px)+var(--bftc-bottom-nav-gap,18px))] left-[6px]'
      : 'absolute bottom-[calc(var(--bftc-bottom-nav-height,58px)+var(--bftc-bottom-nav-gap,18px))] left-[6px]';
  const overlayPlacement = placement === 'viewport' ? 'fixed' : 'absolute';

  return (
    <>
      <button
        className={cn(
          'pointer-events-auto relative z-30 inline-flex w-[min(212px,calc(100vw-186px))] cursor-pointer items-center gap-1.5 overflow-visible rounded-full border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(254,249,240,.84),rgba(232,212,168,.78))] py-0.5 pl-0.5 pr-2.5 text-left shadow-[0_0_0_1px_rgba(212,160,23,.88),inset_0_1px_0_rgba(255,255,255,.48),0_3px_8px_rgba(0,0,0,.32)] backdrop-blur-[2px] transition-[filter,transform] duration-[150ms] hover:brightness-[1.04] active:translate-y-px disabled:cursor-not-allowed disabled:brightness-[.9] disabled:saturate-[.7]',
          isAdvancing &&
            'animate-[bftcOnboardingAdvancePulse_900ms_ease-out_1] shadow-[0_0_0_1px_rgba(212,160,23,.95),0_0_0_5px_rgba(244,208,63,.20),inset_0_1px_0_rgba(255,255,255,.58),0_6px_13px_rgba(0,0,0,.38)]',
          rootPlacement,
          className,
        )}
        data-advancing={isAdvancing ? 'true' : undefined}
        disabled={isDisabled}
        onClick={() => onOpenChange(true)}
        title={title}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-[-5px] rounded-full opacity-0',
            isAdvancing &&
              'animate-[bftcOnboardingAdvanceHalo_900ms_ease-out_1] bg-[radial-gradient(circle_at_16%_50%,rgba(255,244,196,.74)_0_8%,transparent_9%),radial-gradient(circle_at_44%_4%,rgba(255,220,90,.62)_0_6%,transparent_7%),radial-gradient(circle_at_83%_42%,rgba(255,235,148,.58)_0_7%,transparent_8%)]',
          )}
        />
        <TutoOrb size={36} step={step} total={total} />
        <span className="flex min-w-0 flex-col gap-px">
          <span className="font-game text-[7.5px] font-black uppercase tracking-[.26em] text-[#92400e] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
            {pillLabel}
          </span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-game text-xs font-bold text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
            {title}
          </span>
        </span>
        <span className="ml-auto font-game text-[13px] font-black text-[rgba(212,160,23,.74)]">
          ›
        </span>
      </button>

      {open ? (
        <div
          className={cn(
            'pointer-events-auto inset-0 z-[2000] flex items-center justify-center bg-[rgba(0,0,0,.55)] p-3.5 backdrop-blur-[3px]',
            overlayPlacement,
          )}
          onClick={() => onOpenChange(false)}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="flex w-[320px] max-w-[94%] flex-col overflow-hidden rounded-2xl border-4 border-[#3c2619] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] shadow-[0_0_0_2px_#d4a017,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="h-2 border-b border-[rgba(0,0,0,.25)] bg-[linear-gradient(to_right,#f1c40f,#d4a017)]" />

            <div className="flex items-center gap-3 px-3.5 pb-2 pt-3">
              <TutoOrb size={48} step={step} total={total} />
              <div className="min-w-0 flex-1">
                <div className="font-game text-[9.5px] font-bold uppercase tracking-[.3em] text-[#6d5838]">
                  {modalLabel}
                </div>
                <h2 className="font-game text-[17px] font-extrabold leading-[1.15] tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
                  {title}
                </h2>
              </div>
              <button
                aria-label={closeLabel}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#b6a78a,#8b7355)] font-game text-sm font-extrabold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mx-3.5 h-px bg-[rgba(93,74,50,.35)]" />

            <div className="flex flex-col gap-3 p-3.5">
              <TutoHero
                alt={imageAlt}
                badgeLabel={imageBadgeLabel}
                src={imageSrc}
              />
              <TutoStepDots step={step} total={total} />
              <p className="m-0 font-game text-[13.5px] leading-[1.45] text-[#6d5838]">
                {body}
              </p>

              <div className="flex gap-2">
                {secondaryLabel && onSecondaryAction ? (
                  <button
                    className="shrink-0 cursor-pointer border-0 bg-transparent px-3.5 py-[9px] font-game text-xs font-bold tracking-[.04em] text-[#6d5838] underline underline-offset-[3px]"
                    onClick={() => onSecondaryAction(payload)}
                    type="button"
                  >
                    {secondaryLabel}
                  </button>
                ) : null}
                <PixelActionButton
                  disabled={isDisabled}
                  onClick={() => onPrimaryAction(payload)}
                >
                  {ctaLabel}
                </PixelActionButton>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <style>{`
        @keyframes bftcOnboardingAdvancePulse {
          0% { transform: translateY(0) scale(1); filter: brightness(1); }
          28% { transform: translateY(-4px) scale(1.035); filter: brightness(1.12); }
          58% { transform: translateY(1px) scale(.995); filter: brightness(1.04); }
          100% { transform: translateY(0) scale(1); filter: brightness(1); }
        }

        @keyframes bftcOnboardingAdvanceHalo {
          0% { opacity: 0; transform: scale(.88); }
          24% { opacity: .95; transform: scale(1.04); }
          100% { opacity: 0; transform: scale(1.22); }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-advancing='true'] {
            animation: none !important;
          }
          [data-advancing='true'] > span[aria-hidden='true'] {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
