import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-wrapper";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await apiFetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/logout`,
        {
          method: "POST",
        }
      );
    },
    onSuccess: () => {
      // ❌ clear user cache
      queryClient.removeQueries({ queryKey: ["me"] });
    },
  });
};
