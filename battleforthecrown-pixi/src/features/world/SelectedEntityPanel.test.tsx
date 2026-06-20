import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { apiClient } from "@/api";
import type { MapEntity } from "@/api/world-types";
import type { VillageIntelDto } from "@battleforthecrown/shared/world";
import type { OpenConquestDto } from "@battleforthecrown/shared/combat";
import { useGameStore } from "@/stores/game";
import { SelectedEntityPanel } from "./SelectedEntityPanel";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderPanel(
  entity: MapEntity,
  currentVillageId = "active-village",
  overrides: Partial<ComponentProps<typeof SelectedEntityPanel>> = {},
) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <SelectedEntityPanel
        currentVillageId={currentVillageId}
        entity={entity}
        onAttack={() => undefined}
        {...overrides}
      />
    </QueryClientProvider>,
  );
}

function playerVillage(overrides: Partial<MapEntity> = {}): MapEntity {
  return {
    id: "village-1",
    isMine: true,
    kind: "PLAYER_VILLAGE",
    name: "Boisjoli",
    tier: null,
    x: 10,
    y: 20,
    ...overrides,
  };
}

function mockTroopApi({
  garrison = [],
  inventory = [],
}: {
  garrison?: unknown[];
  inventory?: unknown[];
}) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
    if (path === "/army/village-1/inventory") return inventory;
    if (path === "/combat/village-1/garrison") return garrison;
    if (path === "/power/village/village-1/public")
      return { villageId: "village-1", buildings: 500 };
    throw new Error(`Unexpected GET ${path}`);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("SelectedEntityPanel owned village troops", () => {
  it("shows native troops plus incoming reinforcements on an owned inactive village", async () => {
    mockTroopApi({
      inventory: [
        { id: "militia-1", type: "MILITIA", quantity: 12, populationCost: 1 },
      ],
      garrison: [
        {
          direction: "INCOMING",
          hostVillageName: "Boisjoli",
          originVillageId: "origin-1",
          originVillageName: "Origin",
          quantity: 8,
          unitType: "MILITIA",
          villageId: "village-1",
        },
      ],
    });

    renderPanel(playerVillage(), "another-village");

    expect(await screen.findByText("Milice de paysans")).toBeInTheDocument();
    expect(screen.getByText("Troupes présentes")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Renforcer/i }),
    ).toBeInTheDocument();
  });

  it("shows a go-to action on an owned inactive village", async () => {
    const onGoToVillage = vi.fn();
    mockTroopApi({});

    renderPanel(playerVillage(), "another-village", { onGoToVillage });

    const button = await screen.findByRole("button", {
      name: /Aller à ce village/i,
    });
    fireEvent.click(button);

    expect(onGoToVillage).toHaveBeenCalledWith(
      expect.objectContaining({ id: "village-1" }),
    );
  });

  it("shows troops on the active village without the reinforce action", async () => {
    mockTroopApi({
      inventory: [
        { id: "archer-1", type: "ARCHER", quantity: 4, populationCost: 1 },
      ],
    });

    renderPanel(playerVillage(), "village-1", { onGoToVillage: vi.fn() });

    expect(await screen.findByText("Archer")).toBeInTheDocument();
    expect(screen.getByText("Troupes présentes")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Renforcer/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Aller à ce village/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an explicit empty state for an owned empty village", async () => {
    mockTroopApi({});

    renderPanel(playerVillage());

    expect(await screen.findByText("Aucune troupe")).toBeInTheDocument();
  });

  it("shows the foreign owner display name in the callout subtitle", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/power/village/enemy-1/public")
        return { villageId: "enemy-1", buildings: 880 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(
      playerVillage({
        id: "enemy-1",
        isMine: false,
        name: "Royaume de helper.brutom",
        ownerDisplayName: "Sire Kelvin",
        ownerId: "u-foreign",
      }),
      "village-1",
    );

    expect(
      await screen.findByText("Sire Kelvin · Village joueur"),
    ).toBeInTheDocument();
    expect(screen.getByText("Royaume de helper.brutom")).toBeInTheDocument();
  });

  it("shows building power but never troops for a village the player does not own", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (path) => {
        if (path === "/power/village/enemy-1/public")
          return { villageId: "enemy-1", buildings: 880 };
        throw new Error(`Unexpected GET ${path}`);
      });

    renderPanel(playerVillage({ id: "enemy-1", isMine: false }), "village-1", {
      onGoToVillage: vi.fn(),
    });

    expect(await screen.findByText("880")).toBeInTheDocument();
    expect(screen.queryByText("Troupes présentes")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Aller à ce village/i }),
    ).not.toBeInTheDocument();
    // Building power is public; troop endpoints must never be queried for a foreign village.
    const paths = getSpy.mock.calls.map((call) => call[0]);
    expect(paths).not.toContain("/army/enemy-1/inventory");
    expect(paths).not.toContain("/combat/enemy-1/garrison");
  });

  it("shows capture details on a captured village without exposing troops", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00.000Z"));
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (path) => {
        if (path === "/power/village/enemy-1/public")
          return { villageId: "enemy-1", buildings: 880 };
        throw new Error(`Unexpected GET ${path}`);
      });
    const activeCapture: OpenConquestDto = {
      attackerVillageId: "origin-village",
      attackerVillageName: "Royaume de dupont.kelvin",
      captureStartedAt: "2026-06-03T11:30:00.000Z",
      captureUntil: "2026-06-03T12:30:00.000Z",
      pendingConquestId: "pc-1",
      status: "OPEN",
      targetCastleLevel: 10,
      targetKind: "PLAYER_VILLAGE",
      targetName: "Royaume de airstyle59",
      targetTier: null,
      targetVillageId: "enemy-1",
      targetX: 265,
      targetY: 241,
    };

    renderPanel(
      playerVillage({
        id: "enemy-1",
        isMine: false,
        name: "Royaume de airstyle59",
        x: 265,
        y: 241,
      }),
      "village-1",
      { activeCapture },
    );

    expect(screen.getByText("Capture")).toBeInTheDocument();
    expect(screen.getByText("Depuis")).toBeInTheDocument();
    expect(screen.getByText("Royaume de dupont.kelvin")).toBeInTheDocument();
    expect(screen.getByText("Écoulé")).toBeInTheDocument();
    expect(screen.getByText("Reste")).toBeInTheDocument();
    expect(screen.getAllByText("30m 00s")).toHaveLength(2);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.queryByText("Troupes présentes")).not.toBeInTheDocument();
    // Troop endpoints stay untouched for a foreign village, even mid-capture.
    const paths = getSpy.mock.calls.map((call) => call[0]);
    expect(paths).not.toContain("/army/enemy-1/inventory");
    expect(paths).not.toContain("/combat/enemy-1/garrison");
  });
});

// ---------------------------------------------------------------------------
// Intel section
// ---------------------------------------------------------------------------

const enemyVillage: MapEntity = {
  id: "v-enemy",
  kind: "PLAYER_VILLAGE",
  isMine: false,
  x: 5,
  y: 10,
  name: "Roc-d-Acier",
  tier: null,
};

const intelDto: VillageIntelDto = {
  targetVillageId: "v-enemy",
  worldId: "w-intel",
  sourceKind: "SCOUT",
  sourceReportId: "report-abc",
  units: { MILITIA: 5, ARCHER: 0 },
  resources: { wood: 100, stone: 50, iron: 25 },
  wallLevel: 3,
  strategy: "FORTRESS",
  targetName: "Roc-d-Acier",
  targetX: 5,
  targetY: 10,
  targetTier: null,
  seenAt: new Date(Date.now() - 30 * 60_000).toISOString(),
};

function renderEnemyPanel(entity: MapEntity) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <SelectedEntityPanel entity={entity} currentVillageId="v-mine" />
    </QueryClientProvider>,
  );
}

describe("SelectedEntityPanel intel section", () => {
  beforeEach(() => {
    useGameStore.getState().setWorld("w-intel");
  });

  afterEach(() => {
    useGameStore.getState().clear();
    vi.restoreAllMocks();
  });

  it("affiche la section \"Dernière intel\" avec l'âge observé quand l'intel est présente", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w-intel/intel/v-enemy") return intelDto;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 300 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderEnemyPanel(enemyVillage);

    expect(await screen.findByText("Observé")).toBeInTheDocument();
    expect(screen.getByText("Dernière intel")).toBeInTheDocument();
    expect(screen.getByText(/il y a/)).toBeInTheDocument();
  });

  it('affiche "Aucune intel" quand la query retourne null', async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w-intel/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 300 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderEnemyPanel(enemyVillage);

    expect(await screen.findByText("Dernière intel")).toBeInTheDocument();
    expect(screen.getByText("Aucune intel")).toBeInTheDocument();
  });

  it("n'affiche pas de section intel pour un village isMine", async () => {
    const myVil: MapEntity = {
      id: "v-mine",
      kind: "PLAYER_VILLAGE",
      isMine: true,
      x: 3,
      y: 7,
      name: "Ma Forteresse",
      tier: null,
    };

    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (path) => {
        if (path === "/army/v-mine/inventory") return [];
        if (path === "/combat/v-mine/garrison") return [];
        if (path === "/power/village/v-mine/public")
          return { villageId: "v-mine", buildings: 200 };
        throw new Error(`Unexpected GET ${path}`);
      });

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <SelectedEntityPanel
          entity={myVil}
          currentVillageId="other-village"
          onAttack={() => undefined}
        />
      </QueryClientProvider>,
    );

    // wait for async queries to settle
    await screen.findByText("Troupes présentes");

    expect(screen.queryByText("Dernière intel")).not.toBeInTheDocument();
    expect(screen.queryByText("Aucune intel")).not.toBeInTheDocument();

    // Intel endpoint must never be called for an owned village
    const paths = getSpy.mock.calls.map((call) => call[0]);
    expect(paths).not.toContain("/worlds/w-intel/intel/v-mine");
  });
});
