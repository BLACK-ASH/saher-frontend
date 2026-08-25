import { http, HttpResponse } from "msw";
import { expect, test, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api-wrapper";
import { server } from "@/tests/test-server";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const attendance = {
  id: "att-1",
  inTime: null,
  outTime: null,
  workHours: 8,
  date: "2026-08-24",
  status: "present",
  overtime: false,
  isLate: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("apiFetch parses a full success envelope served by an msw handler", async () => {
  server.use(
    http.get("/api/attendance/me", () =>
      HttpResponse.json({ success: true, message: "ok", data: attendance }),
    ),
  );

  await expect(apiFetch("/api/attendance/me")).resolves.toMatchObject({
    success: true,
    message: "ok",
    data: attendance,
  });
});

test("apiFetch passes the pagination meta object through untouched", async () => {
  const meta = { page: 1, limit: 10, count: 1, total: 1 };
  server.use(
    http.get("/api/attendance/user/me", () =>
      HttpResponse.json({
        success: true,
        message: "ok",
        data: [attendance],
        meta,
      }),
    ),
  );

  const res = await apiFetch("/api/attendance/user/me");
  expect(res.meta).toEqual(meta);
});

test("apiFetch throws on HTTP 200 when the envelope omits success:true", async () => {
  server.use(
    http.get("/api/attendance/me", () =>
      HttpResponse.json({ message: "nope" }),
    ),
  );

  await expect(apiFetch("/api/attendance/me")).rejects.toThrow("nope");
});

// ========================
// D-19: REFRESH SINGLE-FLIGHT / RETRY / SENTINEL
// ========================

test("concurrent 401s trigger single-flight refresh — refresh called exactly once", async () => {
  let refreshHits = 0;
  let apiHits = 0;

  server.use(
    http.post("/api/auth/refresh-token", () => {
      refreshHits++;
      return HttpResponse.json({ success: true }, { status: 200 });
    }),
    http.get("/api/data/a", () => {
      apiHits++;
      if (apiHits <= 1) {
        return HttpResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 },
        );
      }
      return HttpResponse.json({ success: true, message: "ok", data: "a" });
    }),
    http.get("/api/data/b", () => {
      apiHits++;
      if (apiHits <= 2) {
        return HttpResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 },
        );
      }
      return HttpResponse.json({ success: true, message: "ok", data: "b" });
    }),
  );

  const [resA, resB] = await Promise.all([
    apiFetch("/api/data/a"),
    apiFetch("/api/data/b"),
  ]);

  expect(refreshHits).toBe(1);
  expect(resA.success).toBe(true);
  expect(resB.success).toBe(true);
  expect(apiHits).toBe(4); // 2 initial + 2 retries
});

test("retry-once accounting: each original endpoint hit exactly twice (initial + single retry)", async () => {
  let hitCount = 0;

  server.use(
    http.post("/api/auth/refresh-token", () =>
      HttpResponse.json({ success: true }, { status: 200 }),
    ),
    http.get("/api/data/c", () => {
      hitCount++;
      if (hitCount === 1) {
        return HttpResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 },
        );
      }
      return HttpResponse.json({ success: true, message: "ok", data: "c" });
    }),
  );

  const res = await apiFetch("/api/data/c");
  expect(res.success).toBe(true);
  expect(hitCount).toBe(2); // initial + 1 retry
});

test("refresh failure: rejects with 'Unauthorized', refresh called exactly once", async () => {
  let refreshHits = 0;

  server.use(
    http.post("/api/auth/refresh-token", () => {
      refreshHits++;
      return HttpResponse.json(
        { success: false, message: "Refresh failed" },
        { status: 401 },
      );
    }),
    http.get("/api/data/d", () =>
      HttpResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    ),
  );

  await expect(apiFetch("/api/data/d")).rejects.toThrow("Unauthorized");
  expect(refreshHits).toBe(1);
});

test("no toast.error on the death path — dedupe ownership in lib/session.ts", async () => {
  const { toast } = await import("sonner");

  let refreshHits = 0;

  server.use(
    http.post("/api/auth/refresh-token", () => {
      refreshHits++;
      return HttpResponse.json(
        { success: false, message: "Refresh failed" },
        { status: 401 },
      );
    }),
    http.get("/api/data/e", () =>
      HttpResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    ),
  );

  await expect(apiFetch("/api/data/e")).rejects.toThrow("Unauthorized");
  expect(refreshHits).toBe(1);
  expect(toast.error).not.toHaveBeenCalled();
});
