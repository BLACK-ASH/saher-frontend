import { useQueryClient } from "@tanstack/react-query";
import type { MailUser } from "@/services/mail.api";
import type { AdminUserResponse } from "@/services/admin.api";

// D-32: the backend /api/user/:keyword endpoint has NO list-all mode (verified
// against ../saher-backend/src/user/user.controller.ts — keyword-less GET
// returns only the caller's account). The map is therefore incremental: it
// merges every MailUser cached by the ["users", <keyword>] queries that the
// UserSearchPicker fires as staff type. Where the full directory is loaded —
// GET /api/admin/users under ["admin", "list"] (read:user, cached 7 days) —
// those names are merged too, so bill/attendance rows resolve to full names
// instead of a short id. Implementation stays dependency-light: derive the
// merged map during render from the query cache; no new queries.
export const useUserMap = () => {
  const queryClient = useQueryClient();

  const userMap = new Map<string, string>();

  const cachedQueries = queryClient.getQueryCache().findAll({ queryKey: ["users"] });
  for (const query of cachedQueries) {
    const data = (query.state?.data ?? []) as MailUser[];
    for (const user of data) {
      if (user?.id && user?.name) {
        // "later caches win" on conflict (D-32)
        userMap.set(user.id, user.name);
      }
    }
  }

  const directoryQueries = queryClient.getQueryCache().findAll({
    queryKey: ["admin", "list"],
  });
  for (const query of directoryQueries) {
    const list = query.state?.data as
      | { items: AdminUserResponse[] }
      | AdminUserResponse[]
      | undefined;
    const items = Array.isArray(list) ? list : list?.items ?? [];
    for (const user of items) {
      if (user?.id && user?.name) {
        userMap.set(user.id, user.name);
      }
    }
  }

  const resolveName = (userId?: string): string => {
    if (!userId) return "…";
    return userMap.get(userId) ?? "…" + userId.slice(-6);
  };

  return { userMap, resolveName };
};