import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { apiFetch } from "@/lib/api-wrapper";
import { server } from "@/tests/test-server";

// Synthetic, structurally shaped after AttendanceResponse usage in
// services/attendance.api.ts — no real PII (threat T-01-FX).
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
