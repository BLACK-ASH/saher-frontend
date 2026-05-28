import { apiFetch } from "@/lib/api-wrapper";

export type NotificationResponseT = {
  readonly type: "success" | "info" | "warn" | "error";
  readonly title: string;
  readonly description: string;
  readonly id: string;
  readonly isSeen: boolean;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly user?: string[] | undefined;
  readonly action?:
    | {
        type: "download" | "navigate" | "external" | "none";
        label: string;
        url: string;
        method: "GET" | "POST" | "PATCH" | "DELETE";
      }
    | undefined;
  readonly seenAt: string | null | undefined;
};

export const getNotification = async () => {
  const res = await apiFetch<NotificationResponseT[]>("/api/notification/", {
    method: "GET",
  });
  return res.data;
};
