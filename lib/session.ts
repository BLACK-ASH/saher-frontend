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

  const path = window.location.pathname;
  const isPublic = ["/login", "/forgot-password"].some((r) =>
    path.startsWith(r),
  );

  return Promise.resolve(queryClient.cancelQueries()).then(() => {
    queryClient.clear();
    if (isPublic) return;
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
  window.location.assign("/login");
}

export function resetSessionGuard(): void {
  died = false;
}
