import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { usePayroll } from "@/hooks/use-payroll";
import { renderWithProviders } from "@/tests/render-with-providers";
import { server } from "@/tests/test-server";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const ok = (data: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data });

const payrollRow = {
  id: "p1",
  user: "u1",
  dateOfCreation: "2026-08-01T00:00:00.000Z",
  dateOfPayment: undefined,
  mode: "upi",
  baseSalary: 20000,
  expectedSalary: 21000,
  paidSalary: 2500,
  bonus: 0,
  deduction: [],
  status: "partially-paid",
};

describe("usePayroll money mutations (D-29 invalidation-only parity)", () => {
  it("payInstallment only refetches the payroll list AFTER success", async () => {
    let listCalls = 0;
    let releaseRefetch: (() => void) | undefined;
    server.use(
      http.get("/api/payroll", () => {
        listCalls += 1;
        if (listCalls === 1)
          return HttpResponse.json({
            success: true,
            message: "ok",
            data: [payrollRow],
            meta: { page: 1, limit: 10, count: 1, totalPages: 1 },
          });
        // Hold the invalidation-driven refetch open.
        return new Promise((resolve) => {
          releaseRefetch = () =>
            resolve(
              HttpResponse.json({
                success: true,
                message: "ok",
                data: [{ ...payrollRow, paidSalary: 5000 }],
                meta: { page: 1, limit: 10, count: 1, totalPages: 1 },
              }),
            );
        });
      }),
      http.put("/api/payroll/p1", () => ok(null)),
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const setQueryDataSpy = vi.spyOn(client, "setQueryData");

    let probe: { paidSalary?: number } | undefined;
    let state: ReturnType<typeof usePayroll> | undefined;

    function ListProbe() {
      const { list } = usePayroll({ year: 2026, month: 8 }, 1);
      probe = { paidSalary: list.data?.items?.[0]?.paidSalary };
      return null;
    }

    function MutateProbe() {
      state = usePayroll({ year: 2026, month: 8 }, 1);
      return null;
    }

    render(
      <QueryClientProvider client={client}>
        <ListProbe />
        <MutateProbe />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(probe?.paidSalary).toBe(2500));

    act(() => {
      state?.payInstallment.mutate({
        id: "p1",
        data: { mode: "upi", paidSalary: 2500 },
      });
    });

    await waitFor(() => expect(state?.payInstallment.isSuccess).toBe(true));

    // Cache still shows pre-mutation data — no optimistic write.
    expect(probe?.paidSalary).toBe(2500);

    act(() => releaseRefetch?.());

    await waitFor(() => expect(probe?.paidSalary).toBe(5000));
    expect(setQueryDataSpy).not.toHaveBeenCalled();
  });

  it("runCron invalidates the payroll cache on success", async () => {
    let listCalls = 0;
    let releaseRefetch: (() => void) | undefined;
    server.use(
      http.get("/api/payroll", () => {
        listCalls += 1;
        if (listCalls === 1)
          return HttpResponse.json({
            success: true,
            message: "ok",
            data: [payrollRow],
            meta: { page: 1, limit: 10, count: 1, totalPages: 1 },
          });
        // Hold the invalidation-driven refetch open.
        return new Promise((resolve) => {
          releaseRefetch = () =>
            resolve(
              HttpResponse.json({
                success: true,
                message: "ok",
                data: [],
                meta: { page: 1, limit: 10, count: 0, totalPages: 0 },
              }),
            );
        });
      }),
      http.post("/api/payroll/cron", () => ok(null)),
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const setQueryDataSpy = vi.spyOn(client, "setQueryData");

    let probe: { count?: number } | undefined;
    let state: ReturnType<typeof usePayroll> | undefined;

    function ListProbe() {
      const { list } = usePayroll({}, 1);
      probe = { count: list.data?.items?.length };
      return null;
    }

    function MutateProbe() {
      state = usePayroll({}, 1);
      return null;
    }

    render(
      <QueryClientProvider client={client}>
        <ListProbe />
        <MutateProbe />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(probe?.count).toBe(1));

    act(() => {
      state?.runCron.mutate();
    });

    await waitFor(() => expect(state?.runCron.isSuccess).toBe(true));

    // No optimistic write happened — cache still shows pre-mutation data.
    expect(probe?.count).toBe(1);

    act(() => releaseRefetch?.());

    await waitFor(() => expect(probe?.count).toBe(0));
    expect(setQueryDataSpy).not.toHaveBeenCalled();
  });
});