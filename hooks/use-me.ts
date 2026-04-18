import { apiFetch } from "@/lib/api-wrapper";
import { useQuery } from "@tanstack/react-query";

export type User = {
  _id: string;
  name: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  role: string;
  image: {
    _id: string;
    src: string;
    alt: string;
  };
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  deletedAt: string | null;
};

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiFetch<User>(
        `/api/auth/me`
      );
      // 🔥 IMPORTANT FIX
      if (!res.success) {
        return null; // 👈 treat as "not logged in"
      }
      return res.data;
    },
    retry: 3,
    staleTime: 1000 * 60,
  });
};
