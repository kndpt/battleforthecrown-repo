import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RetentionSummaryDto } from "@battleforthecrown/shared/retention";
import type { JoinedVillage } from "@/api";
import { DailyRetentionWidget } from "./DailyRetentionWidget";

const villages: JoinedVillage[] = [
  {
    id: "v1",
    isCapital: true,
    name: "Haute Cour",
    userId: "u1",
    worldId: "w1",
    x: 10,
    y: 12,
  },
  {
    id: "v2",
    label: "DEFENSIVE",
    name: "Marche Nord",
    userId: "u1",
    worldId: "w1",
    x: 13,
    y: 15,
  },
];

const removedBacklogTitle = ["Cartes", "en", "attente"].join(" ");
const removedCatchUpPattern = new RegExp(["rattraper"].join(""), "i");

const summary: RetentionSummaryDto = {
  backlogLimit: 1,
  cards: [
    {
      claimedAt: null,
      createdAt: "2026-05-15T02:00:00.000Z",
      dayKey: "2026-05-15",
      id: "card-1",
      reward: { iron: 120, stone: 120, type: "RESOURCES", wood: 120 },
      rewardVillageId: null,
      status: "CLAIMABLE",
      tasks: [
        {
          completedAt: "2026-05-15T08:00:00.000Z",
          metadata: {},
          id: "task-1",
          label: "Former 5 unités",
          progress: 5,
          target: 5,
          type: "TRAIN_UNITS",
        },
      ],
      worldId: "w1",
    },
  ],
  claimableCount: 1,
  currentDayKey: "2026-05-15",
  defaultRewardVillageId: "v1",
  oyez: {
    description: "Les éclaireurs rapportent plus vite les mouvements proches.",
    endsAt: "2026-05-16T02:00:00.000Z",
    id: "oyez-1",
    startsAt: "2026-05-15T02:00:00.000Z",
    theme: "WATCH",
    title: "Oeil du Guet",
    worldId: "w1",
  },
  worldId: "w1",
};

describe("DailyRetentionWidget", () => {
  it("opens the daily sheet from a claimable badge and claims on the selected village", () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: /Devoir royal, 1 carte à réclamer/i }),
    );

    expect(screen.getByText("Devoir royal")).toBeInTheDocument();
    expect(screen.getByText("Oeil du Guet")).toBeInTheDocument();
    expect(screen.getAllByText("15 mai").length).toBeGreaterThan(0);
    expect(screen.getByText("Expire à")).toBeInTheDocument();
    expect(screen.getByText("04h00")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Village récompensé"), {
      target: { value: "v2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Récupérer" }));

    expect(onClaim).toHaveBeenCalledWith({ cardId: "card-1", villageId: "v2" });
  });

  it.each([
    ["WATCH", "assets/watchtower.png"],
    ["BUILDERS", "assets/castle.png"],
    ["MARCH", "assets/army-power.png"],
    ["BARBARIANS", "assets/attack.png"],
  ] as const)(
    "renders the %s Oyez theme with its mapped icon",
    (theme, expectedIcon) => {
      render(
        <DailyRetentionWidget
          activeVillageId="v1"
          onClaim={vi.fn()}
          onNavigate={vi.fn()}
          summary={{
            ...summary,
            oyez: { ...summary.oyez!, theme },
          }}
          villages={villages}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: /Devoir royal, 1 carte à réclamer/i,
        }),
      );

      // The sheet is rendered through createPortal into document.body.
      expect(
        document.body.querySelector(`img[src$="${expectedIcon}"]`),
      ).not.toBeNull();
    },
  );

  it("does not render a backlog or missed-days catch-up copy", () => {
    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={{
          ...summary,
          cards: [
            ...summary.cards,
            {
              ...summary.cards[0],
              dayKey: "2026-05-16",
              id: "card-2",
              status: "ACTIVE",
            },
          ],
        }}
        villages={villages}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Devoir royal, 1 carte à réclamer/i }),
    );

    expect(screen.queryByText(removedBacklogTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(removedCatchUpPattern)).not.toBeInTheDocument();
  });

  it("closes the daily sheet when clicking the backdrop", () => {
    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={summary}
        villages={villages}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Devoir royal, 1 carte à réclamer/i }),
    );
    expect(screen.getByText("Devoir royal")).toBeInTheDocument();

    // Clic sur le calque de centrage (parent du dialog) = clic « hors modale ».
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.parentElement as HTMLElement);
    // L'unmount n'arrive qu'en fin d'animation de sortie (transition opacity).
    fireEvent.transitionEnd(dialog, { propertyName: "opacity" });

    expect(screen.queryByText("Devoir royal")).not.toBeInTheDocument();
  });

  it("delegates close requests without mutating visibility in controlled mode", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DailyRetentionWidget
        activeVillageId="v1"
        hideButton
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        onOpenChange={onOpenChange}
        open
        summary={summary}
        villages={villages}
      />,
    );

    expect(screen.getByText("Devoir royal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText("Devoir royal")).toBeInTheDocument();

    rerender(
      <DailyRetentionWidget
        activeVillageId="v1"
        hideButton
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        onOpenChange={onOpenChange}
        open={false}
        summary={summary}
        villages={villages}
      />,
    );

    fireEvent.transitionEnd(screen.getByRole("dialog"), { propertyName: "opacity" });
    expect(screen.queryByText("Devoir royal")).not.toBeInTheDocument();
  });

  it("emits shared game actions for incomplete tasks", () => {
    const onAction = vi.fn();
    const activeSummary: RetentionSummaryDto = {
      ...summary,
      cards: [
        {
          ...summary.cards[0],
          status: "ACTIVE",
          tasks: [
            {
              completedAt: null,
              metadata: {},
              id: "task-building",
              label: "Terminer une construction",
              progress: 0,
              target: 1,
              type: "COMPLETE_BUILDING",
            },
          ],
        },
      ],
      claimableCount: 0,
    };

    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onAction={onAction}
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={activeSummary}
        villages={villages}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Devoir royal, 1 tâche restante" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Village" }));

    expect(onAction).toHaveBeenCalledWith("open-building-management");
    fireEvent.transitionEnd(screen.getByRole("dialog"), { propertyName: "opacity" });
    expect(screen.queryByText("Devoir royal")).not.toBeInTheDocument();
  });

  it("requests controlled close before emitting a shared game action", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    const activeSummary: RetentionSummaryDto = {
      ...summary,
      cards: [
        {
          ...summary.cards[0],
          status: "ACTIVE",
          tasks: [
            {
              completedAt: null,
              metadata: {},
              id: "task-building",
              label: "Terminer une construction",
              progress: 0,
              target: 1,
              type: "COMPLETE_BUILDING",
            },
          ],
        },
      ],
      claimableCount: 0,
    };

    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        hideButton
        onAction={onAction}
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        onOpenChange={onOpenChange}
        open
        summary={activeSummary}
        villages={villages}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Village" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onAction).toHaveBeenCalledWith("open-building-management");
    expect(screen.getByText("Devoir royal")).toBeInTheDocument();
  });

  it("maps the Oyez theme to its banner icon", () => {
    // The sheet renders through a portal into document.body, so query there.
    const { rerender } = render(
      <DailyRetentionWidget
        activeVillageId="v1"
        hideButton
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        open
        summary={summary}
        villages={villages}
      />,
    );

    // Default fixture theme is WATCH → watchtower icon.
    expect(
      document.body.querySelector('img[src*="watchtower.png"]'),
    ).toBeInTheDocument();

    rerender(
      <DailyRetentionWidget
        activeVillageId="v1"
        hideButton
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        open
        summary={{
          ...summary,
          oyez: { ...summary.oyez!, theme: "BUILDERS" },
        }}
        villages={villages}
      />,
    );

    expect(
      document.body.querySelector('img[src*="castle.png"]'),
    ).toBeInTheDocument();
    expect(
      document.body.querySelector('img[src*="watchtower.png"]'),
    ).not.toBeInTheDocument();
  });

  it("uses server-provided label for tiered tasks (minTargetTier bypasses local override)", () => {
    const tieredSummary: RetentionSummaryDto = {
      ...summary,
      cards: [
        {
          ...summary.cards[0],
          status: "ACTIVE",
          tasks: [
            {
              completedAt: null,
              metadata: { minTargetTier: "T2" },
              id: "task-raid-tier",
              label: "Vaincre un village barbare de niveau 2",
              progress: 0,
              target: 1,
              type: "RAID_BARBARIAN",
            },
          ],
        },
      ],
      claimableCount: 0,
    };

    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={tieredSummary}
        villages={villages}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Devoir royal, 1 tâche restante" }),
    );

    // Server label must be shown as-is; local override ("Vaincre un village barbare") must not appear.
    expect(screen.getByText("Vaincre un village barbare de niveau 2")).toBeInTheDocument();
    expect(screen.queryByText("Vaincre un village barbare")).not.toBeInTheDocument();
  });

  it("shows a red counter badge with the remaining task count (pending)", () => {
    const pendingSummary: RetentionSummaryDto = {
      ...summary,
      claimableCount: 0,
      cards: [
        {
          ...summary.cards[0],
          status: "ACTIVE",
          tasks: [
            {
              completedAt: "2026-05-15T08:00:00.000Z",
              metadata: {},
              id: "done-1",
              label: "Former 5 unités",
              progress: 5,
              target: 5,
              type: "TRAIN_UNITS",
            },
            {
              completedAt: null,
              metadata: {},
              id: "todo-1",
              label: "Terminer une construction",
              progress: 0,
              target: 1,
              type: "COMPLETE_BUILDING",
            },
            {
              completedAt: null,
              metadata: {},
              id: "todo-2",
              label: "Éclairer une cible",
              progress: 0,
              target: 1,
              type: "SCOUT_TARGET",
            },
          ],
        },
      ],
    };

    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={pendingSummary}
        villages={villages}
      />,
    );

    const seal = screen.getByRole("button", {
      name: "Devoir royal, 2 tâches restantes",
    });
    expect(seal).toHaveTextContent("2");
    // Red counter, not the success check.
    expect(seal.querySelector("svg")).toBeNull();
  });

  it("shows a green check badge when claimable (all done, not claimed)", () => {
    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={summary}
        villages={villages}
      />,
    );

    const seal = screen.getByRole("button", {
      name: /Devoir royal, 1 carte à réclamer/i,
    });
    // Success check icon, no numeric counter.
    expect(seal.querySelector("svg")).not.toBeNull();
    expect(seal.textContent ?? "").not.toMatch(/\d/);
  });

  it("renders no badge once everything is claimed (idle)", () => {
    const claimedSummary: RetentionSummaryDto = {
      ...summary,
      claimableCount: 0,
      cards: [
        {
          ...summary.cards[0],
          status: "CLAIMED",
          claimedAt: "2026-05-15T09:00:00.000Z",
        },
      ],
    };

    render(
      <DailyRetentionWidget
        activeVillageId="v1"
        onClaim={vi.fn()}
        onNavigate={vi.fn()}
        summary={claimedSummary}
        villages={villages}
      />,
    );

    const seal = screen.getByRole("button", { name: "Devoir royal" });
    expect(seal.querySelector("svg")).toBeNull();
    expect(seal.textContent ?? "").not.toMatch(/\d/);
  });
});
