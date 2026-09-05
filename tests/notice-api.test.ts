import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  createNotice,
  deleteNotice,
  getNotices,
  permanentDeleteNotice,
  restoreNotice,
  updateNotice,
} from "@/services/notice.api";
import { server } from "@/tests/test-server";

const notice = {
  id: "1",
  title: "Test",
  description: "Desc",
  expiresAt: "2026-09-15T00:00:00Z",
  isDeleted: false,
};

describe("getNotices", () => {
  it("GETs /api/notice and returns the raw array from the envelope", async () => {
    let hitPath = "";
    server.use(
      http.get("/api/notice", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({
          success: true,
          message: "ok",
          data: [notice],
        });
      }),
    );

    const notices = await getNotices();

    expect(hitPath).toBe("/api/notice");
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe("Test");
  });
});

describe("createNotice", () => {
  it("POSTs /api/notice with the body and returns the created doc", async () => {
    let hitPath = "";
    let body: unknown;
    server.use(
      http.post("/api/notice", async ({ request }) => {
        hitPath = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({
          success: true,
          message: "created",
          data: { ...notice, id: "2", title: "New", description: "Body" },
        });
      }),
    );

    const created = await createNotice({ title: "New", description: "Body" });

    expect(hitPath).toBe("/api/notice");
    expect(body).toEqual({ title: "New", description: "Body" });
    expect(created.id).toBe("2");
  });
});

describe("updateNotice", () => {
  it("PUTs /api/notice/:id and returns the OLD doc (backend uses new:false)", async () => {
    let hitPath = "";
    server.use(
      http.put("/api/notice/1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({
          success: true,
          message: "updated",
          data: { ...notice, title: "Old Title", description: "Old Desc" },
        });
      }),
    );

    const oldDoc = await updateNotice("1", { title: "New Title" });

    // Service must surface res.data verbatim — the pre-update document
    expect(hitPath).toBe("/api/notice/1");
    expect(oldDoc.title).toBe("Old Title");
    expect(oldDoc.description).toBe("Old Desc");
  });
});

describe("deleteNotice", () => {
  it("DELETEs /api/notice/:id for a soft delete", async () => {
    let hitPath = "";
    server.use(
      http.delete("/api/notice/1", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({
          success: true,
          message: "deleted",
          data: null,
        });
      }),
    );

    await expect(deleteNotice("1")).resolves.toBeUndefined();
    expect(hitPath).toBe("/api/notice/1");
  });
});

describe("restoreNotice", () => {
  it("PATCHes /api/notice/:id/restore", async () => {
    let hitPath = "";
    server.use(
      http.patch("/api/notice/1/restore", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({
          success: true,
          message: "restored",
          data: null,
        });
      }),
    );

    await expect(restoreNotice("1")).resolves.toBeUndefined();
    expect(hitPath).toBe("/api/notice/1/restore");
  });
});

describe("permanentDeleteNotice", () => {
  it("DELETEs /api/notice/:id/permanent", async () => {
    let hitPath = "";
    server.use(
      http.delete("/api/notice/1/permanent", ({ request }) => {
        hitPath = new URL(request.url).pathname;
        return HttpResponse.json({
          success: true,
          message: "permanent",
          data: null,
        });
      }),
    );

    await expect(permanentDeleteNotice("1")).resolves.toBeUndefined();
    expect(hitPath).toBe("/api/notice/1/permanent");
  });
});
