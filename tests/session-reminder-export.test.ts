import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  requestSessionExport,
  sendSessionReminder,
} from "@/services/session.api";
import { server } from "@/tests/test-server";

describe("sendSessionReminder (EVNT-07 odd-GET trigger)", () => {
  it("GETs /api/events/programs/workshops/sessions/:id", async () => {
    let hitPath = "";
    server.use(
      http.get("/api/events/programs/workshops/sessions/s1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({ success: true, message: "reminder sent", data: null });
      }),
    );

    await sendSessionReminder("s1");

    expect(hitPath).toBe("/api/events/programs/workshops/sessions/s1");
  });
});

describe("requestSessionExport (EVNT-08 odd-GET job trigger)", () => {
  it("hits /api/events/export/report with format=pdf", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/export/report", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return HttpResponse.json({
          success: true,
          message: "queued",
          data: { jobId: "j1", format: "pdf" },
        });
      }),
    );

    await requestSessionExport({ id: "s1", format: "pdf" });

    expect(hitUrl).toContain("format=pdf");
  });

  it("hits /api/events/export/report with format=xlsx", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/export/report", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return HttpResponse.json({
          success: true,
          message: "queued",
          data: { jobId: "j2", format: "xlsx" },
        });
      }),
    );

    await requestSessionExport({ id: "s1", format: "xlsx" });

    expect(hitUrl).toContain("format=xlsx");
  });

  it("includes sessionId=s1 in the query", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/export/report", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return HttpResponse.json({
          success: true,
          message: "queued",
          data: { jobId: "j1", format: "pdf" },
        });
      }),
    );

    await requestSessionExport({ id: "s1", format: "pdf" });

    expect(hitUrl).toContain("sessionId=s1");
  });
});
