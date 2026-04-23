import { apiFetch } from "@/lib/api-wrapper";
import { useQuery } from "@tanstack/react-query";

export type UserT = {
  readonly name: string;
  readonly displayName: string;
  readonly image: {
    id: string;
    alt: string;
    src: string;
  };
  readonly role: "user" | "manager" | "admin";
  readonly email: string;
  readonly id: string;
  readonly emailVerified: boolean;
  readonly isActive: boolean;
  readonly isBanned: boolean;
  readonly deletedAt?: Date | undefined;
  readonly deleteBy?:
    | {
        name: string;
        image: string;
        role: "user" | "manager" | "admin";
        email: string;
        displayName: string | undefined;
      }
    | undefined;
  readonly bannedAt?: Date | undefined;
  readonly bannedBy?:
    | {
        name: string;
        image: string;
        role: "user" | "manager" | "admin";
        email: string;
        displayName: string | undefined;
      }
    | undefined;
};

export const useMe = () => {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const res = await apiFetch<UserT>(`/api/auth/me`);
      // 🔥 IMPORTANT FIX
      if (!res.success) {
        return null;
      }
      return res.data;
    },
    retry: 3,
    staleTime: 1000 * 60,
  });
};
