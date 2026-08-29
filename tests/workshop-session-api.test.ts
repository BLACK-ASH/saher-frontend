import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { getWorkshops, restoreWorkshop } from "@/services/workshop.api";
import {
  addSession,
  getSessions,
  restoreSession,
  SessionCreateT,
} from "@/services/session.api";
import { server } from "@/tests/test-server";

const envelope = (data: unknown, meta: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data, meta });

const workshopRow = {
  id: "w1",
  title: "React Bootcamp",
  description: "<p>Bootcamp</p>",
  program: { id: "pg1", title: "Tech Summit" },
};

const sessionRow = {
  id: "s1",
  title: "Intro to React",
  program: { id: "pg1", title: "Tech Summit" },
  workshop: { id: "w1", title: "React Bootcamp" },
  description: "<p>Intro</p>",
  date: "2026-09-15",
  startTime: "10:00",
  endTime: "12:00",
  speaker: [],
  images: [],
};

describe("restoreWorkshop", () => {
  it("PATCHes /api/events/workshops/restore/:id", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/events/workshops/restore/w1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({ success: true, message: "restored", data: null });
      }),
    );

    await restoreWorkshop("w1");

    expect(hitPath).toBe("/api/events/workshops/restore/w1");
  });
});

describe("restoreSession", () => {
  it("PATCHes /api/events/sessions/restore/:id", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/events/sessions/restore/s1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({ success: true, message: "restored", data: null });
      }),
    );

    await restoreSession("s1");

    expect(hitPath).toBe("/api/events/sessions/restore/s1");
  });
});

describe("getWorkshops isDeleted param", () => {
  it("includes isDeleted=true when passed true", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/workshops", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([workshopRow], { page: 1, limit: 10, count: 1, totalPages: 1 });
      }),
    );

    await getWorkshops({ keyword: "pg1", isDeleted: "true" });

    expect(hitUrl).toContain("isDeleted=true");
  });
});

describe("getSessions isDeleted param", () => {
  it("includes isDeleted=false when passed false", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/sessions", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([sessionRow], { page: 1, limit: 10, count: 1, totalPages: 1 });
      }),
    );

    await getSessions({ keyword: "w1", isDeleted: "false" });

    expect(hitUrl).toContain("isDeleted=false");
  });
});

describe("addSession explicit workshop (Pitfall 7)", () => {
  it("POSTs to /api/events/sessions/:programId with speaker string[] and an explicit workshop present", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.post("/api/events/sessions/pg1", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ success: true, message: "created", data: null });
      }),
    );

    const payload: SessionCreateT = {
      title: "Intro to React",
      workshop: "w1",
      program: "pg1",
      description: "<p>Intro</p>",
      date: "2026-09-15",
      startTime: new Date("2026-09-15T10:00:00+05:30"),
      endTime: new Date("2026-09-15T12:00:00+05:30"),
      speaker: ["u1", "u2"],
    };

    await addSession({ programId: "pg1", data: payload });

    expect(hitPath).toBe("/api/events/sessions/pg1");
    const b = body as Record<string, unknown>;
    expect(b.speaker).toEqual(["u1", "u2"]);
    expect(b.workshop).toBe("w1");
    expect(b.program).toBe("pg1");
  });
});
