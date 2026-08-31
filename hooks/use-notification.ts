import { getNotification, type NotificationListResponse } from "@/services/notification.api";
import { useQuery } from "@tanstack/react-query";

export const useNotification = () => {
  return useQuery<NotificationListResponse>({
    queryKey: ["notification"],
    queryFn: getNotification,
    retry: 3,
    staleTime: 1000 * 30,
    select: (res) => ({
      data: res.data,
      unseenCount: res.unseenCount ?? res.data.filter((n) => !n.isSeen).length,
    }),
  });
};
