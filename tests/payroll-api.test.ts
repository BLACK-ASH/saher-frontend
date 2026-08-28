import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  getPayrollList,
  getPayrollByUser,
  updatePayroll,
  runPayrollCron,
  payrollSchema,
} from "@/services/payroll.api";
import { server } from "@/tests/test-server";

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

const envelope = (data: unknown, meta: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data, meta });

describe("getPayrollList", () => {
  it("hits GET /api/payroll with page/limit and filters, returns normalizeList", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/payroll", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([payrollRow], {
          page: 2,
          limit: 10,
          count: 21,
          totalPages: 3,
        });
      }),
    );

    const list = await getPayrollList({ year: 2026, month: 8 }, 2, 10);

    expect(hitUrl).toContain("/api/payroll?");
    expect(hitUrl).toContain("page=2&limit=10");
    expect(hitUrl).toContain("year=2026");
    expect(hitUrl).toContain("month=8");
    expect(list).toEqual({
      items: [expect.objectContaining({ id: "p1" })],
      page: 2,
      limit: 10,
      totalPages: 3,
      totalRecords: 21,
    });
  });

  it("omits year/month params when not provided", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/payroll", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([], { page: 1, limit: 10, count: 0, totalPages: 0 });
      }),
    );

    await getPayrollList({}, 1, 10);

    expect(hitUrl).not.toContain("year=");
    expect(hitUrl).not.toContain("month=");
  });
});

describe("getPayrollByUser", () => {
  it("hits GET /api/payroll/user/:id with page/limit", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/payroll/user/u1", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([payrollRow], {
          page: 1,
          limit: 10,
          count: 1,
          totalPages: 1,
        });
      }),
    );

    const list = await getPayrollByUser("u1", 1, 10);

    expect(hitUrl).toContain("/api/payroll/user/u1?page=1&limit=10");
    expect(list.items).toHaveLength(1);
  });
});

describe("updatePayroll (Quirk 8 incremental PUT)", () => {
  it("PUTs /api/payroll/:id with EXACTLY {mode, paidSalary} (increment, not cumulative)", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.put("/api/payroll/p1", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ success: true, message: "paid", data: null });
      }),
    );

    await updatePayroll("p1", { mode: "upi", paidSalary: 2500 });

    expect(hitPath).toBe("/api/payroll/p1");
    expect(body).toEqual({ mode: "upi", paidSalary: 2500 });
  });
});

describe("runPayrollCron (Quirk 7 sync, empty body)", () => {
  it("POSTs /api/payroll/cron with NO body", async () => {
    let hitPath = "";
    let rawBody: string | null = "unset";
    server.use(
      http.post("/api/payroll/cron", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        rawBody = (await request.text()) ?? null;
        return HttpResponse.json({ success: true, message: "cron started", data: null });
      }),
    );

    await runPayrollCron();

    expect(hitPath).toBe("/api/payroll/cron");
    expect(rawBody).toBe("");
  });
});

describe("payrollSchema enum exactness", () => {
  it("parses a record with status partially-paid and mode -", () => {
    const parsed = payrollSchema.parse({
      ...payrollRow,
      status: "partially-paid",
      mode: "-",
    });
    expect(parsed.status).toBe("partially-paid");
    expect(parsed.mode).toBe("-");
  });

  it("rejects unknown status and mode values", () => {
    expect(() => payrollSchema.parse({ ...payrollRow, status: "done" })).toThrow();
    expect(() => payrollSchema.parse({ ...payrollRow, mode: "card" })).toThrow();
  });
});