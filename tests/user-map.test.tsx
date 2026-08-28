import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { useUserMap } from "@/hooks/use-user-map";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const user = (id: string, name: string) => ({
  id,
  name,
  email: `${id}@example.com`,
  role: "staff",
  image: { id: `${id}-img`, src: `/${id}.png`, alt: name },
});

describe("useUserMap (D-32 incremental cache merge)", () => {
  it("merges cached searches, dedupes ids, falls back to short-id", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    // Two fake cached searches, one overlapping id.
    client.setQueryData(["users", "ali"], [user("u1", "Alice"), user("u2", "Bob")]);
    client.setQueryData(["users", "sa"], [user("u2", "Bobby"), user("u3", "Cara")]);

    let resolveName: ((id?: string) => string) | undefined;
    let mapSize = 0;

    function Probe() {
      const { userMap, resolveName: rn } = useUserMap();
      mapSize = userMap.size;
      resolveName = rn;
      return null;
    }

    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );

    // Duplicate u2 appears once; u1/u3 included → size 3.
    expect(mapSize).toBe(3);
    expect(resolveName?.("u1")).toBe("Alice");
    expect(resolveName?.("u2")).toBe("Bobby");
    expect(resolveName?.("u3")).toBe("Cara");
    // Unknown id → deterministic "…last6" fallback.
    expect(resolveName?.("abc123456789")).toMatch(/^….{6}$/);
    expect(resolveName?.("abc123456789")).toContain("456789");
  });

  it("empty cache falls back for every id", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    let resolveName: ((id?: string) => string) | undefined;

    function Probe() {
      resolveName = useUserMap().resolveName;
      return null;
    }

    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );

    expect(resolveName?.("abc123456789")).toMatch(/^….{6}$/);
  });
});