import { useQuery } from "@tanstack/react-query";
import { getSearchUser } from "@/services/mail.api";
import type { MailUser } from "@/services/mail.api";

export const useUserMap = () => {
  const { data: users = [] } = useQuery({
    queryKey: ["users", "map"],
    queryFn: () => getSearchUser(""),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const resolveName = (userId?: string): string => {
    if (!userId) return "—";
    const name = userMap.get(userId);
    return name ?? userId.slice(-6);
  };

  return { resolveName, userMap };
};