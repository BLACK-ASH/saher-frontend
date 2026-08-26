import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { useNotices } from "@/hooks/use-notice";
import { renderWithProviders } from "@/tests/render-with-providers";
import { server } from "@/tests/test-server";

const notices = [
  {
    _id: "1",
    title: "First",
    description: "A",
    expiresAt: "2026-09-15T00:00:00Z",
    isDeleted: false,
  },
  {
    _id: "2",
    title: "Second",
    description: "B",
    expiresAt: "2026-09-16T00:00:00Z",
    isDeleted: false,
  },
  {
    _id: "3",
    title: "Third",
    description: "C",
    expiresAt: "2026-09-17T00:00:00Z",
    isDeleted: false,
  },
];

describe("useNotices", () => {
  it("fetches the notice list and exposes all five mutations", async () => {
    server.use(
      http.get("/api/notice", () =>
        HttpResponse.json({ success: true, message: "ok", data: notices }),
      ),
    );

    let state: ReturnType<typeof useNotices> | undefined;
    function Probe() {
      state = useNotices();
      return null;
    }

    renderWithProviders(<Probe />);

    await waitFor(() => expect(state?.notices.data).toHaveLength(3));
    expect(state?.notices.data?.[0]?.title).toBe("First");

    const s = state as ReturnType<typeof useNotices>;
    for (const mutation of [
      s.addNotice,
      s.editNotice,
      s.removeNotice,
      s.restore,
      s.permanentRemove,
    ]) {
      expect(typeof mutation.mutate).toBe("function");
      expect(typeof mutation.isPending).toBe("boolean");
    }
  });
});
