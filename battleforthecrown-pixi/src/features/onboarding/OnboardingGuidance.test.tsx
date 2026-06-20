import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnboardingGuidance } from './OnboardingGuidance';
import { usePendingBuildingModalStore } from '@/stores/pendingBuildingModal';
import type { OnboardingGuidance as OnboardingGuidanceModel } from './onboardingViewModel';

const completionGuidance: OnboardingGuidanceModel = {
  title: 'Campement barbare vaincu !',
  description: 'Tes troupes rapportent le butin pillé.',
  ctaLabel: 'Récupérer le butin',
  imageSrc: '/assets/world/entity/barbarian-village-tier1.png',
  lootPreview: {
    label: 'Butin à récupérer',
    items: [
      { icon: '/assets/resources/wood.png', value: '1.2K' },
      { icon: '/assets/resources/stone.png', value: '1.2K' },
      { icon: '/assets/resources/iron.png', value: '840' },
    ],
  },
  modalLabel: 'TUTORIEL · Terminé',
  pillLabel: 'Tutoriel · Terminé',
  progressLabel: '6 / 6',
  step: 6,
  total: 6,
  isCompletion: true,
};

const castleStepGuidance: OnboardingGuidanceModel = {
  title: 'Renforcer le Château',
  description: 'Passe le Château au niveau 2 pour accélérer les prochaines constructions.',
  ctaLabel: 'Ouvrir le Château',
  imageSrc: '/assets/castle.png',
  gameActionId: 'open-building-management',
  route: '/game',
  targetBuildingType: 'CASTLE',
  modalLabel: 'TUTORIEL · Étape 1/6',
  pillLabel: 'Tutoriel · 1/6',
  progressLabel: '1 / 6',
  secondaryLabel: 'Plus tard',
  step: 1,
  total: 6,
};

const trainStepGuidance: OnboardingGuidanceModel = {
  title: 'Former la milice',
  description: 'Entraîne 5 miliciens.',
  ctaLabel: 'Former',
  imageSrc: '/assets/army/militia.png',
  gameActionId: 'open-army-training',
  route: '/game/army',
  modalLabel: 'TUTORIEL · Étape 3/6',
  pillLabel: 'Tutoriel · 3/6',
  progressLabel: '3 / 6',
  secondaryLabel: 'Plus tard',
  step: 3,
  total: 6,
};

describe('OnboardingGuidance — building step', () => {
  afterEach(() => usePendingBuildingModalStore.getState().consume());

  it('queues the target building modal and routes to the village from any screen', () => {
    const onAction = vi.fn();
    const onNavigate = vi.fn();

    render(
      <OnboardingGuidance
        guidance={castleStepGuidance}
        onAction={onAction}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Renforcer le Château/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le Château' }));

    expect(usePendingBuildingModalStore.getState().buildingType).toBe('CASTLE');
    expect(onNavigate).toHaveBeenCalledWith('/game');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('runs the game action for steps without a target building', () => {
    const onAction = vi.fn();
    const onNavigate = vi.fn();

    render(
      <OnboardingGuidance
        guidance={trainStepGuidance}
        onAction={onAction}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Former la milice/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Former' }));

    expect(onAction).toHaveBeenCalledWith('open-army-training');
    expect(usePendingBuildingModalStore.getState().buildingType).toBeNull();
  });
});

describe('OnboardingGuidance — completion', () => {
  it('renders the loot preview and acknowledges without navigating', () => {
    const onAcknowledge = vi.fn();
    const onAction = vi.fn();
    const onNavigate = vi.fn();

    render(
      <OnboardingGuidance
        guidance={completionGuidance}
        onAcknowledge={onAcknowledge}
        onAction={onAction}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Campement barbare vaincu/i }));

    expect(screen.getByText('Butin à récupérer')).toBeInTheDocument();
    expect(screen.getByText('840')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Récupérer le butin' }));

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
