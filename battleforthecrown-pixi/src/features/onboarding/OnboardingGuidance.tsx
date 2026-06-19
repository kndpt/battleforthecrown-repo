import { useEffect, useRef, useState } from 'react';
import { OnboardingFab } from '@/features/design-system/components';
import type { GameActionId } from '@/features/game-actions/gameActions';
import type { OnboardingGuidance as OnboardingGuidanceModel } from './onboardingViewModel';

export interface OnboardingGuidanceProps {
  guidance: OnboardingGuidanceModel | null;
  isLoading?: boolean;
  onAcknowledge?: () => void;
  onAction?: (actionId: GameActionId) => void;
  onNavigate: (route: NonNullable<OnboardingGuidanceModel['route']>) => void;
}

export function OnboardingGuidance({
  guidance,
  isLoading = false,
  onAcknowledge,
  onAction,
  onNavigate,
}: OnboardingGuidanceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const previousStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!guidance) {
      previousStepRef.current = null;
      return undefined;
    }

    const previousStep = previousStepRef.current;
    previousStepRef.current = guidance.step;

    if (previousStep === null || guidance.step <= previousStep) {
      return undefined;
    }

    setIsOpen(false);
    setIsAdvancing(true);
    const timeout = window.setTimeout(() => setIsAdvancing(false), 900);
    return () => window.clearTimeout(timeout);
  }, [guidance?.step]);

  if (!guidance || isLoading) return null;

  return (
    <OnboardingFab
      body={guidance.description}
      closeLabel="Fermer le tutoriel"
      ctaLabel={guidance.ctaLabel}
      imageAlt={guidance.title}
      imageBadgeLabel={guidance.imageBadgeLabel}
      imageSrc={guidance.imageSrc}
      isAdvancing={isAdvancing}
      lootPreview={guidance.lootPreview}
      modalLabel={guidance.modalLabel}
      onOpenChange={setIsOpen}
      onPrimaryAction={() => {
        setIsOpen(false);
        if (guidance.isCompletion) {
          onAcknowledge?.();
          return;
        }
        if (onAction && guidance.gameActionId) {
          onAction(guidance.gameActionId);
          return;
        }
        if (guidance.route) {
          onNavigate(guidance.route);
        }
      }}
      onSecondaryAction={() => setIsOpen(false)}
      open={isOpen}
      pillLabel={guidance.pillLabel}
      secondaryLabel={guidance.secondaryLabel}
      step={guidance.step}
      title={guidance.title}
      total={guidance.total}
    />
  );
}
