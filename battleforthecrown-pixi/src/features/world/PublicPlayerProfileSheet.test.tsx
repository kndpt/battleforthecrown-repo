import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api";
import { PublicPlayerProfileSheet } from "./PublicPlayerProfileSheet";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderSheet() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <PublicPlayerProfileSheet
        userId="u-foreign"
        worldId="w1"
        onClose={() => undefined}
      />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PublicPlayerProfileSheet", () => {
  it("shield actif → badge bouclier + timer visibles, nom + puissance affichés", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/users/u-foreign/public-profile")
        return {
          userId: "u-foreign",
          displayName: "Sire Kelvin",
          kingdomPower: 1234,
          renownLevel: 7,
          newbieShield: {
            active: true,
            endsAt: new Date(Date.now() + 47 * 3_600_000).toISOString(),
          },
          inactivity: null,
        };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderSheet();

    expect(await screen.findByText("Sire Kelvin")).toBeInTheDocument();
    expect(screen.getByText("1 234")).toBeInTheDocument();
    expect(screen.getByText("Bouclier débutant")).toBeInTheDocument();
    // tooltip aria-label de NewbieShieldIcon
    expect(
      screen.getByLabelText(/Protection débutant/),
    ).toBeInTheDocument();
  });

  it("shield null → section bouclier masquée", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/users/u-foreign/public-profile")
        return {
          userId: "u-foreign",
          displayName: "Sire Kelvin",
          kingdomPower: 1234,
          renownLevel: 7,
          newbieShield: null,
          inactivity: null,
        };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderSheet();

    expect(await screen.findByText("Sire Kelvin")).toBeInTheDocument();
    expect(screen.queryByText("Bouclier débutant")).not.toBeInTheDocument();
  });

  it("inactivity INACTIVE → badge gris « Inactif depuis N j » affiché", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/users/u-foreign/public-profile")
        return {
          userId: "u-foreign",
          displayName: "Sire Kelvin",
          kingdomPower: 1234,
          renownLevel: 7,
          newbieShield: null,
          inactivity: { state: "INACTIVE", sinceDays: 9 },
        };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderSheet();

    expect(await screen.findByText("Sire Kelvin")).toBeInTheDocument();
    expect(screen.getByText("Inactif depuis 9 j")).toBeInTheDocument();
  });

  it("inactivity null → aucun badge d'inactivité", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (path) => {
      if (path === "/worlds/w1/users/u-foreign/public-profile")
        return {
          userId: "u-foreign",
          displayName: "Sire Kelvin",
          kingdomPower: 1234,
          renownLevel: 7,
          newbieShield: null,
          inactivity: null,
        };
      throw new Error(`Unexpected GET ${path}`);
    });

    renderSheet();

    expect(await screen.findByText("Sire Kelvin")).toBeInTheDocument();
    expect(screen.queryByText(/Inactif depuis/)).not.toBeInTheDocument();
  });
});
