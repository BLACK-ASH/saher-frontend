import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  adminUserResponseSchema,
  getAdminUsers,
  registerAccount,
} from "@/services/admin.api";
import { server } from "@/tests/test-server";

const adminUserRow = {
  id: "u1",
  name: "Test User",
  displayName: "Test",
  image: { id: "img1", alt: "avatar", src: "/uploads/avatar.png" },
  role: "user",
  email: "test@saher.io",
  emailVerified: true,
  pushNotificationsEnabled: false,
  isActive: true,
  isBanned: false,
};

const envelope = (data: unknown, meta: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data, meta });

describe("getAdminUsers (ADMN-02 unpaginated then normalizeList)", () => {
  it("hits GET /api/admin/users?fields=isActive and returns normalized list", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/admin/users", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([adminUserRow], undefined);
      }),
    );

    const list = await getAdminUsers();

    expect(hitUrl).toContain("/api/admin/users?");
    expect(hitUrl).toContain("fields=isActive");
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ id: "u1", name: "Test User" });
  });
});

describe("registerAccount (ADMN-01 atomic onboarding)", () => {
  it("POSTs /api/admin/account with EXACTLY {user, account, bank}", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.post("/api/admin/account", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({
          success: true,
          message: "Employee registered.",
          data: "new-user-id-123",
        });
      }),
    );

    const data = {
      user: { name: "New User", image: "", role: "user", email: "new@saher.io" },
      account: { employeeType: "free" },
      bank: { accountNumber: "1234" },
    };

    const res = await registerAccount(data as never);

    expect(hitPath).toBe("/api/admin/account");
    expect(Object.keys(body as Record<string, unknown>)).toEqual([
      "user",
      "account",
      "bank",
    ]);
    expect((body as Record<string, unknown>).account).toEqual({
      employeeType: "free",
    });
    expect(res.message).toBe("Employee registered.");
  });
});

describe("adminUserResponseSchema", () => {
  it("parses a row with isActive true", () => {
    const parsed = adminUserResponseSchema.parse(adminUserRow);
    expect(parsed.isActive).toBe(true);
    expect(parsed.role).toBe("user");
  });

  it("rejects a row missing id", () => {
    const withoutId = {
      name: "Test User",
      email: "test@saher.io",
      role: "user",
      isActive: true,
    };
    expect(() => adminUserResponseSchema.parse(withoutId)).toThrow();
  });
});
