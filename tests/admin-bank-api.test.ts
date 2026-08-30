import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  updateAccount,
  createBank,
  updateBank,
  restoreBank,
  accountUpdateSchema,
} from "@/services/admin.api";
import { maskAccount } from "@/features/admin/bank-details";
import { server } from "@/tests/test-server";

describe("updateAccount (strict-partial PUT, T-06-02-03)", () => {
  it("PUTs /api/admin/account/:id with NO user/bank top-level keys", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.put("/api/admin/account/u1", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ success: true, message: "updated", data: null });
      }),
    );

    await updateAccount({
      id: "u1",
      data: { department: "Engineering", designation: "Developer" },
    });

    expect(hitPath).toBe("/api/admin/account/u1");
    const keys = Object.keys(body as Record<string, unknown>);
    expect(keys).not.toContain("user");
    expect(keys).not.toContain("bank");
    expect(keys).toEqual(["department", "designation"]);
  });
});

describe("createBank", () => {
  it("POSTs /api/admin/bank with the bank body", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.post("/api/admin/bank", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ success: true, message: "created", data: null });
      }),
    );

    await createBank({
      accountHolderName: "A",
      bankName: "B",
      accountNumber: "1234567890",
      ifcs: "HDFC0001234",
      branch: "Mumbai",
      mobileNumber: "9876543210",
    });

    expect(hitPath).toBe("/api/admin/bank");
    expect(body).toMatchObject({ bankName: "B", ifcs: "HDFC0001234" });
  });
});

describe("updateBank", () => {
  it("PUTs /api/admin/bank/:id", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.put("/api/admin/bank/b1", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ success: true, message: "updated", data: null });
      }),
    );

    await updateBank({ id: "b1", data: { branch: "Pune" } });

    expect(hitPath).toBe("/api/admin/bank/b1");
    expect(body).toEqual({ branch: "Pune" });
  });
});

describe("restoreBank", () => {
  it("PATCHes /api/admin/bank/restore/:id", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/admin/bank/restore/b1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({ success: true, message: "restored", data: null });
      }),
    );

    await restoreBank("b1");

    expect(hitPath).toBe("/api/admin/bank/restore/b1");
  });
});

describe("accountUpdateSchema (strict-partial)", () => {
  it("rejects user/bank keys (strict rejects unknown keys)", () => {
    const res = accountUpdateSchema.safeParse({
      department: "Engineering",
      user: { name: "X" },
      bank: { bankName: "Y" },
    });
    expect(res.success).toBe(false);
  });

  it("accepts a valid account-only payload", () => {
    const res = accountUpdateSchema.safeParse({
      department: "Engineering",
      designation: "Developer",
      employeeType: "free",
    });
    expect(res.success).toBe(true);
  });

  it("requires employeeShift when employeeType is part-time", () => {
    const bad = accountUpdateSchema.safeParse({ employeeType: "part-time" });
    expect(bad.success).toBe(false);
    const good = accountUpdateSchema.safeParse({
      employeeType: "part-time",
      employeeShift: "shift-1",
    });
    expect(good.success).toBe(true);
  });
});

describe("maskAccount (T-06-02-01)", () => {
  it("masks all but last 4 for long numbers", () => {
    expect(maskAccount("1234567890")).toBe("•••• 7890");
  });

  it("returns 4 bullets for short numbers", () => {
    expect(maskAccount("12")).toBe("••••");
  });
});