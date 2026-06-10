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

  it('selects the floating tutorial as soon as it is tapped', () => {
    renderFab();

    const pill = screen.getByRole('button', { name: /Construire la Caserne/i });
    fireEvent.pointerDown(pill, {
      clientX: 20,
      clientY: 620,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(pill).toHaveAttribute('data-selected', 'true');
  });

  it('moves the floating tutorial immediately and does not open the modal after a drag', () => {
    const onOpenChange = vi.fn();
    const rect = {
      bottom: 642,
      height: 42,
      left: 6,
      right: 206,
      top: 600,
      width: 200,
      x: 6,
      y: 600,
      toJSON: () => undefined,
    } as DOMRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect);

    renderFab({ onOpenChange });

    const pill = screen.getByRole('button', { name: /Construire la Caserne/i });
    fireEvent.pointerDown(pill, {
      clientX: 20,
      clientY: 620,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(pill, {
      clientX: 56,
      clientY: 594,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(pill).toHaveAttribute('data-dragging', 'true');
    expect(pill).toHaveClass('duration-0');
    expect(pill.style.getPropertyValue('--bftc-onboarding-drag-x')).toBe('36px');
    expect(pill.style.getPropertyValue('--bftc-onboarding-drag-y')).toBe('-26px');

    fireEvent.pointerUp(pill, {
      clientX: 56,
      clientY: 594,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.click(pill);

    expect(onOpenChange).not.toHaveBeenCalled();
    rectSpy.mockRestore();
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
