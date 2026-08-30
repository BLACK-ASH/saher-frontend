import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { getParticipants, restoreParticipant } from "@/services/participant.api";
import { server } from "@/tests/test-server";

const envelope = (data: unknown) =>
  HttpResponse.json({ success: true, message: "ok", data });

const participantRow = {
  id: "p1",
  name: "Anita",
  age: 25,
  gender: "FEMALE",
};

describe("getParticipants isDeleted default filter (Pitfall 5)", () => {
  it("ALWAYS sends isDeleted=false even when called with no props", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/participants", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([participantRow]);
      }),
    );

    await getParticipants({});

    expect(hitUrl).toContain("isDeleted=false");
  });

  it("sends isDeleted=true when passed true (trash tab)", async () => {
    let hitUrl = "";
    server.use(
      http.get("/api/events/participants", ({ request }) => {
        hitUrl = new URL(request.url).href;
        return envelope([]);
      }),
    );

    await getParticipants({ isDeleted: "true" });

    expect(hitUrl).toContain("isDeleted=true");
  });
});

describe("restoreParticipant", () => {
  it("PATCHes /api/events/participants/restore/:id", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/events/participants/restore/p1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({
          success: true,
          message: "restored",
          data: null,
        });
      }),
    );

    await restoreParticipant("p1");

    expect(hitPath).toBe("/api/events/participants/restore/p1");
  });
});
