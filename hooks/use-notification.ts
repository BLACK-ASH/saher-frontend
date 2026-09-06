import {
  getNotification,
  getUnseenCount,
  markNotificationSeen,
  type NotificationResponseT,
} from "@/services/notification.api";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const NOTIF_KEYS = ["notification"] as const;

export const useNotification = () => {
  const queryClient = useQueryClient();

  const list = useInfiniteQuery({
    queryKey: NOTIF_KEYS,
    queryFn: ({ pageParam }) => getNotification(pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      pages.reduce((n, p) => n + p.items.length, 0) < lastPage.total
        ? pages.length + 1
        : undefined,
    retry: 3,
    staleTime: 1000 * 30,
  });

  const unseen = useQuery<number>({
    queryKey: [...NOTIF_KEYS, "unseen"],
    queryFn: getUnseenCount,
    retry: 3,
    staleTime: 1000 * 30,
  });

  const markSeen = useMutation({
    mutationFn: markNotificationSeen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS });
    },
  });

  const notifications =
    list.data?.pages.flatMap((p) => p.items) ?? ([] as NotificationResponseT[]);

  return {
    list,
    notifications,
    unseen,
    markSeen,
  };
};
