import { Button } from '@/ui';
import type { OnboardingGuidance as OnboardingGuidanceModel } from './onboardingViewModel';

interface OnboardingGuidanceProps {
  guidance: OnboardingGuidanceModel | null;
  isLoading?: boolean;
  onNavigate: (route: OnboardingGuidanceModel['route']) => void;
}

export function OnboardingGuidance({
  guidance,
  isLoading = false,
  onNavigate,
}: OnboardingGuidanceProps) {
  if (!guidance || isLoading) return null;

  return (
    <aside className="pointer-events-auto w-[min(360px,calc(100vw-1.5rem))] rounded-lg border-2 border-game-gold-border bg-parchment/95 p-3 shadow-clay-lg">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-game text-[11px] font-bold uppercase tracking-normal text-game-gold-dark">
          Tutoriel
        </span>
        <span className="rounded bg-kingdom-900 px-2 py-0.5 font-game text-[11px] font-bold text-white">
          {guidance.progressLabel}
        </span>
      </div>
      <h2 className="font-cinzel text-base font-bold leading-tight text-kingdom-900">
        {guidance.title}
      </h2>
      <p className="mt-1 font-game text-sm leading-snug text-kingdom-700">
        {guidance.description}
      </p>
      <Button
        className="mt-3 w-full"
        size="sm"
        variant="success"
        onClick={() => onNavigate(guidance.route)}
      >
        {guidance.ctaLabel}
      </Button>
    </aside>
  );
}
