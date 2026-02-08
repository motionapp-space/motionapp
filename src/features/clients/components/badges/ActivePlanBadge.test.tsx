import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivePlanBadge } from "./ActivePlanBadge";

describe("ActivePlanBadge", () => {
  it("renders 'Attivo' when hasActivePlan is true", () => {
    render(<ActivePlanBadge hasActivePlan={true} />);
    expect(screen.getByText("Attivo")).toBeInTheDocument();
  });

  it("renders 'Nessun piano' when hasActivePlan is false", () => {
    render(<ActivePlanBadge hasActivePlan={false} />);
    expect(screen.getByText("Nessun piano")).toBeInTheDocument();
  });

  it("renders dash when hasActivePlan is undefined", () => {
    render(<ActivePlanBadge hasActivePlan={undefined} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders CheckCircle icon for active plan", () => {
    const { container } = render(<ActivePlanBadge hasActivePlan={true} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders XCircle icon for no plan", () => {
    const { container } = render(<ActivePlanBadge hasActivePlan={false} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
