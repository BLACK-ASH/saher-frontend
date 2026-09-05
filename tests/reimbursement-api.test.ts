import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  adminBillCreateSchema,
  balanceEnquirySchema,
  createAdvanceBill,
  createBill,
  deleteAdvanceBill,
  deleteBill,
  exportReport,
  getAuditLog,
  getBalanceEnquiry,
  getMyBills,
  getRecycleBills,
  getSettlementByBill,
  handleBill,
  handleBillInputSchema,
  restoreBill,
  searchBills,
  settleBill,
  settleInputSchema,
  updateAdvanceBill,
  updateBill,
  userBillCreateSchema,
  userBillUpdateSchema,
} from "@/services/reimbursement.api";
import { server } from "@/tests/test-server";

const ok = (data: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data });

const bill = {
  id: "b1",
  user: "u1",
  amount: 100,
  advance: 0,
  date: "2026-08-26T00:00:00.000Z",
  description: "Taxi fare",
  status: "pending" as const,
  isDeleted: false,
};

describe("getMyBills", () => {
  it("GETs /api/reimbursement/mybills?isDeleted=false and returns the raw array", async () => {
    let hitPath = "";
    let hitQuery = "";
    server.use(
      http.get("/api/reimbursement/mybills", ({ request }) => {
        const url = new URL(request.url);
        hitPath = url.pathname;
        hitQuery = url.search;
        return ok([bill]);
      }),
    );

    const bills = await getMyBills(false);

    expect(hitPath).toBe("/api/reimbursement/mybills");
    expect(hitQuery).toBe("?isDeleted=false");
    // No meta on this endpoint — res.data array comes back untouched.
    expect(bills).toHaveLength(1);
    expect(bills[0].id).toBe("b1");
  });

  it("passes isDeleted=true for the deleted tab", async () => {
    let hitQuery = "";
    server.use(
      http.get("/api/reimbursement/mybills", ({ request }) => {
        hitQuery = new URL(request.url).search;
        return ok([]);
      }),
    );

    await getMyBills(true);

    expect(hitQuery).toBe("?isDeleted=true");
  });
});

describe("searchBills", () => {
  it("GETs / with status + isDeleted + pagination params and normalizes meta", async () => {
    let hitSearch = "";
    server.use(
      http.get("/api/reimbursement/", ({ request }) => {
        hitSearch = new URL(request.url).search;
        return HttpResponse.json({
          success: true,
          message: "ok",
          data: [bill],
          meta: { page: 1, limit: 10, count: 11, totalPages: 2 },
        });
      }),
    );

    const page = await searchBills({ status: "pending" });

    expect(hitSearch).toContain("status=pending");
    expect(hitSearch).toContain("isDeleted=false");
    expect(hitSearch).toContain("page=1");
    expect(hitSearch).toContain("limit=10");
    expect(page.items).toHaveLength(1);
    expect(page.totalRecords).toBe(11);
    expect(page.totalPages).toBe(2);
  });

  // search-bill.controller.ts no longer guards on empty filters (view-all is
  // a legit query), so cleared filters emit no benign description= param.
  it("emits isDeleted only when every filter is cleared", async () => {
    let url: URL | undefined;
    server.use(
      http.get("/api/reimbursement/", ({ request }) => {
        url = new URL(request.url);
        return ok([]);
      }),
    );

    await searchBills({});

    expect(url?.searchParams.get("isDeleted")).toBe("false");
    expect(url?.searchParams.has("description")).toBe(false);
  });
});

describe("restoreBill", () => {
  it("PATCHes /api/reimbursement/:billId/restore (D-30 contract)", async () => {
    let hitMethod = "";
    let hitPath = "";
    server.use(
      http.patch("/api/reimbursement/abc/restore", ({ request }) => {
        hitMethod = request.method;
        hitPath = new URL(request.url).pathname;
        return ok(null);
      }),
    );

    await restoreBill("abc");

    expect(hitMethod).toBe("PATCH");
    expect(hitPath).toBe("/api/reimbursement/abc/restore");
  });
});

describe("balance enquiry schema (Quirk 5)", () => {
  const payload = {
    PocketUse: 100,
    AdvanceUse: 500,
    SettledUse: 400,
    Total: "1200 Amount to Received",
  };

  it("parses when Total is the backend's pre-formatted string", async () => {
    let hitPath = "";
    server.use(
      http.get("/api/reimbursement/balance-enquiry", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return ok(payload);
      }),
    );

    const balance = await getBalanceEnquiry();

    expect(hitPath).toBe("/api/reimbursement/balance-enquiry");
    expect(typeof balance.Total).toBe("string");
    expect(balance.PocketUse).toBe(100);
  });

  it("fails the schema when Total arrives as a number", () => {
    expect(
      balanceEnquirySchema.safeParse({ ...payload, Total: 1200 }).success,
    ).toBe(false);
  });

  it("accepts the optional Empty marker", () => {
    expect(balanceEnquirySchema.safeParse({ ...payload, Empty: true }).success).toBe(
      true,
    );
  });
});

describe("request schemas", () => {
  it("handleBillInputSchema rejects an empty reason and accepts a real one", () => {
    expect(
      handleBillInputSchema.safeParse({ status: "on-hold", reason: "" }).success,
    ).toBe(false);
    expect(
      handleBillInputSchema.safeParse({ status: "on-hold", reason: "need receipts" })
        .success,
    ).toBe(true);
  });

  it("userBillCreateSchema caps receipts at 10 and requires a positive amount", () => {
    const base = { description: "Taxi fare", date: "2026-08-26", images: ["m1"] };
    expect(userBillCreateSchema.safeParse({ ...base, amount: -5 }).success).toBe(
      false,
    );
    expect(
      userBillCreateSchema.safeParse({
        ...base,
        amount: 100,
        images: Array.from({ length: 11 }, (_, i) => `m${i}`),
      }).success,
    ).toBe(false);
    expect(
      userBillCreateSchema.safeParse({ ...base, amount: 100 }).success,
    ).toBe(true);
  });

  it("userBillUpdateSchema has NO date key (D-07 date lock)", () => {
    expect(Object.keys(userBillUpdateSchema.shape)).not.toContain("date");
    expect(Object.keys(userBillUpdateSchema.shape)).toEqual(
      expect.arrayContaining(["amount", "description", "images"]),
    );
  });

  it("adminBillCreateSchema requires advance/date/description", () => {
    expect(adminBillCreateSchema.safeParse({ advance: 500, date: "2026-08-26", description: "Project advance" }).success).toBe(
      true,
    );
    expect(adminBillCreateSchema.safeParse({ advance: -1, date: "2026-08-26", description: "Project advance" }).success).toBe(
      false,
    );
  });

  it("settleInputSchema locks status to 'settle' and modes to cash/upi/cheque/'-'", () => {
    expect(settleInputSchema.safeParse({ mode: "upi", status: "settle" }).success).toBe(
      true,
    );
    expect(settleInputSchema.safeParse({ mode: "-", status: "settle" }).success).toBe(
      true,
    );
    expect(settleInputSchema.safeParse({ mode: "paypal", status: "settle" }).success).toBe(
      false,
    );
    expect(settleInputSchema.safeParse({ mode: "cash", status: "pending" }).success).toBe(
      false,
    );
  });
});

describe("mutation endpoints", () => {
  it("createBill POSTs /api/reimbursement/bill with the body", async () => {
    let body: unknown;
    server.use(
      http.post("/api/reimbursement/bill", async ({ request }) => {
        body = await request.json();
        return ok(null);
      }),
    );

    await createBill({
      amount: 100,
      description: "Taxi fare",
      date: "2026-08-26",
      images: ["m1"],
    });

    expect(body).toEqual({
      amount: 100,
      description: "Taxi fare",
      date: "2026-08-26",
      images: ["m1"],
    });
  });

  it("updateBill PATCHes /api/reimbursement/:billId", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/reimbursement/b1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return ok(null);
      }),
    );

    await updateBill("b1", { amount: 200 });

    expect(hitPath).toBe("/api/reimbursement/b1");
  });

  it("deleteBill DELETEs /api/reimbursement/:billId (soft delete)", async () => {
    let hitMethod = "";
    server.use(
      http.delete("/api/reimbursement/b1", ({ request }) => {
        hitMethod = request.method;
        return ok(null);
      }),
    );

    await deleteBill("b1");

    expect(hitMethod).toBe("DELETE");
  });

  it("handleBill POSTs /api/reimbursement/handle/:billId with status+reason", async () => {
    let body: unknown;
    server.use(
      http.post("/api/reimbursement/handle/b1", async ({ request }) => {
        body = await request.json();
        return ok(null);
      }),
    );

    await handleBill("b1", { status: "accept", reason: "receipts verified" });

    expect(body).toEqual({ status: "accept", reason: "receipts verified" });
  });

  it("settleBill POSTs /api/reimbursement/settlement/:settleId", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.post("/api/reimbursement/settlement/s1", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return ok(null);
      }),
    );

    await settleBill("s1", { mode: "upi", status: "settle" });

    expect(hitPath).toBe("/api/reimbursement/settlement/s1");
    // Backend requires the description key even when the UI leaves it blank.
    expect(body).toEqual({ mode: "upi", status: "settle", description: "" });
  });

  it("createAdvanceBill POSTs /api/reimbursement/admin/:user", async () => {
    let hitPath = "";
    server.use(
      http.post("/api/reimbursement/admin/u9", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return ok(null);
      }),
    );

    await createAdvanceBill("u9", {
      advance: 500,
      date: "2026-08-26",
      description: "Project advance",
    });

    expect(hitPath).toBe("/api/reimbursement/admin/u9");
  });

  it("updateAdvanceBill PATCHes and deleteAdvanceBill DELETEs /admin/:billId", async () => {
    let patchPath = "";
    let deleteMethod = "";
    server.use(
      http.patch("/api/reimbursement/admin/b1", ({ request }) => {
        patchPath = new URL(request.url).pathname;
        return ok(null);
      }),
      http.delete("/api/reimbursement/admin/b1", ({ request }) => {
        deleteMethod = request.method;
        return ok(null);
      }),
    );

    await updateAdvanceBill("b1", { advance: 700 });
    await deleteAdvanceBill("b1");

    expect(patchPath).toBe("/api/reimbursement/admin/b1");
    expect(deleteMethod).toBe("DELETE");
  });
});

describe("remaining reads", () => {
  it("getRecycleBills returns the raw array from /recyclebills", async () => {
    let hitQuery = "";
    server.use(
      http.get("/api/reimbursement/recyclebills", ({ request }) => {
        hitQuery = new URL(request.url).search;
        return ok([{ ...bill, isDeleted: true }]);
      }),
    );

    const bills = await getRecycleBills();

    expect(hitQuery).toBe("");
    expect(bills[0].isDeleted).toBe(true);
  });

  it("getAuditLog paginates via normalizeList", async () => {
    let hitSearch = "";
    server.use(
      http.get("/api/reimbursement/audit-log", ({ request }) => {
        hitSearch = new URL(request.url).search;
        return HttpResponse.json({
          success: true,
          message: "ok",
          data: [
            {
              id: "a1",
              date: "2026-08-26T10:00:00.000Z",
              description: "Settled b1",
              amount: 400,
              from: "saher",
              to: "Ravi",
            },
          ],
          meta: { page: 2, limit: 20, count: 21, totalPages: 2 },
        });
      }),
    );

    const log = await getAuditLog(2, 20);

    expect(hitSearch).toContain("page=2");
    expect(hitSearch).toContain("limit=20");
    expect(log.items[0].from).toBe("saher");
    expect(log.totalRecords).toBe(21);
  });

  it("exportReport GETs /export/report?format= and returns data as-is (Pitfall 7)", async () => {
    let hitSearch = "";
    server.use(
      http.get("/api/reimbursement/export/report", ({ request }) => {
        hitSearch = new URL(request.url).search;
        return ok({ jobId: "j1", format: "pdf", count: 4 });
      }),
    );

    const result = await exportReport("pdf");

    expect(hitSearch).toContain("format=pdf");
    expect(result).toEqual({ jobId: "j1", format: "pdf", count: 4 });
  });

  it("getSettlementByBill GETs /:billId which actually queries Settlements (Quirk 1)", async () => {
    let hitPath = "";
    server.use(
      http.get("/api/reimbursement/b1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return ok({
          id: "s1",
          bill: "b1",
          user: "u1",
          amount: 400,
          mode: "-",
          date: "2026-08-26T00:00:00.000Z",
          manager: "m1",
          status: "pending",
          expiredAt: "2026-09-10T00:00:00.000Z",
        });
      }),
    );

    const settlement = await getSettlementByBill("b1");

    expect(hitPath).toBe("/api/reimbursement/b1");
    expect(settlement.id).toBe("s1");
    expect(settlement.mode).toBe("-");
  });
});
