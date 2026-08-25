import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RoleAccess from "./role-access";

const mockUseMe = vi.fn();

vi.mock("@/hooks/use-me", () => ({
  useMe: (...args: unknown[]) => mockUseMe(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("RoleAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("intern sees fallback, not children", () => {
    mockUseMe.mockReturnValue({
      data: { role: "intern", name: "Test", id: "1" },
      isLoading: false,
    });
    render(
      <RoleAccess allow={(r) => r === "admin"} fallback={<span>denied</span>}>
        <span>secret</span>
      </RoleAccess>,
      { wrapper },
    );
    expect(screen.getByText("denied")).toBeTruthy();
    expect(screen.queryByText("secret")).toBeNull();
  });

  it("admin sees children when predicate matches", () => {
    mockUseMe.mockReturnValue({
      data: { role: "admin", name: "Test", id: "1" },
      isLoading: false,
    });
    render(
      <RoleAccess allow={(r) => r === "admin"}>
        <span>secret</span>
      </RoleAccess>,
      { wrapper },
    );
    expect(screen.getByText("secret")).toBeTruthy();
  });

  it("loading shows loading node", () => {
    mockUseMe.mockReturnValue({ data: null, isLoading: true });
    render(
      <RoleAccess allow={(r) => r === "admin"} loading={<span>loading</span>}>
        <span>secret</span>
      </RoleAccess>,
      { wrapper },
    );
    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("secret")).toBeNull();
  });

  it("no user shows fallback", () => {
    mockUseMe.mockReturnValue({ data: null, isLoading: false });
    render(
      <RoleAccess allow={(r) => r === "admin"} fallback={<span>denied</span>}>
        <span>secret</span>
      </RoleAccess>,
      { wrapper },
    );
    expect(screen.getByText("denied")).toBeTruthy();
    expect(screen.queryByText("secret")).toBeNull();
  });
});
