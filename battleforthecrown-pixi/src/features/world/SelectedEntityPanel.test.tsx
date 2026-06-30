import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { apiClient } from "@/api";
import type { MapEntity } from "@/api/world-types";
import type { OpenConquestDto } from "@battleforthecrown/shared/combat";
import type { VillageIntelDto } from "@battleforthecrown/shared/world";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { SelectedEntityPanel } from "./SelectedEntityPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
        onScout={() => undefined}
        onGoToVillage={overrides.onGoToVillage}
        onCaravan={overrides.onCaravan}
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const enemyVillage: MapEntity = {
  id: "v-enemy",
  kind: "PLAYER_VILLAGE",
  isMine: false,
  x: 5,
  y: 10,
  name: "Roc-d-Acier",
  ownerDisplayName: "Sire Kelvin",
  ownerId: "u-foreign",
  tier: null,
};

// seenAt = 30 min ago → "il y a 30mn", fresh = true (<1h)
const intelDto: VillageIntelDto = {
  targetVillageId: "v-enemy",
  worldId: "w1",
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

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks();
  useGameStore.setState({ worldId: null });
  useAuthStore.setState({ user: null });
});

// ---------------------------------------------------------------------------
// describe: owned village (mine)
// ---------------------------------------------------------------------------

describe("owned village (mine)", () => {
  it("1. troupes natives + renforts incoming → header Armée + total 20 unités + boutons enabled", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/army/village-1/inventory")
        return [{ id: "m-1", type: "MILITIA", quantity: 12, populationCost: 1 }];
      if (path === "/combat/village-1/garrison")
        return [
          {
            direction: "INCOMING",
            hostVillageName: "Boisjoli",
            originVillageId: "origin-1",
            originVillageName: "Origin",
            quantity: 8,
            unitType: "MILITIA",
            villageId: "village-1",
          },
        ];
      if (path === "/power/village/village-1/public")
        return { villageId: "village-1", buildings: 500 };
      throw new Error(`Unexpected GET ${path}`);
    });

    const onGoToVillage = vi.fn();
    renderPanel(playerVillage(), "another-village", { onGoToVillage });

    // header section Armée
    expect(await screen.findByText("Armée")).toBeInTheDocument();
    // total = 12 + 8 = 20
    expect(screen.getByText("20 unités")).toBeInTheDocument();
    // footer bouton Entrer enabled (isOtherOwned = true, onGoToVillage fourni)
    expect(screen.getByRole("button", { name: /Entrer/ })).toBeEnabled();
    // footer bouton Renfort présent et enabled
    expect(screen.getByRole("button", { name: /Renfort/ })).toBeEnabled();
  });

  it("2. clic Entrer sur village inactif → onGoToVillage appelé avec {id:'village-1'}", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/army/village-1/inventory") return [];
      if (path === "/combat/village-1/garrison") return [];
      if (path === "/power/village/village-1/public")
        return { villageId: "village-1", buildings: 500 };
      throw new Error(`Unexpected GET ${path}`);
    });

    const onGoToVillage = vi.fn();
    renderPanel(playerVillage(), "another-village", { onGoToVillage });

    const btn = await screen.findByRole("button", { name: /Entrer/ });
    fireEvent.click(btn);

    expect(onGoToVillage).toHaveBeenCalledWith(
      expect.objectContaining({ id: "village-1" }),
    );
  });

  it("3. village actif (currentVillageId='village-1') → boutons Entrer/Renfort/Envoyer disabled", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/army/village-1/inventory") return [];
      if (path === "/combat/village-1/garrison") return [];
      if (path === "/power/village/village-1/public")
        return { villageId: "village-1", buildings: 500 };
      throw new Error(`Unexpected GET ${path}`);
    });

    const onGoToVillage = vi.fn();
    renderPanel(playerVillage(), "village-1", { onGoToVillage });

    // isOtherOwned = false → onEnter undefined → disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Entrer/ })).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: /Renfort/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Envoyer ressources/ })).toBeDisabled();
  });

  it("4. village vide owned → dossier armée vide OK, bouton Entrer rendu", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/army/village-1/inventory") return [];
      if (path === "/combat/village-1/garrison") return [];
      if (path === "/power/village/village-1/public")
        return { villageId: "village-1", buildings: 500 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(playerVillage(), "another-village", { onGoToVillage: vi.fn() });

    // Le dossier Armée n'affiche rien quand army=[] dans FullIntelPanel
    // Pas de "Aucune troupe" (c'est l'ancien DOM supprimé)
    await waitFor(() => {
      expect(screen.queryByText("Aucune troupe")).not.toBeInTheDocument();
    });
    // Le bouton Entrer est bien rendu (footer mine toujours présent)
    expect(screen.getByRole("button", { name: /Entrer/ })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// describe: enemy player
// ---------------------------------------------------------------------------

describe("enemy player", () => {
  beforeEach(() => {
    useGameStore.setState({ worldId: "w1" });
  });

  it("5. unscouted (intel null) → tag Joueur, 'Village non espionné', power 880, boutons Espionner+Attaquer", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 880 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(enemyVillage, "v-mine");

    expect(await screen.findByText("Village non espionné")).toBeInTheDocument();
    // TypeTag "Joueur"
    expect(screen.getByText("Joueur")).toBeInTheDocument();
    // display name
    expect(screen.getByText("Sire Kelvin")).toBeInTheDocument();
    // power bâtiments (la query s'est settlée puisque findByText a résolu)
    expect(await screen.findByText("880")).toBeInTheDocument();
    // footer
    expect(screen.getByRole("button", { name: /Espionner/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Attaquer/ })).toBeInTheDocument();
  });

  it("6. unscouted → power public visible, endpoints armée jamais appelés, pas de dossier armée", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (path) => {
        if (path === "/worlds/w1/intel/v-enemy") return null;
        if (path === "/power/village/v-enemy/public")
          return { villageId: "v-enemy", buildings: 880 };
        throw new Error(`Unexpected GET ${path}`);
      });

    renderPanel(enemyVillage, "v-mine");

    expect(await screen.findByText("880")).toBeInTheDocument();
    // "Armée" est présent dans le texte UnscoutedPanel ("Armée, butin et défenses inconnus…")
    // mais PAS comme header du dossier FullIntelPanel (qui n'est pas rendu en unscouted).
    // On vérifie l'absence du résumé troupes "X unités" qui signale le dossier armée complet.
    expect(screen.queryByText(/unités/)).not.toBeInTheDocument();
    // endpoints troupes jamais appelés
    const paths = getSpy.mock.calls.map((call) => call[0]);
    expect(paths).not.toContain("/army/v-enemy/inventory");
    expect(paths).not.toContain("/combat/v-enemy/garrison");
  });

  it("previews the PvP capture window from the castle level on an enemy village", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 880 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel({ ...enemyVillage, castleLevel: 7 }, "v-mine");

    expect(await screen.findByText("Fenêtre de capture")).toBeInTheDocument();
    expect(screen.getByText("3h")).toBeInTheDocument();
  });

  it("hides the capture preview while a capture is already active", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 880 };
      throw new Error(`Unexpected GET ${path}`);
    });
    const activeCapture: OpenConquestDto = {
      attackerVillageId: "origin-village",
      attackerVillageName: "Royaume de dupont.kelvin",
      captureStartedAt: "2026-06-03T11:30:00.000Z",
      captureUntil: "2026-06-03T12:30:00.000Z",
      pendingConquestId: "pc-1",
      status: "OPEN",
      targetCastleLevel: 7,
      targetKind: "PLAYER_VILLAGE",
      targetName: "enemy",
      targetTier: null,
      targetVillageId: "v-enemy",
      targetX: 1,
      targetY: 2,
    };

    renderPanel({ ...enemyVillage, castleLevel: 7 }, "v-mine", { activeCapture });

    expect(await screen.findByText("880")).toBeInTheDocument();
    expect(screen.queryByText("Fenêtre de capture")).not.toBeInTheDocument();
  });

  it("7. scouted (intelDto) → style 'Forteresse', mur 'Niv. 3', loot '100', freshness 'il y a', bouton rapport", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return intelDto;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 300 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(enemyVillage, "v-mine");

    // style
    expect(await screen.findByText("Forteresse")).toBeInTheDocument();
    // mur
    expect(screen.getByText("Niv. 3")).toBeInTheDocument();
    // loot wood = 100
    expect(screen.getByText("100")).toBeInTheDocument();
    // freshness "il y a 30mn" (seenAt = 30 min ago)
    expect(screen.getByText(/il y a/)).toBeInTheDocument();
    // bouton rapport
    const reportBtn = screen.getByRole("button", { name: "Voir rapport source" });
    expect(reportBtn).toBeInTheDocument();

    // Clic → ouverture du modal rapport SCOUT (intelDto.sourceKind === "SCOUT"
    // doit router vers reportKind 'scout', pas combat).
    fireEvent.click(reportBtn);
    expect(await screen.findByText("Rapport scout")).toBeInTheDocument();
  });

  it("8. ratio ÷3 bloqué (defender 100 vs attacker 3000, unscouted) → bouton Attaquer disabled + texte 'Puissance trop faible'", async () => {
    useAuthStore.setState({ user: { id: "me", displayName: "Moi" } });
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 200 };
      if (path === "/power/kingdom")
        return {
          userId: "me",
          kingdomPower: 3000,
          villageCount: 1,
          villages: [],
          totalBuildings: 3000,
          totalArmy: 0,
        };
      if (path === "/power/kingdom/u-foreign/public")
        return { userId: "u-foreign", kingdomPower: 100 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(enemyVillage, "v-mine");

    // Attendre que les deux queries power se settlent et que le bouton devienne disabled
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Attaquer/ });
      expect(btn).toBeDisabled();
    });
    // message bloqué
    expect(screen.getByText(/Puissance trop faible/)).toBeInTheDocument();
  });

  it("9. ratio OK (defender 1000 vs 3000) → bouton Attaquer enabled", async () => {
    useAuthStore.setState({ user: { id: "me", displayName: "Moi" } });
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 200 };
      if (path === "/power/kingdom")
        return {
          userId: "me",
          kingdomPower: 3000,
          villageCount: 1,
          villages: [],
          totalBuildings: 3000,
          totalArmy: 0,
        };
      if (path === "/power/kingdom/u-foreign/public")
        return { userId: "u-foreign", kingdomPower: 1000 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(enemyVillage, "v-mine");

    await screen.findByText("Village non espionné");
    const btn = screen.getByRole("button", { name: /^Attaquer$/ });
    expect(btn).toBeEnabled();
  });

  it("10. shield actif (newbieShield active, enemy, unscouted) → Attaquer disabled + texte /Bouclier débutant/", async () => {
    useGameStore.setState({ worldId: "w1" });
    const shieldedEnemy: MapEntity = {
      ...enemyVillage,
      newbieShield: {
        active: true,
        endsAt: new Date(Date.now() + 48 * 3_600_000).toISOString(),
        brokenAt: null,
      },
    };

    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 400 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(shieldedEnemy, "v-mine");

    await screen.findByText("Village non espionné");
    const btn = screen.getByRole("button", { name: /Attaquer/ });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Bouclier débutant/)).toBeInTheDocument();
  });

  it("12. village joueur tiers → badge niveau de Renommée sur l'avatar (public-profile)", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 880 };
      if (path === "/worlds/w1/users/u-foreign/public-profile")
        return {
          userId: "u-foreign",
          displayName: "Sire Kelvin",
          kingdomPower: 1234,
          renownLevel: 12,
          newbieShield: null,
          inactivity: null,
        };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(enemyVillage, "v-mine");

    expect(await screen.findByLabelText("Niveau 12")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// describe: barbarian
// ---------------------------------------------------------------------------

describe("barbarian", () => {
  beforeEach(() => {
    useGameStore.setState({ worldId: "w1" });
  });

  it("11. kind BARBARIAN_VILLAGE tier T3 → label 'Garnison', médaillon 'T3', boutons Espionner+Attaquer", async () => {
    const barb: MapEntity = {
      id: "barb-1",
      kind: "BARBARIAN_VILLAGE",
      isMine: false,
      x: 30,
      y: 40,
      name: "Camp barbare",
      tier: "T3",
    };

    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/barb-1") return null;
      if (path === "/power/village/barb-1/public")
        return { villageId: "barb-1", buildings: 600 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(barb, "v-mine");

    // label T3 = "Garnison" (TIER_META)
    expect(await screen.findByText("Garnison")).toBeInTheDocument();
    // médaillon T3 (et l'échelle en contient aussi, donc au moins 1)
    expect(screen.getAllByText("T3").length).toBeGreaterThanOrEqual(1);
    // footer
    expect(screen.getByRole("button", { name: /Espionner/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Attaquer/ })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// describe: CTA « Voir le profil » (fiche publique joueur tiers)
// ---------------------------------------------------------------------------

describe("public profile CTA", () => {
  beforeEach(() => {
    useGameStore.setState({ worldId: "w1" });
  });

  it("enemy player village → CTA « Voir le profil » présent + clic ouvre la fiche", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/v-enemy") return null;
      if (path === "/power/village/v-enemy/public")
        return { villageId: "v-enemy", buildings: 880 };
      if (path === "/worlds/w1/users/u-foreign/public-profile")
        return {
          userId: "u-foreign",
          displayName: "Sire Kelvin",
          kingdomPower: 1234,
          newbieShield: null,
        };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(enemyVillage, "v-mine", { currentUserId: "me" });

    const cta = await screen.findByRole("button", { name: /Voir le profil/ });
    fireEvent.click(cta);

    // La sheet s'ouvre réellement (câblage onViewProfile → PublicPlayerProfileSheet).
    expect(await screen.findByText("Profil du joueur")).toBeInTheDocument();
  });

  it("own village (mine) → CTA absent", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/army/village-1/inventory") return [];
      if (path === "/combat/village-1/garrison") return [];
      if (path === "/power/village/village-1/public")
        return { villageId: "village-1", buildings: 500 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(playerVillage(), "another-village", {
      currentUserId: "me",
      onGoToVillage: vi.fn(),
    });

    await screen.findByRole("button", { name: /Entrer/ });
    expect(
      screen.queryByRole("button", { name: /Voir le profil/ }),
    ).not.toBeInTheDocument();
  });

  it("barbarian village → CTA absent", async () => {
    const barb: MapEntity = {
      id: "barb-1",
      kind: "BARBARIAN_VILLAGE",
      isMine: false,
      x: 30,
      y: 40,
      name: "Camp barbare",
      tier: "T3",
    };
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/intel/barb-1") return null;
      if (path === "/power/village/barb-1/public")
        return { villageId: "barb-1", buildings: 600 };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel(barb, "v-mine", { currentUserId: "me" });

    await screen.findByText("Garnison");
    expect(
      screen.queryByRole("button", { name: /Voir le profil/ }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// describe: intel — isMine ne déclenche jamais l'endpoint intel
// ---------------------------------------------------------------------------

describe("intel endpoint isolation", () => {
  beforeEach(() => {
    useGameStore.setState({ worldId: "w1" });
  });

  it("12. isMine → endpoint intel jamais appelé, pas de section scouted", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockImplementation(async (path) => {
        if (path === "/army/village-1/inventory") return [];
        if (path === "/combat/village-1/garrison") return [];
        if (path === "/power/village/village-1/public")
          return { villageId: "village-1", buildings: 200 };
        throw new Error(`Unexpected GET ${path}`);
      });

    renderPanel(playerVillage(), "another-village", { onGoToVillage: vi.fn() });

    // attendre que les queries se posent
    await screen.findByRole("button", { name: /Entrer/ });

    // endpoint intel jamais appelé
    const paths = getSpy.mock.calls.map((call) => call[0]);
    expect(paths).not.toContain("/worlds/w1/intel/village-1");
    // pas de contenu scouted (Forteresse, Niv., Voir rapport)
    expect(screen.queryByText("Forteresse")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voir rapport source" })).not.toBeInTheDocument();
  });
});
