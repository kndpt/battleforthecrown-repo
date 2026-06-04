import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaptureWindowCard } from './KingdomActivitiesPanel';

describe('CaptureWindowCard', () => {
  it('renders progress as a whole percentage', () => {
    render(
      <CaptureWindowCard
        coordinates="265|241"
        endTime="15:19"
        endTimeLabel="Fin à"
        nobleEyebrow="Seigneur immobilisé"
        nobleName="Seigneur"
        originLabelPrefix="Depuis"
        originName="Royaume source"
        progress={0.27904}
        state="open"
        statusLabel="Capture en cours"
        targetName="Royaume cible"
        tier="PVP"
        tierSubLabel="Ch. 10"
        timeRemaining="17h 57m"
      />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText('0.27904%')).not.toBeInTheDocument();
    const tierBadge = screen.getByLabelText('PVP Ch. 10');
    expect(tierBadge).toHaveTextContent('PVP');
    expect(tierBadge).toHaveTextContent('Ch. 10');
    expect(tierBadge).toHaveClass('h-[18px]');
    expect(tierBadge).not.toHaveClass('size-[42px]');
  });
});
