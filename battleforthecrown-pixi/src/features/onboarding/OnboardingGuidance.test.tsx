import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingGuidance } from './OnboardingGuidance';
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
