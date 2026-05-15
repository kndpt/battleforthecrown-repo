import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RetentionSummaryDto } from '@battleforthecrown/shared/retention';
import type { JoinedVillage } from '@/api';
import { DailyRetentionWidget } from './DailyRetentionWidget';

const villages: JoinedVillage[] = [
  {
    id: 'v1',
    isCapital: true,
    name: 'Haute Cour',
    userId: 'u1',
    worldId: 'w1',
    x: 10,
    y: 12,
  },
  {
    id: 'v2',
    label: 'DEFENSIVE',
    name: 'Marche Nord',
    userId: 'u1',
    worldId: 'w1',
    x: 13,
    y: 15,
  },
];

const summary: RetentionSummaryDto = {
  backlogLimit: 3,
  cards: [
    {
      claimedAt: null,
      createdAt: '2026-05-15T02:00:00.000Z',
      dayKey: '2026-05-15',
      id: 'card-1',
      reward: { iron: 120, stone: 120, type: 'RESOURCES', wood: 120 },
      rewardVillageId: null,
      status: 'CLAIMABLE',
      tasks: [
        {
          completedAt: '2026-05-15T08:00:00.000Z',
          id: 'task-1',
          label: 'Former 5 unités',
          progress: 5,
          target: 5,
          type: 'TRAIN_UNITS',
        },
      ],
      worldId: 'w1',
    },
  ],
  claimableCount: 1,
  currentDayKey: '2026-05-15',
  defaultRewardVillageId: 'v1',
  oyez: {
    description: 'Les éclaireurs rapportent plus vite les mouvements proches.',
    endsAt: '2026-05-16T02:00:00.000Z',
    id: 'oyez-1',
    startsAt: '2026-05-15T02:00:00.000Z',
    theme: 'SCOUTING',
    title: 'Oeil du Guet',
    worldId: 'w1',
  },
  worldId: 'w1',
};

describe('DailyRetentionWidget', () => {
  it('opens the daily sheet from a claimable badge and claims on the selected village', () => {
    const onClaim = vi.fn();

    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={onClaim}
        onNavigate={vi.fn()}
        summary={summary}
        villages={villages}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Devoir royal, 1 carte à réclamer/i }));

    expect(screen.getByText('Devoir royal')).toBeInTheDocument();
    expect(screen.getByText('Oeil du Guet')).toBeInTheDocument();
    expect(screen.getAllByText('15 mai').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Village récompensé'), {
      target: { value: 'v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Récupérer' }));

    expect(onClaim).toHaveBeenCalledWith({ cardId: 'card-1', villageId: 'v2' });
  });

  it('closes the daily sheet when clicking the backdrop', () => {
    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={summary}
        villages={villages}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Devoir royal, 1 carte à réclamer/i }));
    expect(screen.getByText('Devoir royal')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('daily-retention-backdrop'));

    expect(screen.queryByText('Devoir royal')).not.toBeInTheDocument();
  });
});
