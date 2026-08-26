import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { renderWithProviders } from "@/tests/render-with-providers";
import { server } from "@/tests/test-server";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

// Direct act() calls require the React act environment flag in vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const ok = (data: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data });

const bill = (amount: number) => ({
  id: "b1",
  user: "u1",
  amount,
  advance: 0,
  date: "2026-08-26T00:00:00.000Z",
  description: "Taxi fare",
  status: "pending",
  isDeleted: false,
});

// The hook mounts ALL five queries, so every test needs read handlers for
// them (msw runs with onUnhandledRequest: "error"). Later server.use calls
// override these.
function stubReads() {
  server.use(
    http.get("/api/reimbursement/mybills", () => ok([bill(100)])),
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
      ok({
        PocketUse: 100,
        AdvanceUse: 500,
        SettledUse: 400,
        Total: "1200 Amount to Received",
      }),
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

describe("useReimbursement mutations (D-29 no optimistic writes)", () => {
  it("changes cached bills only AFTER the post-mutation refetch completes", async () => {
    let getCalls = 0;
    let releaseRefetch: (() => void) | undefined;
    stubReads();
    server.use(
      http.get("/api/reimbursement/mybills", () => {
        getCalls += 1;
        if (getCalls === 1) return ok([bill(100)]);
        // Hold the invalidation-driven refetch open so we can observe the
        // cache BEFORE new server data lands.
        return new Promise((resolve) => {
          releaseRefetch = () => resolve(ok([bill(200)]));
        });
      }),
      http.post("/api/reimbursement/handle/b1", () => ok(null)),
    );

    let state: ReturnType<typeof useReimbursement> | undefined;
    function Probe() {
      state = useReimbursement();
      return null;
    }

    renderWithProviders(<Probe />);

    await waitFor(() => expect(state?.myBills.data?.[0]?.amount).toBe(100));

    act(() => {
      state?.handleOne.mutate({
        billId: "b1",
        status: "accept",
        reason: "receipts okay",
      });
    });

    await waitFor(() => expect(state?.handleOne.isSuccess).toBe(true));

    // Mutation succeeded but the cache MUST still show pre-mutation data —
    // no optimistic write happened.
    expect(state?.myBills.data?.[0]?.amount).toBe(100);

    act(() => releaseRefetch?.());

    // Only after the server refetch resolves does the cache change.
    await waitFor(() => expect(state?.myBills.data?.[0]?.amount).toBe(200));
  });

  it("never touches queryClient.setQueryData across every money mutation", async () => {
    stubReads();
    server.use(
      http.post("/api/reimbursement/bill", () => ok(null)),
      http.patch("/api/reimbursement/b1", () => ok(null)),
      http.delete("/api/reimbursement/b1", () => ok(null)),
      http.patch("/api/reimbursement/b1/restore", () => ok(null)),
      http.post("/api/reimbursement/admin/u9", () => ok(null)),
      http.patch("/api/reimbursement/admin/b1", () => ok(null)),
      http.delete("/api/reimbursement/admin/b1", () => ok(null)),
      http.post("/api/reimbursement/handle/b1", () => ok(null)),
      http.post("/api/reimbursement/settlement/s1", () => ok(null)),
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const setQueryDataSpy = vi.spyOn(client, "setQueryData");

    let state: ReturnType<typeof useReimbursement> | undefined;
    function Probe() {
      state = useReimbursement();
      return null;
    }

    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(state?.myBills.isSuccess).toBe(true));
    const s = state as ReturnType<typeof useReimbursement>;

    s.createBill.mutate({
      amount: 100,
      description: "Taxi fare",
      date: "2026-08-26",
      images: ["m1"],
    });
    s.updateBill.mutate({ id: "b1", data: { amount: 120 } });
    s.withdraw.mutate("b1");
    s.restore.mutate("b1");
    s.createAdvance.mutate({
      userId: "u9",
      data: { advance: 500, date: "2026-08-26", description: "Project advance" },
    });
    s.updateAdvance.mutate({ id: "b1", data: { advance: 700 } });
    s.deleteAdvance.mutate("b1");
    s.handleOne.mutate({ billId: "b1", status: "accept", reason: "receipts ok" });
    s.settle.mutate({
      settleId: "s1",
      input: { mode: "upi", status: "settle" },
    });

    await waitFor(() =>
      [
        s.createBill,
        s.updateBill,
        s.withdraw,
        s.restore,
        s.createAdvance,
        s.updateAdvance,
        s.deleteAdvance,
        s.handleOne,
        s.settle,
      ].every((m) => m.isSuccess),
    );

    expect(setQueryDataSpy).not.toHaveBeenCalled();
  });
});

describe("useReimbursement handleMany (D-11/D-27)", () => {
  it("processes strictly sequentially, survives a middle failure, fires ONE summary toast", async () => {
    stubReads();
    const calls: string[] = [];
    // Gate item 2 behind a deferred rejection so per-item progress is
    // observable mid-flight deterministically.
    let releaseSecond: (() => void) | undefined;
    server.use(
      http.post("/api/reimbursement/handle/:billId", ({ request }) => {
        const id = new URL(request.url).pathname.split("/").pop() ?? "";
        calls.push(id);
        if (id === "b2") {
          return new Promise((resolve) => {
            releaseSecond = () =>
              resolve(
                HttpResponse.json(
                  { success: false, message: "declined" },
                  { status: 400 },
                ),
              );
          });
        }
        return ok(null);
      }),
    );

    let state: ReturnType<typeof useReimbursement> | undefined;
    function Probe() {
      state = useReimbursement();
      return null;
    }

    renderWithProviders(<Probe />);

    await waitFor(() => expect(state?.myBills.isSuccess).toBe(true));
    const s = state as ReturnType<typeof useReimbursement>;
    // Progress starts null before any bulk run.
    expect(s.bulkProgress).toBeNull();

    const items = [
      { billId: "b1", status: "accept" as const, reason: "receipts ok one" },
      { billId: "b2", status: "reject" as const, reason: "missing receipts" },
      { billId: "b3", status: "accept" as const, reason: "receipts ok three" },
    ];

    // Start the run; act exits flushing the initial {done:0,total:3} render.
    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = s.handleMany(items);
    });

    // Mid-flight: after item 1 completes, progress must read {done:1,total:3}
    // while item 2 is still blocked (per-item increments are observable).
    await waitFor(() =>
      expect(state?.bulkProgress).toEqual({ done: 1, total: 3 }),
    );

    // Release the gated middle item and let the run drain to completion.
    await act(async () => {
      act(() => releaseSecond?.());
      await run;
    });

    // Sequential order: expected visit order with the failing middle item not
    // aborting its neighbours.
    expect(calls).toEqual(["b1", "b2", "b3"]);

    // Progress ended null and exactly one summary toast reported the outcome.
    await waitFor(() => expect(state?.bulkProgress).toBeNull());
    const { toast } = await import("sonner");
    const mockToast = toast as unknown as {
      success: ReturnType<typeof vi.fn>;
      warning: ReturnType<typeof vi.fn>;
    };
    const summaryCalls = [
      ...mockToast.success.mock.calls,
      ...mockToast.warning.mock.calls,
    ];
    expect(summaryCalls).toHaveLength(1);
    expect(String(summaryCalls[0][0])).toContain("2 handled");
    expect(String(summaryCalls[0][0])).toContain("1 failed");
  });

  it("holds non-null progress only while a bulk run is in flight", async () => {
    stubReads();
    let releaseFirst: (() => void) | undefined;
    server.use(
      http.post("/api/reimbursement/handle/:billId", ({ request }) => {
        if (new URL(request.url).pathname.endsWith("b1")) {
          return new Promise((resolve) => {
            releaseFirst = () => resolve(ok(null));
          });
        }
        return ok(null);
      }),
    );

    let state: ReturnType<typeof useReimbursement> | undefined;
    function Probe() {
      state = useReimbursement();
      return null;
    }

    renderWithProviders(<Probe />);

    const s = state as ReturnType<typeof useReimbursement>;
    expect(s.bulkProgress).toBeNull();

    const run = act(async () => {
      await s.handleMany([
        { billId: "b1", status: "accept" as const, reason: "first item ok" },
        { billId: "b2", status: "accept" as const, reason: "second item ok" },
      ]);
    });

    // While item 1 is blocked, progress must be live: {done:0,total:2}.
    await waitFor(() => expect(state?.bulkProgress).toEqual({ done: 0, total: 2 }));

    act(() => releaseFirst?.());
    await run;

    await waitFor(() => expect(state?.bulkProgress).toBeNull());
  });
});
