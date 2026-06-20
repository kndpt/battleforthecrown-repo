import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { queryKeys, type CombatReportDto } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useUiStore } from '@/stores/ui';
import { useDefeatCarouselHydration } from './useDefeatCarouselHydration';

const USER = 'defender-1';
const WORLD = 'world-1';

function reportFixture(overrides: Partial<CombatReportDto>): CombatReportDto {
  return {
    id: 'r-1',
    worldId: WORLD,
    attackerVillageId: 'a-1',
    attackerUserId: 'attacker-1',
    defenderVillageId: 'v-lost',
    defenderVillageName: 'Cravia',
    defenderX: 12,
    defenderY: 34,
    defenderUserId: USER,
    targetKind: 'PLAYER_VILLAGE',
    targetX: 12,
    targetY: 34,
    loot: {},
    totalUnitsAttacker: {},
    totalUnitsDefender: {},
    lossesAttacker: {},
    lossesDefender: {},
    details: {
      captureFinalized: {
        villageId: 'v-lost',
        villageName: 'Cravia',
        newOwnerName: 'Roi Ennemi',
        castleLevel: 6,
        outcome: 'COMPLETED',
      },
    },
    isRead: false,
    isAttacker: false,
    recipientRole: 'defender',
    timestamp: '2026-06-20T00:00:00.000Z',
    createdAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  };
}

function renderWithReports(reports: CombatReportDto[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.combatReports(USER, WORLD), reports);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useDefeatCarouselHydration(), { wrapper });
}

beforeEach(() => {
  useUiStore.getState().clearDefeatItems();
  useAuthStore.getState().setSession({
    accessToken: 'a',
    refreshToken: 'r',
    user: { id: USER, displayName: 'Defender' },
  });
  useGameStore.getState().setContext({ worldId: WORLD, villageId: 'v-other' });
});

describe('useDefeatCarouselHydration', () => {
  it('rebuilds the carousel from unread defender captureFinalized reports', () => {
    renderWithReports([reportFixture({})]);
    const items = useUiStore.getState().defeatItems;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      villageId: 'v-lost',
      villageName: 'Cravia',
      newOwnerName: 'Roi Ennemi',
      castleLevel: 6,
      reportId: 'r-1',
      x: 12,
      y: 34,
    });
  });

  it('ignores read reports, the attacker side, and non-capture reports', () => {
    renderWithReports([
      reportFixture({ id: 'r-read', isRead: true }),
      reportFixture({ id: 'r-attacker', recipientRole: 'attacker' }),
      reportFixture({ id: 'r-plain', details: {} }),
    ]);
    expect(useUiStore.getState().defeatItems).toHaveLength(0);
  });

  it('dedups with a live WS item by villageId and backfills the reportId', () => {
    // Simulate the live `village.conquered` event arriving first (no reportId).
    useUiStore.getState().pushDefeatItem({
      villageId: 'v-lost',
      villageName: 'Cravia',
      x: 12,
      y: 34,
      newOwnerName: 'Roi Ennemi',
      castleLevel: 6,
    });
    expect(useUiStore.getState().defeatItems[0].reportId).toBeUndefined();

    renderWithReports([reportFixture({})]);

    const items = useUiStore.getState().defeatItems;
    expect(items).toHaveLength(1);
    expect(items[0].reportId).toBe('r-1');
  });
});
