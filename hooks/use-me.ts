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
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/me`
      );
      return res.data;
    },
    staleTime: 1000 * 60,
  });
};
