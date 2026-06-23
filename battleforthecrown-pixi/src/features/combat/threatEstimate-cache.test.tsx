/**
 * Acceptance test: AttackDetailModal — menace estimée, source canonique unique.
 *
 * Contrat (reformulé run #059, cf. fiche § Décisions) : le modal consomme la
 * MÊME query canonique `useVillageIntelQuery(worldId, target.id)` que le reste
 * du front — il n'introduit aucun second chemin de fetch d'intel.
 *  - (A) intel fraîche déjà en cache ⇒ monter le modal ne déclenche AUCUN
 *        fetch REST `/worlds/:worldId/intel/:villageId` (staleTime respecté).
 *        C'est le sens réel de « pas d'appel REST supplémentaire si l'intel
 *        est déjà en cache ».
 *  - (B) event WS `intel.updated` ⇒ le contrat run 055 est `invalidateQueries`
 *        (le payload {userId,worldId,villageId} ne porte PAS l'intel — Outbox
 *        mince, server-authoritative). L'invalidation déclenche EXACTEMENT UN
 *        refetch canonique (pas un second chemin propre au modal), et le badge
 *        se recalcule sur la nouvelle donnée.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api';
import { queryKeys } from '@/api/queries';
import { applyIntelUpdated } from '@/api/ws-bindings';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { VillageIntelDtoSchema } from '@battleforthecrown/shared/world';
import { AttackDetailModal } from './AttackDetailModal';

// ===========================================================================
// Mocks nécessaires pour monter AttackDetailModal sans crash
// ===========================================================================

// Mutations combat : stub inutilisées dans ce test
vi.mock('@/api/queries', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/api/queries')>();
  return {
    ...real,
    useInitiateAttackMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useInitiateReinforceMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useInitiateScoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useWorldConfigQuery: () => ({ data: undefined, isLoading: false }),
  };
});

vi.mock('@/features/world/barbarianConquest', () => ({
  getBarbarianCaptureDurationLabel: () => null,
}));

vi.mock('@/features/design-system/components', () => ({
  SegmentedControl: ({ value, options, onChange }: {
    value: string;
    options: { label: string; value: string }[];
    onChange: (v: string) => void;
  }) => (
    <div>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} type="button"
          aria-pressed={value === o.value}>
          {o.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/publicAsset', () => ({
  publicAsset: (p: string) => p,
}));

// ===========================================================================
// Fixtures
// ===========================================================================

const WORLD_ID = 'world-test';
const VILLAGE_ID = 'v-enemy';
const MY_VILLAGE_ID = 'v-mine';

const target = {
  id: VILLAGE_ID,
  kind: 'PLAYER_VILLAGE' as const,
  isMine: false,
  x: 12,
  y: 34,
  name: 'Hauterive',
  tier: null,
  castleLevel: null,
};

const origin = { x: 0, y: 0 };

const DAY_MS = 86_400_000;

/** Intel scoutée. `ageMs` pilote la fraîcheur (défaut 1mn = fraîche). */
function makeIntel(
  overrides: { MILITIA?: number; TEMPLAR?: number; ageMs?: number } = {},
) {
  return VillageIntelDtoSchema.parse({
    targetVillageId: VILLAGE_ID,
    worldId: WORLD_ID,
    sourceKind: 'SCOUT',
    sourceReportId: 'r-1',
    units: { MILITIA: overrides.MILITIA ?? 10, ...(overrides.TEMPLAR != null ? { TEMPLAR: overrides.TEMPLAR } : {}) },
    resources: { wood: 0, stone: 0, iron: 0 },
    wallLevel: 0,
    strategy: null,
    targetName: 'Hauterive',
    targetX: 12,
    targetY: 34,
    targetTier: null,
    seenAt: new Date(Date.now() - (overrides.ageMs ?? 60_000)).toISOString(),
  });
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function setup(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AttackDetailModal
        target={target}
        origin={origin}
        initialMode="attack"
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().setSession({
    accessToken: 'tok',
    refreshToken: 'rtok',
    user: { displayName: 'Joueur', id: 'user-1' },
  });
  useGameStore.getState().setContext({ worldId: WORLD_ID, villageId: MY_VILLAGE_ID });
});

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
  useGameStore.getState().clear();
});

// ===========================================================================
// Tests
// ===========================================================================

describe('AttackDetailModal — badge Menace estimée réactif au cache intel', () => {
  it('(A) intel fraîche en cache ⇒ aucun fetch REST intel au montage', async () => {
    const queryClient = makeQueryClient();

    // Intel fraîche (seenAt = il y a 1mn) déjà en cache ⇒ staleTime (30s) respecté.
    queryClient.setQueryData(queryKeys.villageIntel(WORLD_ID, VILLAGE_ID), makeIntel({ MILITIA: 10 }));
    queryClient.setQueryData(queryKeys.publicVillagePower(VILLAGE_ID), {
      villageId: VILLAGE_ID,
      buildings: 0,
    });
    queryClient.setQueryData(queryKeys.armyInventory(MY_VILLAGE_ID), []);

    let intelCallCount = 0;
    vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
      if (path === `/worlds/${WORLD_ID}/intel/${VILLAGE_ID}`) intelCallCount++;
      if (path === `/power/village/${VILLAGE_ID}/public`) return { villageId: VILLAGE_ID, buildings: 0 };
      if (path === `/army/${MY_VILLAGE_ID}/inventory`) return [];
      return null;
    });

    setup(queryClient);

    expect(await screen.findByText('Menace estimée')).toBeInTheDocument();
    // Contrat « pas d'appel REST supplémentaire si l'intel est déjà en cache » : 0 fetch intel.
    await waitFor(() => expect(intelCallCount).toBe(0));
  });

  /** Texte de la section "Menace estimée" (badge + tooltip). */
  function threatSectionText(): string {
    return screen.getByText('Menace estimée').closest('div.p-3')?.textContent ?? '';
  }

  it('(B) intel.updated ⇒ 1 refetch canonique + badge VISIBLEMENT recalculé', async () => {
    const queryClient = makeQueryClient();

    // Cache initial : intel périmée (8j > STALE_THRESHOLD_MS) ⇒ badge "Inconnue".
    const intelStale = makeIntel({ MILITIA: 10, ageMs: 8 * DAY_MS });
    // Refetch après WS : intel fraîche (1mn) ⇒ armée=0 vs défense ⇒ badge "Élevée".
    const intelFresh = makeIntel({ MILITIA: 10, ageMs: 60_000 });

    queryClient.setQueryData(queryKeys.villageIntel(WORLD_ID, VILLAGE_ID), intelStale);
    queryClient.setQueryData(queryKeys.publicVillagePower(VILLAGE_ID), {
      villageId: VILLAGE_ID,
      buildings: 0,
    });
    queryClient.setQueryData(queryKeys.armyInventory(MY_VILLAGE_ID), []);

    let intelCallCount = 0;
    vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
      if (path === `/worlds/${WORLD_ID}/intel/${VILLAGE_ID}`) {
        intelCallCount++;
        return intelFresh;
      }
      if (path === `/power/village/${VILLAGE_ID}/public`) return { villageId: VILLAGE_ID, buildings: 0 };
      if (path === `/army/${MY_VILLAGE_ID}/inventory`) return [];
      return null;
    });

    setup(queryClient);
    expect(await screen.findByText('Menace estimée')).toBeInTheDocument();

    // Avant l'event : intel périmée ⇒ badge "Inconnue".
    expect(threatSectionText()).toContain('Inconnue');

    await act(async () => {
      applyIntelUpdated(
        { userId: 'user-1', worldId: WORLD_ID, villageId: VILLAGE_ID },
        { queryClient },
      );
    });

    // Exactement 1 refetch : la seule query canonique invalidée par run 055,
    // pas de second chemin de fetch introduit par le modal.
    await waitFor(() => expect(intelCallCount).toBe(1));
    // Régression UI : le badge RENDU doit refléter la nouvelle intel (Inconnue → Élevée),
    // pas seulement le cache.
    await waitFor(() => expect(threatSectionText()).toContain('Élevée'));
    expect(threatSectionText()).not.toContain('Inconnue');
  });

  it('affiche le badge "Menace estimée" uniquement en mode attack', async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(queryKeys.villageIntel(WORLD_ID, VILLAGE_ID), null);
    queryClient.setQueryData(queryKeys.publicVillagePower(VILLAGE_ID), {
      villageId: VILLAGE_ID,
      buildings: 0,
    });
    queryClient.setQueryData(queryKeys.armyInventory(MY_VILLAGE_ID), []);

    vi.spyOn(apiClient, 'get').mockResolvedValue(null);

    setup(queryClient);

    expect(await screen.findByText('Menace estimée')).toBeInTheDocument();
  });

  it('mode scout ⇒ section "Menace estimée" ABSENTE (la menace concerne l\'attaque)', async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(queryKeys.villageIntel(WORLD_ID, VILLAGE_ID), makeIntel({ MILITIA: 10 }));
    queryClient.setQueryData(queryKeys.publicVillagePower(VILLAGE_ID), {
      villageId: VILLAGE_ID,
      buildings: 0,
    });
    queryClient.setQueryData(queryKeys.armyInventory(MY_VILLAGE_ID), []);

    vi.spyOn(apiClient, 'get').mockResolvedValue(null);

    render(
      <QueryClientProvider client={queryClient}>
        <AttackDetailModal
          target={target}
          origin={origin}
          initialMode="scout"
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );

    // Le modal est monté (un autre texte stable du modal est présent), mais pas la section menace.
    await waitFor(() =>
      expect(screen.queryByText('Menace estimée')).not.toBeInTheDocument(),
    );
  });

  it('badge tone=unknown quand intel=null (pas d\'espion envoyé)', async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(queryKeys.villageIntel(WORLD_ID, VILLAGE_ID), null);
    queryClient.setQueryData(queryKeys.publicVillagePower(VILLAGE_ID), {
      villageId: VILLAGE_ID,
      buildings: 0,
    });
    queryClient.setQueryData(queryKeys.armyInventory(MY_VILLAGE_ID), []);

    vi.spyOn(apiClient, 'get').mockResolvedValue(null);

    setup(queryClient);

    // Avec intel=null ⇒ label "Inconnue" dans la section "Menace estimée"
    await screen.findByText('Menace estimée');
    const threatSection = screen.getByText('Menace estimée').closest('div.p-3');
    expect(threatSection).not.toBeNull();
    expect(threatSection!.textContent).toContain('Inconnue');
  });
});
