import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingFab, type OnboardingFabProps } from './OnboardingFab';

const baseProps: OnboardingFabProps = {
  body: 'Ouvre le panneau des bâtiments et lance la Caserne.',
  closeLabel: 'Fermer',
  ctaLabel: 'Construire',
  imageAlt: 'Construire la Caserne',
  imageSrc: '/assets/barracks.png',
  modalLabel: 'TUTORIEL · Étape 2/5',
  onOpenChange: () => undefined,
  onPrimaryAction: () => undefined,
  open: false,
  pillLabel: 'Tutoriel · 2/5',
  secondaryLabel: 'Plus tard',
  step: 2,
  title: 'Construire la Caserne',
  total: 5,
};

function renderFab(overrides: Partial<OnboardingFabProps> = {}) {
  return render(<OnboardingFab {...baseProps} {...overrides} />);
}

describe('OnboardingFab', () => {
  it('renders the closed tutorial pill without the modal', () => {
    renderFab();

    expect(screen.getByText('Tutoriel · 2/5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Construire la Caserne/i })).toHaveAttribute(
      'title',
      'Construire la Caserne',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('requests opening when the pill is clicked', () => {
    const onOpenChange = vi.fn();
    renderFab({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /Construire la Caserne/i }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('marks the pill while the step advance animation is active', () => {
    renderFab({ isAdvancing: true });

    expect(screen.getByRole('button', { name: /Construire la Caserne/i })).toHaveAttribute(
      'data-advancing',
      'true',
    );
  });

  it('renders the open modal with the provided image and action payloads', () => {
    const onPrimaryAction = vi.fn();
    const onSecondaryAction = vi.fn();
    renderFab({
      imageBadgeLabel: 'x5',
      onPrimaryAction,
      onSecondaryAction,
      open: true,
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('TUTORIEL · Étape 2/5')).toBeInTheDocument();
    expect(screen.getByAltText('Construire la Caserne')).toHaveAttribute('src', '/assets/barracks.png');
    expect(screen.getByText('x5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Construire' }));
    expect(onPrimaryAction).toHaveBeenCalledWith({
      step: 2,
      title: 'Construire la Caserne',
      total: 5,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(onSecondaryAction).toHaveBeenCalledWith({
      step: 2,
      title: 'Construire la Caserne',
      total: 5,
    });
  });
});
