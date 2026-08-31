import { apiFetch } from "@/lib/api-wrapper";
import z from "zod";

export const notificationSchema = z.object({
  type: z.enum(["success", "info", "warn", "error"]),
  title: z.string(),
  description: z.string(),
  id: z.string(),
  isSeen: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string(),
  user: z.array(z.string()).optional(),
  action: z
    .object({
      type: z.enum(["download", "navigate", "external", "none"]),
      label: z.string(),
      url: z.string(),
      method: z.enum(["GET", "POST", "PATCH", "DELETE"]),
    })
    .optional(),
  seenAt: z.string().nullable().optional(),
});

export type NotificationResponseT = z.infer<typeof notificationSchema>;

export type NotificationListResponse = {
  data: NotificationResponseT[];
  unseenCount?: number;
};

export const getNotification = async () => {
  const res = await apiFetch<NotificationResponseT[]>("/api/notification/", {
    method: "GET",
  });
  return {
    data: res.data ?? [],
    unseenCount: res.meta?.unseenCount,
  } satisfies NotificationListResponse;
};
