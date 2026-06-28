import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VillageMapPanel } from "./VillageMapPanel";

const baseProps = {
  variant: "scouted" as const,
  name: "Bastion d'un ami",
  coords: "12 | 34",
  typeTag: "player" as const,
};

describe("VillageMapPanel reinforceOnly (defensive friend)", () => {
  it("renders only the Renfort action — never attack/scout", () => {
    render(
      <VillageMapPanel
        {...baseProps}
        reinforceOnly
        onReinforce={() => {}}
        onScout={() => {}}
        onAttack={() => {}}
      />,
    );
    expect(screen.getByText("Renfort")).toBeInTheDocument();
    expect(screen.queryByText("Espionner")).not.toBeInTheDocument();
    expect(screen.queryByText("Attaquer")).not.toBeInTheDocument();
  });

  it("fires onReinforce when the button is clicked", () => {
    const onReinforce = vi.fn();
    render(
      <VillageMapPanel {...baseProps} reinforceOnly onReinforce={onReinforce} />,
    );
    fireEvent.click(screen.getByText("Renfort"));
    expect(onReinforce).toHaveBeenCalledTimes(1);
  });

  it("disables Renfort when not reinforceable (e.g. capture window open)", () => {
    render(<VillageMapPanel {...baseProps} reinforceOnly />);
    const button = screen.getByText("Renfort").closest("button");
    expect(button).toBeDisabled();
  });
});
