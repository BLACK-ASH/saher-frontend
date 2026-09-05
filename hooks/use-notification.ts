import {
  getNotification,
  getUnseenCount,
  markNotificationSeen,
  type NotificationResponseT,
} from "@/services/notification.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const NOTIF_KEYS = ["notification"] as const;

export const useNotification = () => {
  const queryClient = useQueryClient();

  const list = useQuery<NotificationResponseT[]>({
    queryKey: NOTIF_KEYS,
    queryFn: getNotification,
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

  return {
    list,
    unseen,
    markSeen,
  };
};
