import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavItem } from "./nav-list";
import React from "react";

const mockUseMe = vi.fn();
const mockPush = vi.fn();

vi.mock("@/hooks/use-me", () => ({
  useMe: (...args: unknown[]) => mockUseMe(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../ui/sidebar", () => {
  return {
    SidebarProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="sidebar-provider">{children}</div>
    ),
    SidebarGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    SidebarGroupContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SidebarMenu: ({ children }: { children: React.ReactNode }) => (
      <ul>{children}</ul>
    ),
    SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
      <li>{children}</li>
    ),
    SidebarMenuButton: ({
      children,
      tooltip,
    }: {
      children: React.ReactNode;
      tooltip?: string;
    }) => <button title={tooltip}>{children}</button>,
    SidebarMenuSkeleton: () => <li>skeleton</li>,
    useSidebar: () => ({ state: "expanded" }),
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <div>{children}</div>
    </QueryClientProvider>
  );
}

describe("nav-list sidebar visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("manager sees Manager group, not Admin", () => {
    mockUseMe.mockReturnValue({
      data: { role: "manager", name: "Test", id: "1" },
      isLoading: false,
    });
    render(<NavItem />, { wrapper });
    expect(screen.getByText("Manager")).toBeTruthy();
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("user sees neither Manager nor Admin group", () => {
    mockUseMe.mockReturnValue({
      data: { role: "user", name: "Test", id: "1" },
      isLoading: false,
    });
    render(<NavItem />, { wrapper });
    expect(screen.queryByText("Manager")).toBeNull();
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("admin sees both Manager and Admin group", () => {
    mockUseMe.mockReturnValue({
      data: { role: "admin", name: "Test", id: "1" },
      isLoading: false,
    });
    render(<NavItem />, { wrapper });
    expect(screen.getByText("Manager")).toBeTruthy();
    expect(screen.getByText("Admin")).toBeTruthy();
  });

  it("intern sees neither Manager nor Admin group", () => {
    mockUseMe.mockReturnValue({
      data: { role: "intern", name: "Test", id: "1" },
      isLoading: false,
    });
    render(<NavItem />, { wrapper });
    expect(screen.queryByText("Manager")).toBeNull();
    expect(screen.queryByText("Admin")).toBeNull();
  });
});
