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

// Backend paginates (GET /api/notification/?page&limit, cap 50) but caches the
// full list server-side; loop pages until we've collected everything so the
// notification box isn't stuck on the newest 10.
export const getNotification = async (): Promise<NotificationResponseT[]> => {
  const all: NotificationResponseT[] = [];
  const limit = 50;

  for (let page = 1; ; page++) {
    const res = await apiFetch<NotificationResponseT[]>(
      `/api/notification/?page=${page}&limit=${limit}`,
      { method: "GET" },
    );
    const items = res.data ?? [];
    all.push(...items);

    const total = typeof res.meta?.count === "number" ? res.meta.count : Infinity;
    if (all.length >= total || items.length < limit) break;
  }

  return all;
};

export const getUnseenCount = async (): Promise<number> => {
  const res = await apiFetch<NotificationResponseT[]>("/api/notification/un-seen", {
    method: "GET",
  });
  return res.meta?.count ?? 0;
};

export const markNotificationSeen = async (id: string): Promise<void> => {
  await apiFetch(`/api/notification/${id}`, { method: "PATCH" });
};
