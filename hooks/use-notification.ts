import { getNotification, type NotificationResponseT } from "@/services/notification.api";
import { useQuery } from "@tanstack/react-query";

export const useNotification = () => {
  return useQuery<NotificationResponseT[]>({
    queryKey: ["notification"],
    queryFn: getNotification,
    retry: 3,
    staleTime: 1000 * 30,
  });
};
