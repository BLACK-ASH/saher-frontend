import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleSessionDeath, performLogoutCleanup, resetSessionGuard } from "@/lib/session";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function fakeQueryClient() {
  return {
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("handleSessionDeath", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    resetSessionGuard();
    vi.stubGlobal("location", {
      ...window.location,
      assign: vi.fn(),
      pathname: "/attendance",
      search: "?page=2",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires toast + redirect exactly once across two concurrent calls", async () => {
    const qc = fakeQueryClient();
    await Promise.all([handleSessionDeath(qc), handleSessionDeath(qc)]);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(location.assign).toHaveBeenCalledTimes(1);
  });

  it("redirects to /login?next= with encoded current path", async () => {
    const qc = fakeQueryClient();
    await handleSessionDeath(qc);

    expect(location.assign).toHaveBeenCalledWith(
      "/login?next=%2Fattendance%3Fpage%3D2",
    );
  });

  it("calls cancelQueries before clear (in-flight stopped first)", async () => {
    const qc = fakeQueryClient();
    const callOrder: string[] = [];
    qc.cancelQueries.mockImplementation(() => {
      callOrder.push("cancel");
      return Promise.resolve();
    });
    qc.clear.mockImplementation(() => {
      callOrder.push("clear");
    });

    await handleSessionDeath(qc);

    expect(callOrder).toEqual(["cancel", "clear"]);
  });

  it("fires again after resetSessionGuard", async () => {
    const qc = fakeQueryClient();
    await handleSessionDeath(qc);
    expect(location.assign).toHaveBeenCalledTimes(1);

    resetSessionGuard();

    vi.stubGlobal("location", {
      ...window.location,
      assign: vi.fn(),
      pathname: "/dashboard",
      search: "",
    });

    await handleSessionDeath(qc);
    expect(location.assign).toHaveBeenCalledTimes(1);
    expect(location.assign).toHaveBeenCalledWith("/login?next=%2Fdashboard");
  });
});

describe("performLogoutCleanup", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    vi.stubGlobal("location", {
      ...window.location,
      assign: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls cancelQueries, clear, and redirects to /", () => {
    const qc = fakeQueryClient();
    performLogoutCleanup(qc);

    expect(qc.cancelQueries).toHaveBeenCalled();
    expect(qc.clear).toHaveBeenCalled();
    expect(location.assign).toHaveBeenCalledWith("/");
  });

  it("does NOT fire a toast", async () => {
    const qc = fakeQueryClient();
    performLogoutCleanup(qc);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("can be called repeatedly without guard interference", () => {
    const qc = fakeQueryClient();
    performLogoutCleanup(qc);
    performLogoutCleanup(qc);

    expect(location.assign).toHaveBeenCalledTimes(2);
  });
});
