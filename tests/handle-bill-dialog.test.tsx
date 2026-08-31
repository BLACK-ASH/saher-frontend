import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/tests/render-with-providers";
import { server } from "@/tests/test-server";
import HandleBillDialog from "@/features/reimbursement/handle-bill-dialog";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const ok = (data: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data });

const bill = {
  id: "b1",
  user: "u1",
  amount: 1200,
  advance: 0,
  date: "2026-08-26T00:00:00.000Z",
  description: "Taxi fare",
  status: "pending",
  isDeleted: false,
};

// useReimbursement mounts 5 read queries; msw runs onUnhandledRequest:"error",
// so every test needs read handlers (see tests/reimbursement-hook.test.tsx).
function stubReads() {
  server.use(
    http.get("/api/reimbursement/mybills", () => ok([bill])),
    http.get("/api/reimbursement/recyclebills", () => ok([])),
    http.get("/api/reimbursement/", () =>
      HttpResponse.json({
        success: true,
        message: "ok",
        data: [],
        meta: { page: 1, limit: 10, count: 0, totalPages: 0 },
      }),
    ),
    http.get("/api/reimbursement/balance-enquiry", () =>
      ok({ PocketUse: 100, AdvanceUse: 500, SettledUse: 400, Total: "1000" }),
    ),
    http.get("/api/reimbursement/audit-log", () =>
      HttpResponse.json({
        success: true,
        message: "ok",
        data: [],
        meta: { page: 1, limit: 10, count: 0, totalPages: 0 },
      }),
    ),
  );
}

describe("HandleBillDialog double-submit guard (D-26)", () => {
  it("disables Submit while pending, swallowing further submits (single apiFetch)", async () => {
    let handleCalls = 0;
    let release: (() => void) | undefined;
    stubReads();
    server.use(
      http.post("/api/reimbursement/handle/b1", () => {
        handleCalls += 1;
        // Hold the response open so the pending (disabled) state is durable
        // and observable, mirroring the deferred-response pattern used in the
        // hook tests.
        return new Promise((resolve) => {
          release = () => resolve(ok(null));
        });
      }),
    );

    renderWithProviders(
      <HandleBillDialog
        bill={bill}
        initialStatus="accept"
        open
        onOpenChange={() => {}}
      />,
    );

    const reason = await screen.findByPlaceholderText(/notes/i);
    fireEvent.change(reason, { target: { value: "receipts verified" } });

    const submit = screen.getByRole("button", { name: /submit/i });

    // First submit puts the mutation in flight; the button flips to disabled.
    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());

    // While pending, a further click cannot re-submit — still one apiFetch.
    fireEvent.click(submit);

    await waitFor(() => expect(handleCalls).toBe(1));
    expect(submit).toBeDisabled();

    release?.();
  });
});
