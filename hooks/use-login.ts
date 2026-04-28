import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-wrapper";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiFetch(`/api/auth/login`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
    },
  });
};
