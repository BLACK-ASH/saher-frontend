import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-wrapper";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      return await apiFetch(`/api/auth/logout`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: [] });
      router.push("/");
    },
  });
};
