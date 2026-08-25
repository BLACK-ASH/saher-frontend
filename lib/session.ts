import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";

// ========================
// SESSION DEATH HANDLER
// ========================
// ponytail: module-level once-guard accepted (A3) — guarantees exactly-once
// toast+redirect across concurrent dying queries without external coordination.

let died = false;

export function handleSessionDeath(queryClient: QueryClient): Promise<void> {
  if (died) return Promise.resolve();
  died = true;

  return Promise.resolve(queryClient.cancelQueries()).then(() => {
    queryClient.clear();
    toast.error("Session expired. Please login again.");
    // ponytail: hard navigation accepted (A3) — guarantees exactly-once
    // clean-tree semantics.
    const next = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.assign(`/login?next=${next}`);
  });
}

export function performLogoutCleanup(queryClient: QueryClient): void {
  queryClient.cancelQueries();
  queryClient.clear();
  // ponytail: redirect "/" not /login — avoids proxy.ts bouncing a
  // cookie-carrying browser back home (RESEARCH Pitfall 2).
  window.location.assign("/");
}

export function resetSessionGuard(): void {
  died = false;
}
