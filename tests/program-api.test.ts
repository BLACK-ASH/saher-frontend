import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  addParticipantsInProgram,
  getPrograms,
  restoreProgram,
} from "@/services/program.api";
import { server } from "@/tests/test-server";

const programRow = {
  id: "pg1",
  title: "Tech Summit",
  description: "<p>Annual summit</p>",
};

const envelope = (data: unknown, meta: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data, meta });

describe("addParticipantsInProgram (contract: {participantIds})", () => {
  it("POSTs body with a top-level participantIds array equal to the input and NO other keys", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.post("/api/events/programs/participants/pg1", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ success: true, message: "ok", data: null });
      }),
    );

    await addParticipantsInProgram({ id: "pg1", participants: ["p1", "p2"] });

    expect(hitPath).toBe("/api/events/programs/participants/pg1");
    expect(body).toEqual({ participantIds: ["p1", "p2"] });
  });
});

describe("restoreProgram", () => {
  it("PATCHes /api/events/programs/restore/:id", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/events/programs/restore/pg1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({ success: true, message: "restored", data: null });
      }),
    );

    await restoreProgram("pg1");

    expect(hitPath).toBe("/api/events/programs/restore/pg1");
  });
});

describe("getPrograms isDeleted param", () => {
  it("includes isDeleted=true when passed true", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/programs", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([programRow], { page: 1, limit: 10, count: 1, totalPages: 1 });
      }),
    );

    await getPrograms({ keyword: "x", isDeleted: "true" });

    expect(hitUrl).toContain("isDeleted=true");
  });

  it("includes isDeleted=false when passed false", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/programs", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([], { page: 1, limit: 10, count: 0, totalPages: 0 });
      }),
    );

    await getPrograms({ keyword: "x", isDeleted: "false" });

    expect(hitUrl).toContain("isDeleted=false");
  });
});
