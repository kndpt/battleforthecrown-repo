import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { WorldFinalRankingsResponse } from "@battleforthecrown/shared/rankings";

const finalRankingsQueryMock = vi.fn();

vi.mock("@/api/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/queries")>();
  return {
    ...actual,
    useFinalRankingsQuery: () => finalRankingsQueryMock(),
  };
});

const { FinalRankingsScreen } = await import("./FinalRankingsScreen");

function renderScreen() {
  const router = createMemoryRouter(
    [
      {
        path: "/worlds/:worldId/rankings/final",
        element: <FinalRankingsScreen />,
      },
      { path: "/worlds", element: <div>worlds page</div> },
    ],
    { initialEntries: ["/worlds/w1/rankings/final"] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

const SNAPSHOT: WorldFinalRankingsResponse = {
  worldId: "w1",
  snapshotAt: "2026-06-01T00:00:00.000Z",
  leaderboards: [
    {
      worldId: "w1",
      signal: "POWER",
      period: "FINAL",
      label: "Puissance du Royaume",
      entries: [
        { rank: 1, userId: "u1", playerName: "Aldric", score: 5000 },
        { rank: 2, userId: "u2", playerName: "Berenice", score: 3200 },
      ],
    },
    {
      worldId: "w1",
      signal: "ASSAULT_GLORY",
      period: "FINAL",
      label: "Gloire d'Assaut",
      entries: [{ rank: 1, userId: "u3", playerName: "Cedric", score: 900 }],
    },
    {
      worldId: "w1",
      signal: "RAMPART_GLORY",
      period: "FINAL",
      label: "Gloire du Rempart",
      entries: [],
    },
  ],
};

describe("FinalRankingsScreen", () => {
  it("renders the three snapshotted leaderboards", () => {
    finalRankingsQueryMock.mockReturnValue({
      data: SNAPSHOT,
      isLoading: false,
      isError: false,
    });
    renderScreen();

    expect(screen.getByText("Puissance du Royaume")).toBeInTheDocument();
    expect(screen.getByText("Gloire d'Assaut")).toBeInTheDocument();
    expect(screen.getByText("Gloire du Rempart")).toBeInTheDocument();
    expect(screen.getByText("Aldric")).toBeInTheDocument();
    expect(screen.getByText("Cedric")).toBeInTheDocument();
  });

  it("renders an explicit error state when the snapshot is unavailable", () => {
    finalRankingsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderScreen();

    expect(
      screen.getByText("Classement final indisponible"),
    ).toBeInTheDocument();
  });
});
