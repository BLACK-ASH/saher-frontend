import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { LifecycleTimeline } from "@/features/reimbursement/lifecycle-timeline";
import { renderWithProviders } from "./render-with-providers";
import { BillResponse, SettlementResponse } from "@/services/reimbursement.api";

const bill = (overrides: Partial<BillResponse> = {}): BillResponse => ({
  id: "b1",
  user: "u1",
  image: undefined,
  amount: 1000,
  advance: 0,
  date: "2026-08-01T10:00:00",
  description: "Office stationery",
  status: "pending",
  isDeleted: false,
  ...overrides,
});

const settlement = (overrides: Partial<SettlementResponse> = {}): SettlementResponse => ({
  id: "s1",
  bill: "b1",
  user: "u1",
  amount: 1000,
  mode: "upi",
  date: "2026-08-02T10:00:00",
  manager: "m1",
  status: "pending",
  expiredAt: "2026-08-10T10:00:00",
  ...overrides,
});

describe("LifecycleTimeline", () => {
  it("submitted-only bill renders exactly Submitted node plus muted Not settled, no invented nodes", () => {
    renderWithProviders(<LifecycleTimeline bill={bill()} />);

    expect(screen.getByText("Submitted")).toBeDefined();
    expect(screen.getByText("Not settled yet")).toBeDefined();
    expect(screen.queryByText("Handled")).toBeNull();
    expect(screen.queryByText(/Settled via/i)).toBeNull();
    expect(screen.queryByText("Settlement Pending")).toBeNull();
  });

  it("rejected bill shows Handled node with Rejected badge and reason", () => {
    renderWithProviders(
      <LifecycleTimeline bill={bill({ status: "reject", reason: "missing receipt" })} />,
    );

    expect(screen.getByText("Handled")).toBeDefined();
    expect(screen.getByText("reject")).toBeDefined();
    expect(screen.getByText("missing receipt")).toBeDefined();
    expect(screen.queryByText("Not settled yet")).toBeNull();
  });

  it("settled settlement renders green Settled via UPI with settleDate", () => {
    renderWithProviders(
      <LifecycleTimeline
        bill={bill({ status: "accept" })}
        settlement={settlement({ status: "settle", settleDate: "2026-08-03T09:00:00" })}
      />,
    );

    expect(screen.getByText("Settled via UPI")).toBeDefined();
    expect(screen.getByText("Settled via UPI").closest("p")?.nextElementSibling?.textContent)
      .toContain("2026");
  });

  it("- mode renders Other label", () => {
    renderWithProviders(
      <LifecycleTimeline
        bill={bill({ status: "accept" })}
        settlement={settlement({ status: "settle", mode: "-", settleDate: "2026-08-03T09:00:00" })}
      />,
    );

    expect(screen.getByText("Settled via Other")).toBeDefined();
  });

  it("pending settlement renders yellow Settlement Pending node", () => {
    renderWithProviders(
      <LifecycleTimeline bill={bill({ status: "accept" })} settlement={settlement()} />,
    );

    expect(screen.getByText("Settlement Pending")).toBeDefined();
    expect(screen.queryByText(/Settled via/i)).toBeNull();
  });
});