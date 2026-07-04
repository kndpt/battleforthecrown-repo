import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NaturalTraitBadge } from './NaturalTraitBadge';

describe('NaturalTraitBadge', () => {
  it('renders a real button with the trait aria-label and asset', () => {
    render(<NaturalTraitBadge trait="DENSE_FOREST" variant="icon-only" />);
    const button = screen.getByRole('button', { name: /Forêt dense/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('img')).toBeTruthy();
  });

  it('icon-only hides the label, full shows it', () => {
    const { rerender } = render(<NaturalTraitBadge trait="RICH_QUARRY" variant="icon-only" />);
    expect(screen.queryByText('Carrière riche')).not.toBeInTheDocument();
    rerender(<NaturalTraitBadge trait="RICH_QUARRY" variant="full" />);
    expect(screen.getByText('Carrière riche')).toBeInTheDocument();
  });

  it('opens the info modal on click (portaled overlay, not inline)', () => {
    render(<NaturalTraitBadge trait="IRON_VEIN" variant="full" />);
    // Modal not mounted before click.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Veine de fer/i }));
    // ModalOverlay mounts a centered dialog (portaled to <body>), with the info.
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // "Trait naturel" also labels the full badge — scope to the dialog.
    expect(within(dialog).getByText('Trait naturel')).toBeInTheDocument();
    expect(within(dialog).getByText('+10 % Fer')).toBeInTheDocument();
  });
});
