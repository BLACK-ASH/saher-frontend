import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/tests/render-with-providers";
import { server } from "@/tests/test-server";
import RecordPaymentDialog from "@/features/payroll/record-payment-dialog";
import type { PayrollResponse } from "@/services/payroll.api";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const ok = (data: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data });

const payroll: PayrollResponse = {
  id: "p1",
  user: "u1",
  dateOfCreation: new Date("2026-08-01T00:00:00.000Z"),
  mode: "upi",
  baseSalary: 20000,
  expectedSalary: 21000,
  paidSalary: 2500,
  bonus: 0,
  deduction: [],
  status: "partially-paid",
};

// usePayroll({},1) mounts a list query on /api/payroll (the by-user query is a
// separate hook). useUserMap read the query cache only — no extra handler.
function stubReads() {
  server.use(
    http.get("/api/payroll", () =>
      HttpResponse.json({
        success: true,
        message: "ok",
        data: [payroll],
        meta: { page: 1, limit: 10, count: 1, totalPages: 1 },
      }),
    ),
  );
}

describe("RecordPaymentDialog double-submit guard (D-26)", () => {
  it("disables Record Payment while pending, firing only ONE apiFetch", async () => {
    let putCalls = 0;
    let release: (() => void) | undefined;
    stubReads();
    server.use(
      http.put("/api/payroll/p1", () => {
        putCalls += 1;
        // Hold the response open so the disabled-pending state is observable.
        return new Promise((resolve) => {
          release = () => resolve(ok(null));
        });
      }),
    );

    renderWithProviders(
      <RecordPaymentDialog payroll={payroll} open onOpenChange={() => {}} />,
    );

    const amount = await screen.findByPlaceholderText(/enter amount/i);
    fireEvent.change(amount, { target: { value: "2500" } });

    const submit = screen.getByRole("button", { name: /record payment/i });

    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());

    // While pending, further clicks cannot re-submit — single apiFetch.
    fireEvent.click(submit);

    await waitFor(() => expect(putCalls).toBe(1));
    expect(submit).toBeDisabled();

    release?.();
  });
});