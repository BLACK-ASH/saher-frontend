import { apiFetch } from "@/lib/api-wrapper";
import { z } from "zod";

export const sessionSchema = z.object({
  id: z.string(),
  device: z.string(),
  ip: z.string(),
  lastActive: z.string(),
  current: z.boolean(),
});

export type SessionT = z.infer<typeof sessionSchema>;

export const getSessions = async () => {
  const res = await apiFetch<SessionT[]>("/api/auth/sessions", {
    method: "GET",
  });
  return res.data;
};

export const revokeSession = async (sessionId: string) => {
  const res = await apiFetch(`/api/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });
  return res.data;
};