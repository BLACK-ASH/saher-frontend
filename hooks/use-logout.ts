import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-wrapper";
import { performLogoutCleanup } from "@/lib/session";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiFetch(`/api/auth/logout`, {
          method: "POST",
        });
      } catch {
        // Best-effort: network failure or already-dead session must not trap user
      }
    },
    onSuccess: () => {
      performLogoutCleanup(queryClient);
    },
  });
};
